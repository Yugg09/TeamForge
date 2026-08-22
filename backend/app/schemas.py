"""The frozen §2 API contract. Wire format is snake_case — do not rename fields."""

from typing import Literal, Optional

from pydantic import BaseModel

RoleId = Literal["frontend", "backend", "ai_ml", "design", "product", "research", "devops"]
Ambition = Literal["win", "ship", "learn"]


class Skill(BaseModel):
    id: str                       # canonical taxonomy id, e.g. "react"
    proficiency: int              # 1..5
    verified: bool = False


class AvailabilityWindow(BaseModel):
    day: int                      # 0..6 (Mon=0)
    start_utc: int                # 0..1439 minutes from midnight UTC
    end_utc: int


class ParticipantIn(BaseModel):
    name: str
    bio: str = ""                 # free text → parsed to structured fields
    timezone_offset_min: int = 0
    skills: list[Skill] = []
    preferred_roles: list[RoleId] = []
    interests: list[str] = []
    availability: list[AvailabilityWindow] = []
    ambition: Ambition = "ship"
    work_style: Literal["planner", "improviser"] = "planner"
    sync_pref: Literal["sync", "async"] = "sync"


class Participant(ParticipantIn):
    id: str


class ParticipantsResponse(BaseModel):
    participants: list[Participant]


class TeamScoreTerms(BaseModel):
    coverage: float
    complementarity: float
    availability_overlap: float
    goal_alignment: float
    style_fit: float
    interest_fit: float


class TeamScorePenalties(BaseModel):
    skill_redundancy: float
    role_gaps: float
    availability_starvation: float


class RiskFlag(BaseModel):
    kind: Literal["missing_role", "single_point_of_failure", "availability_gap", "goal_mismatch"]
    payload: dict                 # {"role":...} | {"skill":...,"member_id":...}
                                  # | {"overlap_minutes":...} | {"outlier_id":...}


class TeamScore(BaseModel):
    total: float                  # 0..1 (frontend displays ×100)
    terms: TeamScoreTerms
    penalties: TeamScorePenalties
    flags: list[RiskFlag]


class Team(BaseModel):
    id: str
    member_ids: list[str]
    role_assignments: dict[str, RoleId]   # member_id → role
    score: TeamScore


class StepLogEntry(BaseModel):
    op: Literal["seed", "swap", "move"]
    teams_touched: list[str]
    total_score: float            # cohort total after this step


class FormTeamsRequest(BaseModel):
    event_id: str = "demo"
    min_size: int = 3
    max_size: int = 5
    # Optional project requirements (Phase 2 — project-anchored forming)
    required_roles: Optional[list[RoleId]] = None
    required_skills: Optional[list[str]] = None
    project_domain: Optional[str] = None


class FormTeamsResponse(BaseModel):
    teams: list[Team]
    step_log: list[StepLogEntry]
    fairness_ok: bool


class RebalanceRequest(BaseModel):
    team_id: str
    remove_member_id: Optional[str] = None
    accept_replacement_id: Optional[str] = None


class RebalanceResponse(BaseModel):
    team: Team
    gap_flag: Optional[RiskFlag] = None
    suggested_replacement_id: Optional[str] = None
    score_before: float
    score_after: float


class ProjectAnalyzeRequest(BaseModel):
    description: str


class ProjectAnalyzeResponse(BaseModel):
    domain: str
    required_skills: list[str]
    roles: list[RoleId]
