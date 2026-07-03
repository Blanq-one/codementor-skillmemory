/**
 * Static mock of one agent session on a repo it has never seen (a FastAPI
 * payments API), answering by recalling skills learned on earlier repos.
 * Nothing here is wired to a backend.
 */
import type { ToolUIPart } from "ai"

export type RecallState = "used" | "adapted" | "ignored"

export type RecalledSkill = {
  id: string
  method: string
  sourceRepo: string
  state: RecallState
  confidence?: number // 0..1 — only the scripted mock sets this; the live
  // backend has no similarity score to surface, so the Rail spine is hidden.
  note?: string
}

export type RunTool = {
  id: string
  type: ToolUIPart["type"]
  input: Record<string, unknown>
  output: string
}

export const SESSION = {
  id: "sesh_9f2c14",
  targetRepo: "acme/payments-api",
  stack: "python · fastapi",
  reposSeen: 47,
}

export const QUESTION = "How does authentication work in this repo?"

export const RECALLED_SKILLS: RecalledSkill[] = [
  {
    id: "sk_auth_trace",
    method: "Trace auth: route registration → handler → middleware",
    sourceRepo: "pallets/flask-shop",
    state: "adapted",
    confidence: 0.91,
    note: "FastAPI has no decorators-as-middleware; mapped the middleware hop onto Depends().",
  },
  {
    id: "sk_session_factory",
    method: "Find the DB layer by locating the session factory first",
    sourceRepo: "django/mysite",
    state: "used",
    confidence: 0.84,
  },
  {
    id: "sk_config_precedence",
    method: "Resolve config precedence from .env before reading code",
    sourceRepo: "expressjs/rest-api",
    state: "ignored",
    confidence: 0.38,
    note: "This repo uses pydantic Settings, not dotenv — prior method didn't transfer.",
  },
]

export const RUN_TOOLS: RunTool[] = [
  {
    id: "t1",
    type: "tool-locate_route_registration",
    input: { repo: SESSION.targetRepo, pattern: "APIRouter|@app." },
    output: "14 routes across 3 routers: auth, users, payments",
  },
  {
    id: "t2",
    type: "tool-follow_to_handler",
    input: { endpoint: "POST /auth/login" },
    output: "handlers/auth.py → login()",
  },
  {
    id: "t3",
    type: "tool-scan_dependencies",
    input: { symbol: "login", depth: 2 },
    output: "Depends(get_current_user) → security/jwt.py:verify()",
  },
]

export const REASONING_MD = `This reads as a **web-app auth** question. I recalled a skill from \`pallets/flask-shop\` — *trace route → handler → middleware* — but this repo is FastAPI, so I'm **adapting** the middleware step to FastAPI's \`Depends()\` dependency chain before applying it.`

export const CHAIN_STEPS = [
  { label: "Recognized auth intent, pulled 3 candidate skills", status: "complete" as const, meta: "0.12s" },
  { label: "Adapted flask middleware step → FastAPI Depends()", status: "complete" as const, meta: "0.31s" },
  { label: "Located route registration across routers", status: "complete" as const, meta: "0.44s" },
  { label: "Followed login route into the dependency chain", status: "active" as const, meta: "live" },
]

export const ANSWER_MD = `Authentication is a three-hop chain, and the third hop is where this repo differs from the ones I've seen:

1. **Routes** register on \`APIRouter\` instances in \`routers/auth.py\`
2. Each route resolves to a **handler**, e.g. \`POST /auth/login\` → \`login()\`
3. Instead of middleware, protected routes declare \`Depends(get_current_user)\`, which runs the JWT check in \`security/jwt.py\`

So the token check isn't a middleware layer — it's a **dependency** injected per-route. That's the one place the flask skill needed adapting.`

export const ANSWER_CODE = `# routers/users.py
from fastapi import APIRouter, Depends
from security.jwt import get_current_user

router = APIRouter(prefix="/users")

@router.get("/me")
async def read_me(user = Depends(get_current_user)):
    # get_current_user runs the JWT check before this body
    return user`
