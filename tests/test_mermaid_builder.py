import networkx as nx

from codeatlas.models.parsed_repository import ParsedRepository
from codeatlas.models.source_file import SourceFile
from codeatlas.services.state.repo_state_store import RepoState
from codeatlas.services.diagram.mermaid_builder import (
    build_module_diagram,
    wants_diagram,
    _sanitize,
)

RID = "828f7470-2583-40d1-9811-1666e2be87bd"


def _p(rel: str) -> str:
    # Mimic the absolute clone path shape the ingester stores.
    return f"C:/Users/x/CodeMentor/.codeatlas/repos/{RID}/{rel}"


def _state(edges: list[tuple[str, str]]) -> RepoState:
    sources = {src for src, _ in edges}
    files = [SourceFile(path=s, language="python", size_bytes=1) for s in sources]
    graph = nx.DiGraph()
    for src, tgt in edges:
        graph.add_node(src)
        graph.add_node(tgt)
        graph.add_edge(src, tgt, relation="imports")
    parsed = ParsedRepository(repository_id=RID, files=files, functions=[])
    return RepoState(parsed_repo=parsed, import_graph=graph, root_path="")


def test_builds_internal_package_graph_and_drops_externals():
    state = _state([
        (_p("app/controllers/x.py"), "app.config"),
        (_p("app/controllers/x.py"), "torch"),          # external -> dropped
        (_p("app/controllers/x.py"), "pathlib"),         # external -> dropped
        (_p("app/services/z.py"), "app.models.base"),
        (_p("tests/t.py"), "app.controllers"),
    ])
    out = build_module_diagram(state)
    assert out is not None
    assert out.startswith("graph LR")
    # internal packages present
    for pkg in ("app/controllers", "app/config", "app/services", "app/models", "tests"):
        assert f'"{pkg}"' in out
    # externals never appear
    assert "torch" not in out
    assert "pathlib" not in out


def test_relative_import_is_self_and_dropped():
    # a relative import resolves to the source's own package -> self-edge -> dropped
    state = _state([(_p("app/config/__init__.py"), ".loader")])
    assert build_module_diagram(state) is None


def test_external_only_returns_none():
    state = _state([
        (_p("app/x.py"), "os"),
        (_p("app/x.py"), "torch"),
    ])
    assert build_module_diagram(state) is None


def test_empty_repo_returns_none():
    parsed = ParsedRepository(repository_id=RID, files=[], functions=[])
    state = RepoState(parsed_repo=parsed, import_graph=nx.DiGraph(), root_path="")
    assert build_module_diagram(state) is None


def test_uses_synthetic_ids_and_quoted_labels():
    state = _state([(_p("app/a/x.py"), "app.b")])
    out = build_module_diagram(state)
    assert out is not None
    # nodes are nX["label"] — labels are always quoted, ids are synthetic
    assert 'n0["' in out and 'n1["' in out
    assert "-->" in out


def test_cap_limits_nodes():
    # 30 distinct source packages all importing one hub; cap to 5
    edges = [(_p(f"app/m{i}/x.py"), "app.hub") for i in range(30)]
    out = build_module_diagram(_state(edges), max_nodes=5)
    assert out is not None
    node_count = sum(1 for line in out.splitlines() if line.strip().startswith("n") and '["' in line)
    assert node_count <= 5


def test_sanitize_neutralizes_quotes_and_newlines():
    dirty = 'weird"name\nwith`ticks'
    clean = _sanitize(dirty)
    assert '"' not in clean
    assert "\n" not in clean
    assert "`" not in clean


def test_wants_diagram_keywords():
    for q in ["show me a diagram", "visualize the architecture", "dependency graph please", "flowchart of calls"]:
        assert wants_diagram(q) is True
    for q in ["how does authentication work", "where is the db layer"]:
        assert wants_diagram(q) is False
