"""GET /api/teams/{team_id}/members/{member_id}/explain — why is this person here?"""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.config import settings
from app.db import get_session
from app.engine.preprocess import build_cohort
from app.engine.solver import build_team
from app.models import TeamRow
from app.seed import EVENT_ID
from app.services.member_explainer import explain_member_placement

router = APIRouter(prefix="/api", tags=["teams"])


@router.get("/teams/{team_id}/members/{member_id}/explain")
def explain_member_endpoint(
    team_id: str,
    member_id: str,
    session: Session = Depends(get_session),
) -> dict:
    """Explain why a specific member is on a specific team."""
    row = session.get(TeamRow, team_id)
    if row is None:
        raise HTTPException(status_code=404, detail=f"team {team_id} not found")
    
    if member_id not in row.member_ids:
        raise HTTPException(status_code=400, detail=f"{member_id} is not on team {team_id}")
    
    event_id = row.event_id or EVENT_ID
    
    # Load cohort and build team for analysis
    from app.api.participants import load_cohort
    people = load_cohort(session, event_id=event_id)
    if not people:
        raise HTTPException(status_code=400, detail="no participants for this event")
    
    cohort = build_cohort(
        [p.model_dump() for p in people],
        min_size=3,
        max_size=5,
        required_roles=tuple(settings.required_role_list),
    )
    
    team = build_team(row.id, list(row.member_ids), cohort)
    explanation = explain_member_placement(member_id, team, cohort)
    
    return explanation
