from dataclasses import dataclass, field


@dataclass(frozen=True)
class SkillView:
    """A recalled skill as surfaced to clients: its method text, where it was
    learned, whether the planner used it, and (if ignored) why."""
    method: str
    source_repo: str
    state: str  # "used" | "ignored"
    reason: str | None = None


@dataclass(frozen=True)
class AnswerResult:
    answer: str
    citations: list[str]
    reasoning_steps: list[str]
    skills: list[SkillView] = field(default_factory=list)


@dataclass(frozen=True)
class GenerateResult:
    diff: str
    notes: list[str]
    citations: list[str]
