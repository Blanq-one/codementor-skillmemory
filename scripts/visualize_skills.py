"""
Render the current cross-repo skill graph to an interactive HTML file.

Standalone CLI. Does not touch the API or LangGraph flow. It reuses the same
Cognee configuration as the wrapper module, then calls Cognee's
visualize_graph() and writes a self-contained HTML file to disk.

Run from the codeatlas/ directory:
    python -m scripts.visualize_skills [output.html]
"""
import asyncio
import sys
from pathlib import Path

# Windows console defaults to cp1252 which can't encode glyphs cognee emits.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Make sure the project root is on sys.path when run directly.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv
load_dotenv()  # pick up OPENAI_API_KEY and GRAPH_DB_* from .env

import cognee

# Read-only reuse of existing wrapper internals: same DB config, same dataset.
from codeatlas.services.memory.skill_memory import SKILL_DATASET, _configure


async def main() -> None:
    out_arg = sys.argv[1] if len(sys.argv) > 1 else "skill_graph.html"
    out_path = Path(out_arg).resolve()

    print("--- visualize_skills ---\n")
    print(f"[1] Configuring Cognee (dataset: {SKILL_DATASET})...")
    await _configure()

    print(f"[2] Rendering skill graph to HTML...")
    await cognee.visualize_graph(
        destination_file_path=str(out_path),
        dataset=SKILL_DATASET,
    )

    print(f"\nWrote interactive skill graph to:\n    {out_path}")


if __name__ == "__main__":
    asyncio.run(main())
