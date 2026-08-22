"""POST /api/teams/{team_id}/explain — LLM-powered team explanation."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.config import settings
from app.db import get_session
from app.engine.preprocess import build_cohort
from app.engine.solver import build_team
from app.models import TeamRow
from app.schemas import Team
from app.seed import EVENT_ID
from app.services.llm_explainer import explain_team_bullets

router = APIRouter(prefix="/api", tags=["teams"])


@router.get("/teams/{team_id}/explain")
def explain_team_endpoint(
    team_id: str,
    session: Session = Depends(get_session),
) -> dict:
    """Generate an LLM-powered explanation for a team."""
    row = session.get(TeamRow, team_id)
    if row is None:
        raise HTTPException(status_code=404, detail=f"team {team_id} not found")

    event_id = row.event_id or EVENT_ID

    # Load cohort and build team for scoring
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
    bullets = explain_team_bullets(team)

    return {
        "team_id": team_id,
        "bullets": bullets,
        "llm_backend": "openai" if settings.llm_api_key else "template",
    }
