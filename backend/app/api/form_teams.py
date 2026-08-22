"""POST /api/form-teams."""

from fastapi import APIRouter

from app import mocks
from app.config import settings
from app.schemas import FormTeamsRequest, FormTeamsResponse

router = APIRouter(prefix="/api", tags=["teams"])


@router.post("/form-teams", response_model=FormTeamsResponse)
def form_teams(payload: FormTeamsRequest) -> FormTeamsResponse:
    if settings.mock_mode:
        return mocks.MOCK_FORM_TEAMS
    return mocks.MOCK_FORM_TEAMS
