"""Append-only log of skills the librarian has distilled and saved.

Cognee (the skill graph) has no cheap "list everything" call, so we keep a
plain JSON log alongside it purely to power the Skill Library view. It records
what was learned, from which repo, and when. This is a read/display aid, not
the source of truth for recall (that stays in Cognee).
"""
from __future__ import annotations

import json
import logging
import time
from pathlib import Path

logger = logging.getLogger(__name__)

_FILE = "skills_log.json"


def _path(state_dir: str) -> Path:
    return Path(state_dir) / _FILE


def load_skills(state_dir: str) -> list[dict]:
    """Return logged skills (chronological). Missing/corrupt file -> []."""
    path = _path(state_dir)
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError) as exc:
        logger.warning("Could not read skills log at %s: %s", path, exc)
        return []


def append_skill(state_dir: str, method: str, source_repo: str) -> None:
    """Append one learned skill. Best-effort; never raises into the caller."""
    try:
        path = _path(state_dir)
        path.parent.mkdir(parents=True, exist_ok=True)
        entries = load_skills(state_dir)
        entries.append(
            {"method": method, "source_repo": source_repo, "ts": time.time()}
        )
        path.write_text(json.dumps(entries, indent=2), encoding="utf-8")
    except OSError as exc:
        logger.warning("Could not append to skills log: %s", exc)
