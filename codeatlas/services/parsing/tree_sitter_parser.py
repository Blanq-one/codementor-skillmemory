import logging
from pathlib import Path

from tree_sitter import Node
from tree_sitter_languages import get_parser

from codeatlas.models.function_node import FunctionNode
from codeatlas.models.parsed_repository import ParsedRepository
from codeatlas.models.repository import Repository
from codeatlas.models.source_file import SourceFile
from codeatlas.services.parsing.interfaces import AstParser


class TreeSitterAstParser(AstParser):
    def parse_repository(self, repository: Repository) -> ParsedRepository:
        root = Path(repository.root_path)
        files: list[SourceFile] = []
        functions: list[FunctionNode] = []

        for path in root.rglob("*"):
            if not path.is_file():
                continue
            language = self._language_from_suffix(path.suffix)
            if language is None:
                continue
            file_functions = self._parse_file(path, language)
            files.append(
                SourceFile(
                    path=str(path),
                    language=language,
                    size_bytes=path.stat().st_size,
                )
            )
            functions.extend(file_functions)

        return ParsedRepository(
            repository_id=repository.repo_id,
            files=files,
            functions=functions,
        )

    def _language_from_suffix(self, suffix: str) -> str | None:
        if suffix == ".py":
            return "python"
        if suffix in {".js", ".jsx", ".ts", ".tsx"}:
            return "javascript"
        return None

    def _parse_file(self, path: Path, language: str) -> list[FunctionNode]:
        try:
            parser = get_parser(language)
        except Exception as exc:
            logging.warning("Tree-sitter parser unavailable for %s: %s", language, exc)
            return []

        try:
            source_bytes = path.read_bytes()
        except OSError as exc:
            logging.warning("Failed to read %s: %s", path, exc)
            return []

        tree = parser.parse(source_bytes)
        return self._collect_functions(path, source_bytes, tree.root_node, language)

    def _collect_functions(
        self, path: Path, source_bytes: bytes, root: Node, language: str
    ) -> list[FunctionNode]:
        function_nodes = self._function_node_types(language)
        results: list[FunctionNode] = []
        stack = [root]

        while stack:
            node = stack.pop()
            if node.type in function_nodes:
                name = self._extract_name(node, source_bytes)
                signature = self._extract_signature(node, source_bytes)
                results.append(
                    FunctionNode(
                        name=name,
                        file_path=str(path),
                        start_line=node.start_point[0] + 1,
                        end_line=node.end_point[0] + 1,
                        signature=signature,
                    )
                )
            stack.extend(reversed(node.children))

        return results

    def _function_node_types(self, language: str) -> set[str]:
        if language == "python":
            return {"function_definition", "class_definition"}
        return {
            "function_declaration",
            "method_definition",
            "function",
            "arrow_function",
            "generator_function",
            "class_declaration",
        }

    def _extract_name(self, node: Node, source_bytes: bytes) -> str:
        name_node = node.child_by_field_name("name")
        if name_node is None:
            return "<anonymous>"
        return self._node_text(name_node, source_bytes).strip() or "<anonymous>"

    def _extract_signature(self, node: Node, source_bytes: bytes) -> str:
        text = self._node_text(node, source_bytes)
        first_line = text.splitlines()[0].strip() if text else ""
        return first_line[:200]

    def _node_text(self, node: Node, source_bytes: bytes) -> str:
        return source_bytes[node.start_byte : node.end_byte].decode(
            "utf-8", errors="replace"
        )
