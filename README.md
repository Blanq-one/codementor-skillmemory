# CodeAtlas — Agentic Code Intelligence Platform (MVP Skeleton)

This repository contains a clean MVC + SOLID-compliant Python skeleton for the
CodeAtlas MVP. It focuses on structure, interfaces, and dependency inversion so
the system can scale into a production-grade platform.

## What’s Included
- **FastAPI controllers** for analysis, search, dependencies, overview, explain, metrics
- **Domain services** for ingestion, parsing, retrieval, indexing, QA, memory
- **LangGraph orchestration** with planner → answer/explain routing
- **RAG pipeline** with embeddings, FAISS, reranking, and citations
- **Persistence** for repo state and FAISS index across restarts
- **Streamlit view** for full workflow operations
- **Observability** via Prometheus metrics and structured logs

## Quick Start
```bash
pip install -r requirements.txt
uvicorn codeatlas.app.main:app --reload
```

Streamlit UI:
```bash
streamlit run codeatlas/views/streamlit_app.py
```

Website Link:
```
https://codemento-ai.vercel.app/
```

## Configuration
Environment variables:
- `CODEATLAS_EMBEDDING_PROVIDER` = `sentence` or `hash`
- `CODEATLAS_EMBEDDING_MODEL` = sentence-transformers model name
- `CODEATLAS_INDEX_DIR` = FAISS index storage path
- `CODEATLAS_STATE_DIR` = repo state storage path
- `CODEATLAS_LLM_PROVIDER` = `openai` (default)
- `CODEATLAS_LLM_MODEL` = LLM model name
- `CODEATLAS_LLM_TEMPERATURE` = float
- `CODEATLAS_API_KEY` = API key when auth is enabled
- `CODEATLAS_AUTH_ENABLED` = `true` / `false`

When auth is enabled, include `X-API-Key` in every request.

## Docker
```bash
docker build -t codeatlas .
docker run -p 8000:8000 codeatlas
```

## Monitoring (Free, Local)
```bash
docker compose -f docker-compose.monitoring.yml up --build
```
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000` (admin/admin on first login)

## Free Deployment Options (Student-Friendly)
- **Render**: free web service tier for simple APIs.
- **Railway**: free tier with limited usage.
- **Fly.io**: small free allowance for lightweight apps.
- **GitHub Actions**: CI is free for public repos.

Tips:
- Use `CODEATLAS_EMBEDDING_PROVIDER=hash` to avoid GPU/model downloads.
- Keep `.codeatlas/` on a persistent volume if the platform supports it.
