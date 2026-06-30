from pydantic import BaseModel


class AskRequest(BaseModel):
    repo_id: str
    question: str


class SkillView(BaseModel):
    method: str
    source_repo: str
    state: str  # "used" | "ignored"
    reason: str | None = None


class AskResponse(BaseModel):
    answer: str
    citations: list[str]
    reasoning_steps: list[str]
    skills: list[SkillView] = []
