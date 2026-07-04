"""Build a grounded Mermaid diagram of a repo's internal module dependencies.

Grounded in real ingest data (the import graph + parsed files), never invented.
Safety is the priority: synthetic node ids + quoted labels make the output
un-break-able regardless of path/module characters, externals are dropped for
readability, the graph is capped, and an empty graph yields None (never an
empty/among-invalid diagram).
"""
from __future__ import annotations

import collections
import posixpath

from codeatlas.services.state.repo_state_store import RepoState

_TRIGGERS = (
    "diagram",
    "visualize",
    "visualise",
    "show architecture",
    "architecture diagram",
    "dependency graph",
    "dependencies graph",
    "module graph",
    "call flow",
    "flowchart",
    "structure diagram",
)


def wants_diagram(question: str) -> bool:
    """True when the question asks for a visual/diagram."""
    q = (question or "").lower()
    return any(kw in q for kw in _TRIGGERS)


def _rel(path: str, repo_id: str) -> str:
    """Repo-relative, forward-slashed path. Sources are absolute clone paths
    like ``.../repos/<id>/app/x.py``; strip up to and including ``repos/<id>/``.
    """
    p = str(path).replace("\\", "/")
    marker = f"repos/{repo_id}/"
    idx = p.find(marker)
    if idx != -1:
        return p[idx + len(marker) :]
    return p.rsplit("/", 1)[-1]  # fallback: bare filename


def _pkg_of_path(path: str, repo_id: str) -> str:
    """Package = the file's directory, capped at two segments. Root files -> '(root)'."""
    parts = _rel(path, repo_id).split("/")
    dirs = parts[:-1]
    if not dirs:
        return "(root)"
    return "/".join(dirs[:2])


def _pkg_of_target(target: str, src_pkg: str, top_pkgs: set[str]) -> str | None:
    """Map an import target to an internal package, or None if external.

    Relative imports (``.foo``) belong to the source's own package. Dotted
    modules are internal only when their head is a repo top-level package.
    """
    t = str(target).strip()
    if not t:
        return None
    if t.startswith("."):
        return src_pkg
    head = t.split(".")[0]
    if head in top_pkgs:
        return "/".join(t.split(".")[:2])
    return None


def _sanitize(label: str) -> str:
    """Make a label safe inside a Mermaid ``["..."]`` quoted node."""
    s = " ".join(str(label).split())  # collapse whitespace / newlines
    s = s.replace('"', "'").replace("`", "'")
    return s[:48]


def build_module_diagram(state: RepoState, max_nodes: int = 24) -> str | None:
    """Return a Mermaid ``graph LR`` of internal package dependencies, or None
    when there is nothing meaningful to draw."""
    repo_id = state.parsed_repo.repository_id
    files = state.parsed_repo.files
    if not files:
        return None

    top_pkgs = {_rel(f.path, repo_id).split("/")[0] for f in files}

    degree: collections.Counter[str] = collections.Counter()
    pkg_edges: set[tuple[str, str]] = set()
    for source, target, _data in state.import_graph.edges(data=True):
        src_pkg = _pkg_of_path(source, repo_id)
        tgt_pkg = _pkg_of_target(target, src_pkg, top_pkgs)
        if tgt_pkg is None or tgt_pkg == src_pkg:
            continue
        pkg_edges.add((src_pkg, tgt_pkg))
        degree[src_pkg] += 1
        degree[tgt_pkg] += 1

    if not pkg_edges:
        return None

    keep = {n for n, _ in degree.most_common(max_nodes)}
    kept_edges = sorted((s, t) for (s, t) in pkg_edges if s in keep and t in keep)
    if not kept_edges:
        return None

    ids: dict[str, str] = {}
    node_lines: list[str] = []
    edge_lines: list[str] = []

    def node_id(label: str) -> str:
        if label not in ids:
            ids[label] = f"n{len(ids)}"
            node_lines.append(f'  {ids[label]}["{_sanitize(label)}"]')
        return ids[label]

    for src, tgt in kept_edges:
        a, b = node_id(src), node_id(tgt)
        edge_lines.append(f"  {a} --> {b}")

    return "\n".join(["graph LR", *node_lines, *edge_lines])
