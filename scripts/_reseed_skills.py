"""Reset the skills dataset to two canonical, cleanly-tagged skills so the
cross-domain transfer test has unambiguous provenance.

  1. pipeline-navigation  -> tagged to the pneumonia repo
  2. auth-flow            -> tagged to a web-app repo (the distractor)
"""
import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv
load_dotenv()

from codeatlas.services.memory.skill_memory import prune_skill, save_skill

PNEUMONIA_REPO = "828f7470-2583-40d1-9811-1666e2be87bd"
WEBAPP_REPO = "webapp-auth-demo"

PIPELINE_SKILL = (
    "To understand the overall processing pipeline of any codebase, identify the "
    "main entry point, then trace the flow of data through its stages in order -- "
    "input/loading, processing/transformation, then output -- noting how the "
    "components are wired together and where logging happens."
)
AUTH_SKILL = (
    "To find the auth flow in a web app, locate route registration, follow to the "
    "request handler, then to the middleware that enforces credentials and sessions."
)


async def main():
    await prune_skill()
    await save_skill(PIPELINE_SKILL, source_repo=PNEUMONIA_REPO)
    await save_skill(AUTH_SKILL, source_repo=WEBAPP_REPO)
    print("RESEED_OK: pipeline(pneumonia) + auth(webapp) saved to skills dataset")


if __name__ == "__main__":
    asyncio.run(main())
