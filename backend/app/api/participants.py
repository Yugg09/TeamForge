"""GET/POST /api/participants."""

from fastapi import APIRouter, status

from app import mocks
from app.config import settings
from app.schemas import Participant, ParticipantIn, ParticipantsResponse

router = APIRouter(prefix="/api", tags=["participants"])


@router.get("/participants", response_model=ParticipantsResponse)
def list_participants() -> ParticipantsResponse:
    if settings.mock_mode:
        return ParticipantsResponse(participants=mocks.MOCK_PARTICIPANTS)
    return ParticipantsResponse(participants=mocks.MOCK_PARTICIPANTS)


@router.post("/participants", response_model=Participant, status_code=status.HTTP_201_CREATED)
def create_participant(payload: ParticipantIn) -> Participant:
    if settings.mock_mode:
        return Participant(id="p_new", **payload.model_dump())
    return Participant(id="p_new", **payload.model_dump())
