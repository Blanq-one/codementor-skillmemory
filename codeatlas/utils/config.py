import os
from dataclasses import dataclass


@dataclass(frozen=True)
class AppConfig:
    embedding_provider: str
    embedding_model: str
    index_dir: str
    state_dir: str
    llm_provider: str
    llm_model: str
    llm_temperature: float
    api_key: str | None
    auth_enabled: bool
    librarian_enabled: bool
    librarian_broaden: bool


def load_config() -> AppConfig:
    return AppConfig(
        embedding_provider=os.getenv("CODEATLAS_EMBEDDING_PROVIDER", "sentence"),
        embedding_model=os.getenv("CODEATLAS_EMBEDDING_MODEL", "all-MiniLM-L6-v2"),
        index_dir=os.getenv("CODEATLAS_INDEX_DIR", ".codeatlas/indexes"),
        state_dir=os.getenv("CODEATLAS_STATE_DIR", ".codeatlas/state"),
        llm_provider=os.getenv("CODEATLAS_LLM_PROVIDER", "openai"),
        llm_model=os.getenv("CODEATLAS_LLM_MODEL", "gpt-4o-mini"),
        llm_temperature=float(os.getenv("CODEATLAS_LLM_TEMPERATURE", "0.2")),
        api_key=os.getenv("CODEATLAS_API_KEY"),
        auth_enabled=os.getenv("CODEATLAS_AUTH_ENABLED", "false").lower() == "true",
        librarian_enabled=os.getenv("CODEATLAS_LIBRARIAN_ENABLED", "true").lower()
        == "true",
        # Discrimination-demo variant: broaden recall (higher top_k) so more
        # candidate skills surface and the planner must explicitly select/ignore.
        librarian_broaden=os.getenv("CODEATLAS_LIBRARIAN_BROADEN", "false").lower()
        == "true",
    )
