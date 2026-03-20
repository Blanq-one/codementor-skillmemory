from pydantic import BaseModel


class ListFilesRequest(BaseModel):
    repo_id: str


class FileEntry(BaseModel):
    path: str
    language: str


class ListFilesResponse(BaseModel):
    files: list[FileEntry]
