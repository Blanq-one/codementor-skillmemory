# SkillMemory — Cross-Repo Agentic Code Intelligence

SkillMemory is an agent that learns *how to read code* and carries that skill
across repositories. It ingests a codebase, builds a retrieval index and a
dependency graph, and answers natural-language questions about it — and as it
answers, it distills **transferable navigation skills** ("to find the auth flow,
locate route registration → follow to the handler → then the middleware") and
recalls them the next time it meets a repo it has never seen.

The more repos it studies, the sharper its first answer on a new one.

## Two memory layers (kept separate on purpose)

- **FAISS (per-repo retrieval).** Answers *"where in THIS repo?"* — vector search
  over code chunks for the active repository.
- **Cognee (cross-repo skill memory).** Answers *"what method worked across
  repos?"* — a knowledge graph of reusable skills the agent has learned, recalled
  and adapted on new repositories.

## How it works

A LangGraph multi-agent flow orchestrates each question:

```
librarian.recall → planner → dispatcher ─┬─ retrieval (FAISS RAG)
                                          ├─ analyst   (structure + dep graph)
                                          ├─ mentor    (senior-engineer review)
                                          └─ memory
                                   → validator → librarian.save
```

- **Librarian** recalls candidate skills from Cognee before planning, and after a
  validated answer distills a new transferable skill back into memory.
- **Planner** decides which skills genuinely fit the current repo (used) vs. which
  don't transfer (ignored, with a reason) — surfaced in the UI's Recall Rail.
- The agent can also generate a **repo-structure diagram** (Mermaid) grounded in
  the real import graph when you ask it to "diagram" or "visualize" a repo.

## Features

- Study any public Git repo (clone → parse via tree-sitter → dependency graph →
  embed/index).
- Ask questions scoped to a repo, with streaming answers, tool-call trace, and
  code blocks.
- **Recall Rail** — see which skills learned on other repos were applied, adapted,
  or didn't transfer for the current question.
- **Skill library** — browse everything the librarian has learned across repos.
- **Telemetry** dashboard and repo-structure diagrams.
- Cognee runs on **FalkorDB** (hybrid vector + graph) when available, and falls
  back to an **embedded** store (LanceDB + Kuzu) when it isn't.

## Tech stack

- **Backend:** FastAPI, LangGraph, Cognee, FAISS, sentence-transformers,
  tree-sitter, Prometheus.
- **Frontend:** React + Vite + TypeScript, Tailwind CSS v4, shadcn/ui, Vercel AI
  Elements, Recharts, Motion, react-router.

## Quick start

### 1. Backend (API on `:8000`)

```bash
pip install -r requirements.txt
cp .env.example .env        # then edit .env (see Configuration)
uvicorn codeatlas.app.main:app --port 8000 --reload
```

Sanity check:

```bash
curl http://localhost:8000/repos          # -> {"repo_ids":[...]}
```

### 2. Frontend (dev server on `:5173`, proxies the API)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173/`:

- **Landing** (`/`) — study a new repo (paste a Git URL) or open a studied one.
- **Repo workspace** (`/repo/<id>/chat`) — the agent chat for that repo, plus
  telemetry and the skill library.

### Ingest a repo from the API directly

```bash
curl -X POST http://localhost:8000/analyze-repo \
  -H 'Content-Type: application/json' \
  -d '{"repo_url":"https://github.com/owner/repo"}'
```

Cloning + parsing runs inline (can take a few minutes for large repos); embedding
then continues in the background.

## Configuration

Set in `.env` (see `.env.example`):

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | LLM + embeddings for the agents and Cognee cognify |
| `GRAPH_DB_URL` / `GRAPH_DB_PORT` | FalkorDB host/port for Cognee. If unset or unreachable, Cognee falls back to the embedded store |
| `ENABLE_BACKEND_ACCESS_CONTROL` | Cognee multi-tenant access control; kept `false` for the single-user hybrid backend |
| `CODEATLAS_LIBRARIAN_ENABLED` | Enable skill recall/save (default `true`) |
| `CODEATLAS_EMBEDDING_PROVIDER` | `sentence` (default) or `hash` (no model download) |
| `CODEATLAS_EMBEDDING_MODEL` | sentence-transformers model name |
| `CODEATLAS_INDEX_DIR` | FAISS index storage path (default `.codeatlas/indexes`) |
| `CODEATLAS_STATE_DIR` | repo state + skill log storage path (default `.codeatlas/state`) |
| `CODEATLAS_LLM_PROVIDER` / `CODEATLAS_LLM_MODEL` | LLM provider/model |

### FalkorDB (optional)

```bash
docker compose up -d falkordb
docker exec codeatlas-falkordb-1 redis-cli ping   # -> PONG
```

If FalkorDB isn't running, the app logs the fallback and uses the embedded store —
skills still save and recall, just without the shared graph backend.

## API

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/ask` | Ask a question about a repo (`{repo_id, question}`) |
| `GET` | `/repos` | List studied repositories |
| `POST` | `/analyze-repo` | Ingest a repo (`{repo_url}`) |
| `GET` | `/skills` | List transferable skills the librarian has learned |
| `POST` | `/explain`, `/search`, `/dependencies`, `/repo-overview`, `/files`, `/generate-code` | Additional code-intelligence endpoints |
| `GET` | `/metrics` | Prometheus metrics |

## Tests

```bash
pytest                    # backend
cd frontend && npm test   # frontend (vitest)
```

## Docker & monitoring

```bash
docker build -t codeatlas .
docker run -p 8000:8000 codeatlas

# Prometheus + Grafana
docker compose -f docker-compose.monitoring.yml up --build
# Prometheus: http://localhost:9090   Grafana: http://localhost:3000 (admin/admin)
```

## Project layout

```
codeatlas/            FastAPI app, agents, services (retrieval, memory, diagram, state)
frontend/             React + Vite UI (landing, repo workspace, skill library)
tests/                pytest suite
docker-compose*.yml   FalkorDB + monitoring stacks
```
