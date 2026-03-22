from pydantic import BaseModel


class ListReposResponse(BaseModel):
    repo_ids: list[str]
