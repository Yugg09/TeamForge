"""Frozen §2 fixtures, served when MOCK_MODE=1.

These are byte-faithful to the canonical JSON examples in the spec — the frontend
builds against them, so they must not drift.
"""

from app.schemas import (
    FormTeamsResponse,
    Participant,
    RebalanceResponse,
    RiskFlag,
    Team,
    TeamScore,
    TeamScorePenalties,
    TeamScoreTerms,
)

_TEAM_1_FORMED = Team(
    id="team_1",
    member_ids=["p_04", "p_11", "p_23", "p_39"],
    role_assignments={"p_04": "backend", "p_11": "frontend", "p_23": "ai_ml", "p_39": "design"},
    score=TeamScore(
        total=0.84,
        terms=TeamScoreTerms(
            coverage=0.92,
            complementarity=0.80,
            availability_overlap=0.78,
            goal_alignment=1.0,
            style_fit=0.66,
            interest_fit=0.71,
        ),
        penalties=TeamScorePenalties(
            skill_redundancy=0.05, role_gaps=0.0, availability_starvation=0.0
        ),
        flags=[RiskFlag(kind="missing_role", payload={"role": "product"})],
    ),
)

_TEAM_1_AFTER_REMOVE = Team(
    id="team_1",
    member_ids=["p_11", "p_23", "p_39"],
    role_assignments={"p_11": "frontend", "p_23": "ai_ml", "p_39": "design"},
    score=TeamScore(
        total=0.71,
        terms=TeamScoreTerms(
            coverage=0.75,
            complementarity=0.70,
            availability_overlap=0.78,
            goal_alignment=1.0,
            style_fit=0.66,
            interest_fit=0.71,
        ),
        penalties=TeamScorePenalties(
            skill_redundancy=0.05, role_gaps=0.30, availability_starvation=0.0
        ),
        flags=[RiskFlag(kind="missing_role", payload={"role": "backend"})],
    ),
)

_TEAM_1_HEALED = Team(
    id="team_1",
    member_ids=["p_11", "p_23", "p_39", "p_47"],
    role_assignments={"p_11": "frontend", "p_23": "ai_ml", "p_39": "design", "p_47": "backend"},
    score=TeamScore(
        total=0.86,
        terms=TeamScoreTerms(
            coverage=0.92,
            complementarity=0.82,
            availability_overlap=0.79,
            goal_alignment=1.0,
            style_fit=0.66,
            interest_fit=0.70,
        ),
        penalties=TeamScorePenalties(
            skill_redundancy=0.05, role_gaps=0.0, availability_starvation=0.0
        ),
        flags=[],
    ),
)

MOCK_PARTICIPANTS: list[Participant] = [
    Participant(
        id="p_04",
        name="Ada Okafor",
        bio="Backend engineer who likes distributed systems and clean APIs.",
        timezone_offset_min=0,
        skills=[{"id": "python", "proficiency": 5, "verified": True}, {"id": "postgres", "proficiency": 4}],
        preferred_roles=["backend"],
        interests=["infrastructure", "developer tools"],
        availability=[{"day": 5, "start_utc": 540, "end_utc": 1020}],
        ambition="win",
        work_style="planner",
        sync_pref="sync",
    ),
    Participant(
        id="p_11",
        name="Ravi Menon",
        bio="Frontend developer, React and design systems.",
        timezone_offset_min=330,
        skills=[{"id": "react", "proficiency": 5}, {"id": "typescript", "proficiency": 4}],
        preferred_roles=["frontend"],
        interests=["design systems", "accessibility"],
        availability=[{"day": 5, "start_utc": 600, "end_utc": 1080}],
        ambition="win",
        work_style="improviser",
        sync_pref="sync",
    ),
    Participant(
        id="p_23",
        name="Mia Lindqvist",
        bio="ML engineer working on retrieval and ranking models.",
        timezone_offset_min=60,
        skills=[{"id": "pytorch", "proficiency": 5, "verified": True}, {"id": "nlp", "proficiency": 4}],
        preferred_roles=["ai_ml"],
        interests=["nlp", "search"],
        availability=[{"day": 5, "start_utc": 560, "end_utc": 1000}],
        ambition="win",
        work_style="planner",
        sync_pref="async",
    ),
    Participant(
        id="p_39",
        name="Tomás Rivera",
        bio="Product designer, prototyping and user research.",
        timezone_offset_min=-180,
        skills=[{"id": "figma", "proficiency": 5}, {"id": "user_research", "proficiency": 3}],
        preferred_roles=["design", "product"],
        interests=["design systems", "user research"],
        availability=[{"day": 5, "start_utc": 600, "end_utc": 960}],
        ambition="win",
        work_style="improviser",
        sync_pref="sync",
    ),
    Participant(
        id="p_47",
        name="Grace Amadi",
        bio="Backend and infra generalist; ships fast, mentors gladly.",
        timezone_offset_min=60,
        skills=[{"id": "go", "proficiency": 4}, {"id": "docker", "proficiency": 4}],
        preferred_roles=["backend", "devops"],
        interests=["infrastructure", "search"],
        availability=[{"day": 5, "start_utc": 580, "end_utc": 1020}],
        ambition="win",
        work_style="planner",
        sync_pref="sync",
    ),
]

MOCK_FORM_TEAMS = FormTeamsResponse(
    teams=[_TEAM_1_FORMED],
    step_log=[
        {"op": "seed", "teams_touched": ["team_1"], "total_score": 0.61},
        {"op": "swap", "teams_touched": ["team_1", "team_2"], "total_score": 0.73},
        {"op": "move", "teams_touched": ["team_1"], "total_score": 0.84},
    ],
    fairness_ok=True,
)

MOCK_REBALANCE_REMOVE = RebalanceResponse(
    team=_TEAM_1_AFTER_REMOVE,
    gap_flag=RiskFlag(kind="missing_role", payload={"role": "backend"}),
    suggested_replacement_id="p_47",
    score_before=0.84,
    score_after=0.71,
)

MOCK_REBALANCE_ACCEPT = RebalanceResponse(
    team=_TEAM_1_HEALED,
    gap_flag=None,
    suggested_replacement_id=None,
    score_before=0.71,
    score_after=0.86,
)
