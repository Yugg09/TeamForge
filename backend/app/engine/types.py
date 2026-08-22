"""Pure data structures for the matching engine.

This module imports nothing app-side — no FastAPI, no SQLModel, no services.
Everything the engine needs about a participant (skill categories, implied roles,
flattened availability intervals) is resolved by the caller during preprocessing
and handed in here as plain data.
"""

from dataclasses import dataclass, field

Interval = tuple[int, int]

# Ambition mapped onto an ordinal axis for variance-based goal alignment.
AMBITION_VALUE: dict[str, float] = {"learn": 0.0, "ship": 1.0, "win": 2.0}

# A skill counts toward coverage / redundancy only at or above this proficiency.
PROFICIENCY_THRESHOLD = 3

# Hard feasibility floor on shared weekly minutes (spec §5).
MIN_OVERLAP_MINUTES = 120

# availability_overlap saturates here (spec §4).
OVERLAP_SATURATION_MINUTES = 600


@dataclass(frozen=True)
class SkillRef:
    """A member's skill, already resolved against the taxonomy."""

    id: str
    proficiency: int
    verified: bool
    category: str
    roles: frozenset[str]

    @property
    def strong(self) -> bool:
        return self.proficiency >= PROFICIENCY_THRESHOLD


@dataclass(frozen=True)
class Member:
    """A participant, preprocessed into everything the objective needs."""

    id: str
    skills: tuple[SkillRef, ...] = ()
    preferred_roles: tuple[str, ...] = ()
    implied_roles: frozenset[str] = frozenset()
    interests: frozenset[str] = frozenset()
    intervals: tuple[Interval, ...] = ()      # merged absolute-week minutes
    ambition: str = "ship"
    work_style: str = "planner"
    sync_pref: str = "sync"
    timezone_offset_min: int = 0

    @property
    def roles(self) -> frozenset[str]:
        """Roles this member can plausibly fill: stated preferences ∪ skill-implied."""
        return frozenset(self.preferred_roles) | self.implied_roles

    def proficiency_for(self, role: str) -> int:
        """Best proficiency among skills that imply the role; 0 if none."""
        return max((s.proficiency for s in self.skills if role in s.roles), default=0)


@dataclass(frozen=True)
class Config:
    """Event-level knobs. Weights are the spec §4 constants."""

    required_roles: tuple[str, ...] = ("frontend", "backend", "ai_ml", "design")
    min_size: int = 3
    max_size: int = 5
    n_categories: int = 11        # size of the taxonomy's category space
    weights: dict[str, float] = field(default_factory=lambda: {
        "coverage": 0.28,
        "complementarity": 0.20,
        "availability_overlap": 0.18,
        "goal_alignment": 0.14,
        "style_fit": 0.08,
        "interest_fit": 0.12,
    })
    penalties: dict[str, float] = field(default_factory=lambda: {
        "skill_redundancy": 0.15,
        "role_gaps": 0.30,
        "availability_starvation": 0.25,
    })


@dataclass(frozen=True)
class Cohort:
    """The whole population to partition, plus precomputed pairwise similarity."""

    members: tuple[Member, ...]
    config: Config = field(default_factory=Config)
    # (member_id, member_id) -> 0..1 interest/embedding similarity, both orders stored.
    similarity: dict[tuple[str, str], float] = field(default_factory=dict)

    def by_id(self, member_id: str) -> Member:
        for m in self.members:
            if m.id == member_id:
                return m
        raise KeyError(member_id)

    @property
    def index(self) -> dict[str, Member]:
        return {m.id: m for m in self.members}

    def sim(self, a: str, b: str) -> float:
        if a == b:
            return 1.0
        return self.similarity.get((a, b), self.similarity.get((b, a), 0.0))


@dataclass
class Flag:
    """A risk flag; mirrors the RiskFlag wire shape without importing Pydantic."""

    kind: str
    payload: dict


@dataclass
class Score:
    """A team's decomposed score. `total` is clamped to [0, 1]."""

    total: float
    terms: dict[str, float]
    penalties: dict[str, float]
    flags: list[Flag] = field(default_factory=list)


@dataclass
class Step:
    """One accepted improvement, for the frontend's climbing-score animation."""

    op: str                  # "seed" | "swap" | "move"
    teams_touched: list[str]
    total_score: float       # cohort score after this step


@dataclass
class TeamResult:
    id: str
    member_ids: list[str]
    role_assignments: dict[str, str]
    score: Score


@dataclass
class SolveResult:
    teams: list[TeamResult]
    step_log: list[Step]
    fairness_ok: bool


@dataclass
class RebalanceResult:
    team: TeamResult
    gap_flag: Flag | None
    suggested_replacement_id: str | None
    score_before: float
    score_after: float
    donor_team_id: str | None = None
    donor_member_ids: list[str] | None = None
