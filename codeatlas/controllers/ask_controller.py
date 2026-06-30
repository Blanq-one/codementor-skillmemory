from fastapi import APIRouter, Depends

from codeatlas.app.di import get_agent_orchestrator
from codeatlas.schemas.ask import AskRequest, AskResponse
from codeatlas.services.agents.orchestration import AgentOrchestrator

router = APIRouter(prefix="/ask", tags=["qa"])


@router.post("", response_model=AskResponse)
def ask(
    request: AskRequest,
    orchestrator: AgentOrchestrator = Depends(get_agent_orchestrator),
) -> AskResponse:
    result = orchestrator.handle_question(request.question, request.repo_id)
    return AskResponse(
        answer=result.answer,
        citations=result.citations,
        reasoning_steps=result.reasoning_steps,
        skills=[vars(skill) for skill in result.skills],
    )
