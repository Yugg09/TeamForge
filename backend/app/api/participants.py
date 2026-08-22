"""GET/POST/PUT/DELETE /api/participants."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app import mocks
from app.config import settings
from app.db import get_session
from app.models import ParticipantRow
from app.schemas import Participant, ParticipantIn, ParticipantsResponse
from app.seed import EVENT_ID
from app.services.llm_parser import enrich

router = APIRouter(prefix="/api", tags=["participants"])


def row_to_schema(row: ParticipantRow) -> Participant:
    return Participant(
        id=row.id,
        name=row.name,
        bio=row.bio,
        timezone_offset_min=row.timezone_offset_min,
        skills=row.skills,
        preferred_roles=row.preferred_roles,
        interests=row.interests,
        availability=row.availability,
        ambition=row.ambition,
        work_style=row.work_style,
        sync_pref=row.sync_pref,
    )


def load_cohort(session: Session, event_id: str = EVENT_ID) -> list[Participant]:
    rows = session.exec(
        select(ParticipantRow).where(ParticipantRow.event_id == event_id).order_by(ParticipantRow.id)
    ).all()
    return [row_to_schema(r) for r in rows]


@router.get("/participants", response_model=ParticipantsResponse)
def list_participants(session: Session = Depends(get_session)) -> ParticipantsResponse:
    if settings.mock_mode:
        return ParticipantsResponse(participants=mocks.MOCK_PARTICIPANTS)
    return ParticipantsResponse(participants=load_cohort(session))


@router.post("/participants", response_model=Participant, status_code=status.HTTP_201_CREATED)
def create_participant(
    payload: ParticipantIn, session: Session = Depends(get_session)
) -> Participant:
    if settings.mock_mode:
        return Participant(id="p_new", **payload.model_dump())

    # Free-text bio fills in whatever the caller left blank; explicit input wins.
    data = enrich(payload.model_dump(exclude_unset=True))
    complete = ParticipantIn(**{**payload.model_dump(), **data})

    new_id = f"p_{uuid.uuid4().hex[:8]}"
    row = ParticipantRow(id=new_id, event_id=EVENT_ID, **complete.model_dump())
    session.add(row)
    session.commit()
    session.refresh(row)
    return row_to_schema(row)


@router.put("/participants/{participant_id}", response_model=Participant)
def update_participant(
    participant_id: str,
    payload: ParticipantIn,
    session: Session = Depends(get_session),
) -> Participant:
    if settings.mock_mode:
        return Participant(id=participant_id, **payload.model_dump())

    row = session.get(ParticipantRow, participant_id)
    if row is None:
        raise HTTPException(status_code=404, detail=f"participant {participant_id} not found")

    # Re-parse bio to fill blank fields, but never overwrite explicit input.
    data = enrich(payload.model_dump(exclude_unset=True))
    merged = {**payload.model_dump(), **data}

    row.name = merged["name"]
    row.bio = merged.get("bio", "")
    row.timezone_offset_min = merged.get("timezone_offset_min", 0)
    row.skills = merged.get("skills", [])
    row.preferred_roles = merged.get("preferred_roles", [])
    row.interests = merged.get("interests", [])
    row.availability = merged.get("availability", [])
    row.ambition = merged.get("ambition", "ship")
    row.work_style = merged.get("work_style", "planner")
    row.sync_pref = merged.get("sync_pref", "sync")

    session.add(row)
    session.commit()
    session.refresh(row)
    return row_to_schema(row)


@router.delete("/participants/{participant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_participant(
    participant_id: str,
    session: Session = Depends(get_session),
) -> None:
    if settings.mock_mode:
        return

    row = session.get(ParticipantRow, participant_id)
    if row is None:
        raise HTTPException(status_code=404, detail=f"participant {participant_id} not found")
    session.delete(row)
    session.commit()
