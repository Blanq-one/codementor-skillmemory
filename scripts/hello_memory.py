"""
Isolation test: prove Cognee save_skill → find_skills round-trip works
before wiring anything into LangGraph.

Run from the codeatlas/ directory:
    python -m scripts.hello_memory
"""
import asyncio
import sys
from pathlib import Path

# Windows console defaults to cp1252 which can't encode → and similar glyphs
# that cognee generates in its graph completion responses.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Make sure the project root is on sys.path when run directly.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv
load_dotenv()  # pick up OPENAI_API_KEY and GRAPH_DB_* from .env

from codeatlas.services.memory.skill_memory import (
    find_skills,
    save_skill,
)

EXAMPLE_SKILL = (
    "To find the auth flow in a web app, locate route registration, "
    "follow to the handler, then to middleware."
)


async def main() -> None:
    print("--- hello_memory: isolation test ---\n")

    # Note: we do NOT prune before recall. Cognee's forget() drops the
    # dataset's vector collection, and a same-process remember() does not
    # repopulate it, so a CHUNKS recall right after a prune finds nothing.
    # Save -> recall proves the round trip; cleanup prune runs at the end.
    print("[1] Saving skill:")
    print(f"    {EXAMPLE_SKILL}\n")
    await save_skill(EXAMPLE_SKILL)

    print("[2] Querying: 'where is login handled'\n")
    results = await find_skills("where is login handled")

    if not results:
        print("FAIL: no results returned.")
        sys.exit(1)

    print("PASS: skill retrieved.\n")
    print("Results:")
    for i, r in enumerate(results, 1):
        print(f"  {i}. {r}")


if __name__ == "__main__":
    asyncio.run(main())
