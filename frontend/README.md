# CodeAtlas frontend

Vite + React UI for CodeAtlas. Left pane: `/ask` plus the skills the memory
recalled (used vs recalled-but-ignored). Right pane: the skill graph, where a
single trace animates from a skill's source repo to the current query.

## Run

The backend must be running on `http://localhost:8000` (the dev server proxies
`/ask` and `/repos` there, so there are no CORS issues).

```bash
npm install
npm run dev      # http://localhost:5173
```

Build:

```bash
npm run build    # type-check + production bundle in dist/
npm run preview
```

## Notes

- **Theme**: dark-primary; the toggle flips `data-theme` on `<html>`. Every
  color is a semantic CSS variable in `src/styles/tokens.css` — one flip swaps
  base/surface/text/border and re-derives the cyan/amber signal accents. The
  choice lives in React state and is mirrored to `localStorage`.
- **Signal colors**: cyan = a skill the planner used; amber = a skill recalled
  but rejected (its reason is shown in plain text on the card).
- **Motion**: the recall trace is the only animation. With
  `prefers-reduced-motion`, it becomes an instant highlight.
- **Backend contract**: `POST /ask` returns
  `{ answer, citations, reasoning_steps, skills: [{ method, source_repo, state, reason }] }`.
- The graph pane is a styled placeholder while the full graph render is
  finalized separately; the source→query trace is real.

Set `VITE_API_BASE` to point at a non-proxied backend origin if needed.
