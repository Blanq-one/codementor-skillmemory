import asyncio
import json
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import TypedDict, Annotated, List, Dict, Any
from datetime import datetime

from langgraph.graph import END, StateGraph

from codeatlas.services.agents.interfaces import Agent
from codeatlas.services.agents.librarian_agent import LibrarianAgent
from codeatlas.services.agents.types import AnswerResult, GenerateResult
from codeatlas.models.agent_memory import AgentMemory
from codeatlas.services.memory.interfaces import MemoryStore
from codeatlas.services.memory.skill_memory import find_skills, save_skill


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


def _format_skills(results) -> str:
    """Flatten find_skills() results into a bullet list of skill texts."""
    if not results:
        return ""
    lines: List[str] = []
    for r in results:
        text = getattr(r, "text", None)
        if text is None and isinstance(r, dict):
            text = r.get("text")
        text = str(text if text is not None else r).strip()
        if text:
            lines.append(f"- {text}")
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
    ) -> None:
        self._planner = planner
        self._retrieval_agent = retrieval_agent
        self._analyst_agent = analyst_agent
        self._mentor_agent = mentor_agent
        self._memory_agent = memory_agent
        self._memory_store = memory_store
        self._librarian = librarian
        self._librarian_enabled = librarian_enabled and librarian is not None
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
        )
        
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
                "Prior learned skills from other repos. These are reusable methods, "
                "not facts about this repo. Adapt them when planning:\n"
                f"{recalled}\n\n"
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
        try:
            results = _run_async(find_skills(question))
            skills_text = _format_skills(results)
            if skills_text:
                self._logger.info(
                    "Recalled prior skills for planning:\n%s", skills_text
                )
        except Exception as exc:
            self._logger.warning("Skill recall failed: %s", exc)
            skills_text = ""
        return {**state, "recalled_skills": skills_text}

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
