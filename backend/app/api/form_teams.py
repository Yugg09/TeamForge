"""POST /api/form-teams."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, delete

from app import mocks
from app.api.participants import load_cohort
from app.api.wire import score_dict, to_form_teams_response
from app.config import settings
from app.db import get_session
from app.engine.preprocess import build_cohort
from app.engine.solver import solve
from app.engine.types import SolveResult, TeamResult
from app.models import StepLogRow, TeamRow
from app.schemas import FormTeamsRequest, FormTeamsResponse

router = APIRouter(prefix="/api", tags=["teams"])


@router.post("/form-teams", response_model=FormTeamsResponse)
def form_teams(
    payload: FormTeamsRequest, session: Session = Depends(get_session)
) -> FormTeamsResponse:
    if settings.mock_mode:
        return mocks.MOCK_FORM_TEAMS

    people = load_cohort(session, event_id=payload.event_id)
    if not people:
        raise HTTPException(status_code=400, detail="no participants for this event")

    cohort = build_cohort(
        [p.model_dump() for p in people],
        min_size=payload.min_size,
        max_size=payload.max_size,
        required_roles=tuple(settings.required_role_list),
    )
    result = solve(cohort)
    persist_solve(session, payload.event_id, result)
    return to_form_teams_response(result)


def persist_solve(session: Session, event_id: str, result: SolveResult) -> None:
    session.exec(delete(TeamRow).where(TeamRow.event_id == event_id))
    session.exec(delete(StepLogRow).where(StepLogRow.event_id == event_id))
    session.flush()
    for team in result.teams:
        persist_team(session, event_id, team)
    for seq, step in enumerate(result.step_log):
        session.add(StepLogRow(
            event_id=event_id,
            seq=seq,
            op=step.op,
            teams_touched=step.teams_touched,
            total_score=step.total_score,
        ))
    session.commit()


def persist_team(session: Session, event_id: str, team: TeamResult) -> None:
    row = session.get(TeamRow, team.id)
    if row is None:
        row = TeamRow(id=team.id, event_id=event_id)
        session.add(row)
    row.event_id = event_id
    row.member_ids = team.member_ids
    row.role_assignments = team.role_assignments
    row.score = score_dict(team)


def load_team_map(session: Session, event_id: str) -> dict[str, list[str]]:
    from sqlmodel import select

    rows = session.exec(select(TeamRow).where(TeamRow.event_id == event_id)).all()
    return {row.id: list(row.member_ids) for row in rows}
