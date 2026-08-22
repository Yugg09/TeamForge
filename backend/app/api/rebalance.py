"""POST /api/rebalance."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app import mocks
from app.api.form_teams import load_team_map, persist_team
from app.api.participants import load_cohort
from app.api.wire import to_team
from app.config import settings
from app.db import get_session
from app.engine.preprocess import build_cohort
from app.engine.rebalance import accept_replacement, remove_member
from app.engine.solver import build_team
from app.engine.types import RebalanceResult
from app.models import TeamRow
from app.schemas import RebalanceRequest, RebalanceResponse, RiskFlag
from app.seed import EVENT_ID

router = APIRouter(prefix="/api", tags=["teams"])


def _mock_rebalance(payload: RebalanceRequest) -> RebalanceResponse:
    if payload.accept_replacement_id:
        return mocks.MOCK_REBALANCE_ACCEPT
    if payload.remove_member_id:
        return mocks.MOCK_REBALANCE_REMOVE
    raise HTTPException(
        status_code=422,
        detail="rebalance requires either remove_member_id or accept_replacement_id",
    )


@router.post("/rebalance", response_model=RebalanceResponse)
def rebalance(
    payload: RebalanceRequest, session: Session = Depends(get_session)
) -> RebalanceResponse:
    if settings.mock_mode:
        return _mock_rebalance(payload)

    if bool(payload.remove_member_id) == bool(payload.accept_replacement_id):
        raise HTTPException(
            status_code=422,
            detail="rebalance requires either remove_member_id or accept_replacement_id",
        )

    row = session.get(TeamRow, payload.team_id)
    if row is None:
        raise HTTPException(status_code=404, detail=f"team {payload.team_id} not found")
    event_id = row.event_id or EVENT_ID

    people = load_cohort(session, event_id=event_id)
    if not people:
        raise HTTPException(status_code=400, detail="no participants for this event")

    cohort = build_cohort(
        [p.model_dump() for p in people],
        min_size=3,
        max_size=5,
        required_roles=tuple(settings.required_role_list),
    )
    teams = load_team_map(session, event_id)
    if payload.team_id not in teams:
        raise HTTPException(status_code=404, detail=f"team {payload.team_id} not found")

    try:
        if payload.remove_member_id:
            result = remove_member(payload.team_id, payload.remove_member_id, teams, cohort)
        else:
            result = accept_replacement(payload.team_id, payload.accept_replacement_id, teams, cohort)
    except KeyError as exc:
        raise HTTPException(status_code=400, detail=f"unknown member {exc}") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    persist_team(session, event_id, result.team)
    if result.donor_team_id and result.donor_member_ids is not None:
        persist_team(
            session,
            event_id,
            build_team(result.donor_team_id, result.donor_member_ids, cohort),
        )
    session.commit()
    return _to_response(result)


def _to_response(result: RebalanceResult) -> RebalanceResponse:
    gap = None
    if result.gap_flag is not None:
        gap = RiskFlag(kind=result.gap_flag.kind, payload=result.gap_flag.payload)
    return RebalanceResponse(
        team=to_team(result.team),
        gap_flag=gap,
        suggested_replacement_id=result.suggested_replacement_id,
        score_before=result.score_before,
        score_after=result.score_after,
    )
