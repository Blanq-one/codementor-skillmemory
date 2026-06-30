from langchain_core.language_models import BaseChatModel
from langchain_core.prompts import ChatPromptTemplate


class LibrarianAgent:
    """Distills a repo-specific answer into a TRANSFERABLE METHOD.

    A transferable method is a reusable navigation or explanation pattern that
    applies to any codebase, with repo-specific names, paths, and facts stripped
    out. This is what makes skills reusable across repos; saving the raw answer
    verbatim would turn the skill into a repo-specific fact and break transfer.
    """

    NONE_SENTINEL = "NONE"

    def __init__(self, llm: BaseChatModel) -> None:
        self._llm = llm
        self._prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You convert a specific answer about ONE repository into a "
                    "TRANSFERABLE METHOD: a reusable, repo-agnostic pattern for "
                    "navigating or explaining code that applies to ANY codebase.\n"
                    "Rules:\n"
                    "- Strip out repo-specific names, file paths, class names, and facts.\n"
                    "- Keep only the generalizable step-by-step approach.\n"
                    "- Phrase it as a method ('To find X, locate Y, then follow to Z').\n"
                    "- Respond with 1-3 sentences, no preamble.\n"
                    f"- If the answer contains no transferable method, respond with "
                    f"exactly '{self.NONE_SENTINEL}'.",
                ),
                (
                    "human",
                    "Question: {question}\n\n"
                    "Answer about this specific repo:\n{answer}\n\n"
                    "Transferable method:",
                ),
            ]
        )

    def distill(self, question: str, answer: str) -> str | None:
        """Return a transferable method, or None if nothing generalizable exists."""
        chain = self._prompt | self._llm
        response = chain.invoke({"question": question, "answer": answer})
        method = (response.content or "").strip()
        if not method or method.upper() == self.NONE_SENTINEL:
            return None
        return method
