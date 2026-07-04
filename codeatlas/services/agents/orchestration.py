import asyncio
import json
import logging
import re
from concurrent.futures import ThreadPoolExecutor
from typing import TypedDict, Annotated, List, Dict, Any
from datetime import datetime

from langgraph.graph import END, StateGraph

from codeatlas.services.agents.interfaces import Agent
from codeatlas.services.agents.librarian_agent import LibrarianAgent
from codeatlas.services.agents.types import AnswerResult, GenerateResult, SkillView
from codeatlas.models.agent_memory import AgentMemory
from codeatlas.services.memory.interfaces import MemoryStore
from codeatlas.services.memory.skill_memory import find_skills, save_skill
from codeatlas.services.memory.skill_log import append_skill


def _run_async(coro):
    """Run an async coroutine from a sync graph node.

    handle_question runs in FastAPI's threadpool (no live event loop), so
    asyncio.run works directly. If a loop is already running, fall back to a
    dedicated thread so we never block or reuse a running loop.
    """
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(coro)
    with ThreadPoolExecutor(max_workers=1) as pool:
        return pool.submit(lambda: asyncio.run(coro)).result()


_SOURCE_RE = re.compile(r"^\[Learned from repo:\s*(.*?)\]\s*(.*)$", re.DOTALL)


def _split_source(text: str) -> tuple[str, str]:
    """Separate a stored skill into (source_repo, method)."""
    match = _SOURCE_RE.match(text.strip())
    if match:
        return match.group(1).strip(), match.group(2).strip()
    return "unknown", text.strip()


def _format_candidates(texts) -> str:
    """Render recalled skill texts as a numbered candidate list with sources.

    Each candidate keeps its provenance visible so the planner can judge
    relevance and we can see which it used vs ignored.
    """
    if not texts:
        return ""
    lines: List[str] = []
    for i, text in enumerate(texts, 1):
        source, method = _split_source(text)
        lines.append(f"{i}. (source repo: {source}) {method}")
    return "\n".join(lines)


# Define the state for the graph
class OrchestratorState(TypedDict):
    question: str
    repo_id: str
    plan: Dict[str, Any]
    current_step_index: int
    results: List[str]
    final_answer: str
    validated: bool
    recalled_skills: str
    recalled_candidates: List[str]
    skill_saved: bool

class AgentOrchestrator:
    def __init__(
        self,
        planner: Agent,
        retrieval_agent: Agent,
        analyst_agent: Agent,
        mentor_agent: Agent,
        memory_agent: Agent,
        memory_store: MemoryStore | None = None,
        librarian: LibrarianAgent | None = None,
        librarian_enabled: bool = False,
        librarian_broaden: bool = False,
        skill_log_dir: str | None = None,
    ) -> None:
        self._planner = planner
        self._retrieval_agent = retrieval_agent
        self._analyst_agent = analyst_agent
        self._mentor_agent = mentor_agent
        self._memory_agent = memory_agent
        self._memory_store = memory_store
        self._librarian = librarian
        self._skill_log_dir = skill_log_dir
        self._librarian_enabled = librarian_enabled and librarian is not None
        # Clean config recalls a tight top_k; broaden mode widens it so more
        # candidates surface and the planner must discriminate explicitly.
        self._recall_top_k = 25 if librarian_broaden else 5
        self._logger = logging.getLogger(__name__)

        self._graph = self._build_graph()

    def handle_question(self, question: str, repo_id: str) -> AnswerResult:
        initial_state: OrchestratorState = {
            "question": question,
            "repo_id": repo_id,
            "plan": {},
            "current_step_index": 0,
            "results": [],
            "final_answer": "",
            "validated": False,
            "recalled_skills": "",
            "recalled_candidates": [],
            "skill_saved": False,
        }
        final_state = self._graph.invoke(initial_state)

        # Construct the final result from the state
        reasoning = [f"Plan: {json.dumps(final_state.get('plan', {}))}"]
        reasoning.extend(final_state.get("results", []))

        return AnswerResult(
            answer=final_state.get("final_answer", "No answer generated."),
            citations=[], # Citations execution logic to be refined
            reasoning_steps=reasoning,
            skills=self._build_skill_views(final_state),
        )

    def _build_skill_views(self, final_state: OrchestratorState) -> List[SkillView]:
        """Map recalled candidates + the planner's selection into client-facing
        skill views: each is either 'used' (cyan) or 'ignored' (amber, with a
        rejection reason where the planner gave one)."""
        candidates = final_state.get("recalled_candidates", []) or []
        if not candidates:
            return []
        plan = final_state.get("plan", {}) or {}

        used: set[int] = set()
        for n in plan.get("skills_used", []) or []:
            try:
                used.add(int(n))
            except (TypeError, ValueError):
                continue

        ignored_reasons: Dict[int, str] = {}
        for item in plan.get("skills_ignored", []) or []:
            if isinstance(item, dict) and item.get("n") is not None:
                try:
                    ignored_reasons[int(item["n"])] = (item.get("reason") or "").strip()
                except (TypeError, ValueError):
                    continue

        views: List[SkillView] = []
        for i, text in enumerate(candidates, 1):
            source, method = _split_source(text)
            if i in used:
                views.append(SkillView(method=method, source_repo=source, state="used"))
            else:
                views.append(
                    SkillView(
                        method=method,
                        source_repo=source,
                        state="ignored",
                        reason=ignored_reasons.get(i) or None,
                    )
                )
        return views
        
    def _build_graph(self):
        graph = StateGraph(OrchestratorState)

        # Librarian hooks: recall before planning, save after validation.
        graph.add_node("librarian_recall", self._librarian_recall_node)
        graph.add_node("librarian_save", self._librarian_save_node)
        graph.add_node("planner", self._plan_node)
        graph.add_node("dispatcher", self._dispatcher_node)
        graph.add_node("retrieval", self._retrieval_node)
        graph.add_node("analyst", self._analyst_node)
        graph.add_node("mentor", self._mentor_node)
        graph.add_node("memory", self._memory_node)
        graph.add_node("validator", self._validator_node)

        # When the librarian is enabled, recall runs first and feeds the planner.
        if self._librarian_enabled:
            graph.set_entry_point("librarian_recall")
            graph.add_edge("librarian_recall", "planner")
        else:
            graph.set_entry_point("planner")

        graph.add_edge("planner", "dispatcher")

        # Dispatcher conditional edges
        graph.add_conditional_edges(
            "dispatcher",
            self._route_step,
            {
                "retrieval": "retrieval",
                "analyst": "analyst",
                "mentor": "mentor",
                "memory": "memory",
                "validator": "validator",
                "librarian_save": "librarian_save",
                "end": END
            }
        )

        # Return to dispatcher after each agent
        graph.add_edge("retrieval", "dispatcher")
        graph.add_edge("analyst", "dispatcher")
        graph.add_edge("mentor", "dispatcher")
        graph.add_edge("memory", "dispatcher")
        graph.add_edge("validator", "dispatcher")
        # Save distilled skill last, then finish.
        graph.add_edge("librarian_save", END)

        return graph.compile()

    # ... _plan_node, _dispatcher_node same ...

    def _plan_node(self, state: OrchestratorState) -> OrchestratorState:
        question = state["question"]
        repo_id = state["repo_id"]
        recalled = state.get("recalled_skills", "")
        if recalled:
            planner_input = (
                "CANDIDATE skills recalled from memory, learned on OTHER repos. "
                "Each is numbered and labelled with its source repo. They are "
                "reusable methods, not facts about the current repo:\n"
                f"{recalled}\n\n"
                "Instructions:\n"
                "- Use ONLY candidate skills whose method genuinely fits the "
                "current repo and question; adapt them into your steps.\n"
                "- Do not force an irrelevant method onto this repo.\n"
                "- In your JSON output, in addition to \"steps\", include "
                "\"skills_used\" (list of candidate numbers you applied) and "
                "\"skills_ignored\" (list of {\"n\": number, \"reason\": short "
                "reason}).\n"
                "- EVERY candidate number listed above MUST appear in exactly "
                "one of those two arrays. Never omit a candidate: if it does "
                "not fit this repo's domain, put it in skills_ignored with a "
                "concrete reason.\n\n"
                f"User question: {question}"
            )
        else:
            planner_input = question
        try:
            plan_str = self._planner.run(planner_input, repo_id)
            plan = json.loads(plan_str)
        except Exception as e:
            self._logger.error(f"Planning failed: {e}")
            # Fallback plan
            plan = {"steps": [{"agent": "retrieval", "instruction": question}]}
        
        return {**state, "plan": plan, "current_step_index": 0}

    def _dispatcher_node(self, state: OrchestratorState) -> OrchestratorState:
        # Passthrough node (logic in _route_step), but can be used for logging
        return state

    def _route_step(self, state: OrchestratorState) -> str:
        steps = state["plan"].get("steps", [])
        idx = state["current_step_index"]
        
        if idx >= len(steps):
             if not state.get("validated"):
                 return "validator"
             if self._librarian_enabled and not state.get("skill_saved"):
                 return "librarian_save"
             return "end"
            
        step = steps[idx]
        agent_name = step.get("agent", "retrieval").lower()
        
        if agent_name in ["retrieval", "analyst", "mentor", "memory"]:
            return agent_name
        return "end"

    # ... _execute_agent same ...

    def _validator_node(self, state: OrchestratorState) -> OrchestratorState:
        # Simple validation: "Does this answer the question?"
        # We reuse the Mentor Agent for this reflective task
        question = state["question"]
        current_answer = state["final_answer"]
        repo_id = state["repo_id"]
        
        if not current_answer:
             return {**state, "validated": True}

        prompt = (
            f"Review the following answer to the user's question.\n"
            f"User Question: {question}\n"
            f"Proposed Answer: {current_answer}\n\n"
            f"If the answer is comprehensive and correct, return it as is. "
            f"If it is missing details or unclear, refine it."
        )
        
        try:
             # The MentorAgent is styled as a senior engineer, good for review
             refined_answer = self._mentor_agent.run(prompt, repo_id)
        except Exception:
             refined_answer = current_answer
             
        return {
            **state,
            "final_answer": refined_answer,
            "validated": True,
            "results": state["results"] + [f"Validation: Refined answer."],
        }

    def _execute_agent(self, agent: Agent, state: OrchestratorState) -> OrchestratorState:
        steps = state["plan"].get("steps", [])
        idx = state["current_step_index"]
        step = steps[idx]
        
        instruction = step.get("instruction", "")
        repo_id = state["repo_id"]
        
        # Add context from previous results if available
        context = "\n".join(state["results"])
        if context:
            full_prompt = f"{instruction}\n\nContext from previous steps:\n{context}"
        else:
            full_prompt = instruction
            
        try:
            output = agent.run(full_prompt, repo_id)
        except Exception as e:
            output = f"Error executing {step.get('agent')}: {e}"
            
        new_results = state["results"] + [f"Step {idx+1} ({step.get('agent')}): {output}"]
        
        # Update final answer with the latest output (heuristic)
        return {
            **state,
            "results": new_results,
            "final_answer": output,
            "current_step_index": idx + 1
        }

    def _retrieval_node(self, state: OrchestratorState) -> OrchestratorState:
        return self._execute_agent(self._retrieval_agent, state)

    def _analyst_node(self, state: OrchestratorState) -> OrchestratorState:
        return self._execute_agent(self._analyst_agent, state)

    def _mentor_node(self, state: OrchestratorState) -> OrchestratorState:
        return self._execute_agent(self._mentor_agent, state)

    def _memory_node(self, state: OrchestratorState) -> OrchestratorState:
        return self._execute_agent(self._memory_agent, state)

    def _librarian_recall_node(self, state: OrchestratorState) -> OrchestratorState:
        """Recall transferable skills learned on other repos before planning."""
        question = state["question"]
        results: List[str] = []
        try:
            results = _run_async(find_skills(question, top_k=self._recall_top_k))
            skills_text = _format_candidates(results)
            if skills_text:
                self._logger.info(
                    "Recalled candidate skills for planning:\n%s", skills_text
                )
        except Exception as exc:
            self._logger.warning("Skill recall failed: %s", exc)
            skills_text = ""
        return {**state, "recalled_skills": skills_text, "recalled_candidates": results}

    def _librarian_save_node(self, state: OrchestratorState) -> OrchestratorState:
        """Distill the final answer into a transferable method and save it."""
        question = state["question"]
        answer = state["final_answer"]
        repo_id = state["repo_id"]
        if not answer or self._librarian is None:
            return {**state, "skill_saved": True}

        note = "Librarian: no transferable skill distilled."
        try:
            method = self._librarian.distill(question, answer)
            if method:
                _run_async(save_skill(method, source_repo=repo_id))
                # Mirror to the JSON log that powers the Skill Library view.
                if self._skill_log_dir:
                    append_skill(self._skill_log_dir, method, source_repo=repo_id)
                self._logger.info("Saved transferable skill from repo %s", repo_id)
                note = f"Librarian: saved transferable skill -> {method}"
        except Exception as exc:
            self._logger.warning("Skill save failed: %s", exc)
            note = f"Librarian: skill save failed: {exc}"

        return {
            **state,
            "skill_saved": True,
            "results": state["results"] + [note],
        }
