"""GET /api/teams/{team_id}/recommend — team recommendations with match explanations."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.config import settings
from app.db import get_session
from app.engine.preprocess import build_cohort
from app.engine.solver import build_team
from app.models import TeamRow
from app.seed import EVENT_ID
from app.services.team_recommender import explain_team_match

router = APIRouter(prefix="/api", tags=["teams"])


@router.get("/teams/{team_id}/recommend")
def recommend_team_endpoint(
    team_id: str,
    session: Session = Depends(get_session),
) -> dict:
    """Get team recommendations with match explanations."""
    row = session.get(TeamRow, team_id)
    if row is None:
        raise HTTPException(status_code=404, detail=f"team {team_id} not found")
    
    event_id = row.event_id or EVENT_ID
    
    # Load cohort and build team
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
    recommendations = explain_team_match(team, cohort)
    
    return recommendations
