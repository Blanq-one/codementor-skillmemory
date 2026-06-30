"""
Single point of contact for Cognee. Import nothing from cognee outside this file.
Public API: save_skill, find_skills, consolidate, prune_skill.
"""
from __future__ import annotations

import os

import cognee
from cognee import SearchType

SKILL_DATASET = "skills"

_configured = False


async def _configure() -> None:
    global _configured
    if _configured:
        return

    graph_url = os.getenv("GRAPH_DB_URL")
    graph_port = os.getenv("GRAPH_DB_PORT")

    if graph_url and graph_port:
        try:
            import cognee_community_hybrid_adapter_falkor.register  # noqa: F401
            from cognee import config as cognee_config
            cognee_config.set_vector_db_config({
                "vector_db_provider": "falkor",
                "vector_db_url": graph_url,
                "vector_db_port": int(graph_port),
            })
            cognee_config.set_graph_db_config({
                "graph_database_provider": "falkor",
                "graph_database_url": graph_url,
                "graph_database_port": int(graph_port),
            })
        except ImportError:
            pass  # FalkorDB adapter not installed; fall through to defaults

    # Cognee uses its own config cache; bridge from OPENAI_API_KEY if present.
    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        from cognee import config as cognee_config
        cognee_config.set_llm_api_key(openai_key)

    _configured = True


async def save_skill(
    text: str, dataset: str = SKILL_DATASET, source_repo: str | None = None
) -> None:
    """Persist a transferable code-understanding skill. Maps to cognee.remember().

    source_repo tags the skill with the repo it was learned from. The tag is
    embedded in the stored text so it becomes part of the knowledge graph and
    survives recall, without leaking into the transferable method itself.
    """
    await _configure()
    payload = text
    if source_repo:
        payload = f"[Learned from repo: {source_repo}]\n{text}"
    await cognee.remember(payload, dataset_name=dataset)


async def find_skills(query: str, dataset: str = SKILL_DATASET, top_k: int = 5) -> list:
    """Retrieve skills relevant to a query. Maps to cognee.recall()."""
    await _configure()
    return await cognee.recall(
        query_text=query,
        query_type=SearchType.GRAPH_COMPLETION,
        top_k=top_k,
    )


async def consolidate(dataset: str = SKILL_DATASET) -> None:
    """Merge near-duplicate skills and strengthen useful ones. Maps to cognee.memify()."""
    await _configure()
    await cognee.memify(dataset=dataset)


async def prune_skill(dataset: str = SKILL_DATASET) -> None:
    """Delete a skill dataset entirely. Maps to cognee.forget()."""
    await _configure()
    await cognee.forget(dataset=dataset)
