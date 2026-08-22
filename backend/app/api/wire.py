"""TeamResult → frozen §2 wire shapes. Shared by form-teams and rebalance."""

from app.engine.types import SolveResult, TeamResult
from app.schemas import (
    FormTeamsResponse,
    RiskFlag,
    StepLogEntry,
    Team,
    TeamScore,
    TeamScorePenalties,
    TeamScoreTerms,
)


def to_team(team: TeamResult) -> Team:
    return Team(
        id=team.id,
        member_ids=team.member_ids,
        role_assignments=team.role_assignments,
        score=TeamScore(
            total=team.score.total,
            terms=TeamScoreTerms(**team.score.terms),
            penalties=TeamScorePenalties(**team.score.penalties),
            flags=[RiskFlag(kind=f.kind, payload=f.payload) for f in team.score.flags],
        ),
    )


def to_form_teams_response(result: SolveResult) -> FormTeamsResponse:
    return FormTeamsResponse(
        teams=[to_team(t) for t in result.teams],
        step_log=[
            StepLogEntry(op=s.op, teams_touched=s.teams_touched, total_score=s.total_score)
            for s in result.step_log
        ],
        fairness_ok=result.fairness_ok,
    )


def score_dict(team: TeamResult) -> dict:
    return {
        "total": team.score.total,
        "terms": team.score.terms,
        "penalties": team.score.penalties,
        "flags": [{"kind": f.kind, "payload": f.payload} for f in team.score.flags],
    }
