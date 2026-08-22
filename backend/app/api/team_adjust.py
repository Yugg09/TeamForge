"""Team adjustment endpoints: lock, move, accept, reject."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.api.form_teams import load_team_map, persist_team
from app.api.participants import load_cohort
from app.api.wire import to_team
from app.config import settings
from app.db import get_session
from app.engine.preprocess import build_cohort
from app.engine.solver import build_team
from app.models import PartitionStatusRow, TeamRow
from app.schemas import Team
from app.seed import EVENT_ID

router = APIRouter(prefix="/api", tags=["teams"])


# ---------- Request/Response schemas ----------

class LockTeamRequest(BaseModel):
    locked: bool = True


class MoveMemberRequest(BaseModel):
    from_team_id: str
    to_team_id: str
    member_id: str


class TeamAdjustResponse(BaseModel):
    team: Team
    adjusted: bool = True


class PartitionStatusResponse(BaseModel):
    status: str  # pending | accepted | rejected
    locked_teams: list[str]


# ---------- Endpoints ----------

@router.post("/teams/{team_id}/lock")
def lock_team(
    team_id: str,
    payload: LockTeamRequest,
    session: Session = Depends(get_session),
) -> dict:
    """Lock or unlock a team. Locked teams are not modified by the optimizer."""
    row = session.get(TeamRow, team_id)
    if row is None:
        raise HTTPException(status_code=404, detail=f"team {team_id} not found")
    
    row.locked = payload.locked
    session.add(row)
    session.commit()
    
    return {"team_id": team_id, "locked": row.locked}


@router.post("/teams/move-member")
def move_member(
    payload: MoveMemberRequest,
    session: Session = Depends(get_session),
) -> dict:
    """Move a member from one team to another.
    
    After moving, both teams are re-scored.
    """
    from_row = session.get(TeamRow, payload.from_team_id)
    to_row = session.get(TeamRow, payload.to_team_id)
    
    if from_row is None:
        raise HTTPException(status_code=404, detail=f"team {payload.from_team_id} not found")
    if to_row is None:
        raise HTTPException(status_code=404, detail=f"team {payload.to_team_id} not found")
    if payload.member_id not in from_row.member_ids:
        raise HTTPException(status_code=400, detail=f"{payload.member_id} not on team {payload.from_team_id}")
    if payload.member_id in to_row.member_ids:
        raise HTTPException(status_code=400, detail=f"{payload.member_id} already on team {payload.to_team_id}")
    
    event_id = from_row.event_id or EVENT_ID
    
    # Update the team memberships
    from_members = [m for m in from_row.member_ids if m != payload.member_id]
    to_members = list(to_row.member_ids) + [payload.member_id]
    
    from_row.member_ids = from_members
    to_row.member_ids = to_members
    
    # Load cohort and re-score both teams
    people = load_cohort(session, event_id=event_id)
    cohort = build_cohort(
        [p.model_dump() for p in people],
        min_size=3,
        max_size=5,
        required_roles=tuple(settings.required_role_list),
    )
    
    # Re-score the source team
    if len(from_members) >= 3:
        from_team = build_team(from_row.id, from_members, cohort)
        from_row.role_assignments = from_team.role_assignments
        from_row.score = {
            "total": from_team.score.total,
            "terms": from_team.score.terms,
            "penalties": from_team.score.penalties,
            "flags": [{"kind": f.kind, "payload": f.payload} for f in from_team.score.flags],
        }
    else:
        # Team too small — mark as dissolving
        from_row.score = {"total": 0, "terms": {}, "penalties": {}, "flags": []}
    
    # Re-score the destination team
    to_team_result = build_team(to_row.id, to_members, cohort)
    to_row.role_assignments = to_team_result.role_assignments
    to_row.score = {
        "total": to_team_result.score.total,
        "terms": to_team_result.score.terms,
        "penalties": to_team_result.score.penalties,
        "flags": [{"kind": f.kind, "payload": f.payload} for f in to_team_result.score.flags],
    }
    
    session.add(from_row)
    session.add(to_row)
    session.commit()
    
    return {
        "moved": payload.member_id,
        "from_team": to_team(from_team_result) if len(from_members) >= 3 else None,
        "to_team": to_team(to_team_result),
    }


@router.post("/teams/accept")
def accept_partition(
    event_id: str = EVENT_ID,
    session: Session = Depends(get_session),
) -> dict:
    """Accept the current partition. Teams are finalized."""
    status_row = session.get(PartitionStatusRow, event_id)
    if status_row is None:
        status_row = PartitionStatusRow(event_id=event_id)
        session.add(status_row)
    
    status_row.status = "accepted"
    status_row.locked_teams = [
        row.id for row in session.exec(
            select(TeamRow).where(TeamRow.event_id == event_id, TeamRow.locked == True)
        ).all()
    ]
    session.commit()
    
    return {"status": "accepted", "event_id": event_id}


@router.post("/teams/reject")
def reject_partition(
    event_id: str = EVENT_ID,
    session: Session = Depends(get_session),
) -> dict:
    """Reject the current partition. Teams are cleared for re-formation."""
    status_row = session.get(PartitionStatusRow, event_id)
    if status_row is None:
        status_row = PartitionStatusRow(event_id=event_id)
        session.add(status_row)
    
    status_row.status = "rejected"
    status_row.locked_teams = []
    session.commit()
    
    return {"status": "rejected", "event_id": event_id}


@router.get("/teams/status", response_model=PartitionStatusResponse)
def get_partition_status(
    event_id: str = EVENT_ID,
    session: Session = Depends(get_session),
) -> PartitionStatusResponse:
    """Get the current partition status."""
    status_row = session.get(PartitionStatusRow, event_id)
    if status_row is None:
        return PartitionStatusResponse(status="pending", locked_teams=[])
    
    return PartitionStatusResponse(
        status=status_row.status,
        locked_teams=status_row.locked_teams or [],
    )
