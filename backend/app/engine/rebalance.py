"""Constrained rebalance (spec §6).

On remove: freeze every team except the wounded one, flag the gap, and search a
single healing MOVE from the free-agent pool (unplaced people, then members of
oversized frozen teams). On accept: slot that person and rescore. Sub-second —
not a full re-solve.
"""

from app.engine import constraints, objective
from app.engine.solver import build_team
from app.engine.types import Cohort, Flag, RebalanceResult


def remove_member(
    team_id: str,
    member_id: str,
    teams: dict[str, list[str]],
    cohort: Cohort,
) -> RebalanceResult:
    current = list(teams[team_id])
    if member_id not in current:
        raise KeyError(member_id)
    before = build_team(team_id, current, cohort)
    wounded_ids = [m for m in current if m != member_id]
    wounded = build_team(team_id, wounded_ids, cohort)
    suggestion = suggest_replacement(team_id, member_id, teams, cohort)
    return RebalanceResult(
        team=wounded,
        gap_flag=_primary_gap(wounded.score.flags),
        suggested_replacement_id=suggestion,
        score_before=before.score.total,
        score_after=wounded.score.total,
    )


def accept_replacement(
    team_id: str,
    replacement_id: str,
    teams: dict[str, list[str]],
    cohort: Cohort,
) -> RebalanceResult:
    current = list(teams[team_id])
    if replacement_id in current:
        raise ValueError(f"{replacement_id} is already on {team_id}")
    trial = current + [replacement_id]
    if not _can_join(trial, cohort):
        raise ValueError(f"{replacement_id} cannot join {team_id}")

    before = build_team(team_id, current, cohort)
    healed = build_team(team_id, trial, cohort)

    donor_id = None
    donor_rest = None
    for other_id, members in teams.items():
        if other_id != team_id and replacement_id in members:
            donor_id = other_id
            donor_rest = [m for m in members if m != replacement_id]
            break

    return RebalanceResult(
        team=healed,
        gap_flag=None,
        suggested_replacement_id=None,
        score_before=before.score.total,
        score_after=healed.score.total,
        donor_team_id=donor_id,
        donor_member_ids=donor_rest,
    )


def suggest_replacement(
    team_id: str,
    excluded_id: str,
    teams: dict[str, list[str]],
    cohort: Cohort,
) -> str | None:
    wounded = [m for m in teams[team_id] if m != excluded_id]
    if len(wounded) >= cohort.config.max_size:
        return None

    unplaced, stealable = _pool(team_id, excluded_id, teams, cohort)
    wounded_score = objective.score_team(wounded, cohort).total if wounded else 0.0
    best_gain: tuple[tuple, str] | None = None
    best_any: tuple[tuple, str] | None = None
    for priority, cand in enumerate_pool(unplaced, stealable):
        trial = wounded + [cand]
        if not _can_join(trial, cohort):
            continue
        score = objective.score_team(trial, cohort).total
        covers = _covers_missing_roles(wounded, cand, cohort)
        key = (score, int(covers), priority)
        if best_any is None or key > best_any[0]:
            best_any = (key, cand)
        if score > wounded_score and (best_gain is None or key > best_gain[0]):
            best_gain = (key, cand)
    chosen = best_gain or best_any
    return chosen[1] if chosen else None


def enumerate_pool(unplaced: list[str], stealable: list[str]):
    """Higher priority first: free agents, then a single steal from an oversized team."""
    for cand in unplaced:
        yield 1, cand
    for cand in stealable:
        yield 0, cand


def _pool(
    team_id: str,
    excluded_id: str,
    teams: dict[str, list[str]],
    cohort: Cohort,
) -> tuple[list[str], list[str]]:
    assigned = {m for members in teams.values() for m in members}
    still_assigned = assigned - {excluded_id}
    # People who were never on a team. The removed member is free but putting
    # them back would just undo the remove, so they are not a candidate.
    unplaced = [
        m.id for m in cohort.members
        if m.id not in still_assigned and m.id != excluded_id
    ]
    stealable: list[str] = []
    for other_id, members in teams.items():
        if other_id == team_id:
            continue
        if len(members) <= cohort.config.min_size:
            continue
        stealable.extend(members)
    return unplaced, stealable


def _can_join(member_ids: list[str], cohort: Cohort) -> bool:
    if len(member_ids) > cohort.config.max_size:
        return False
    if not all(mid in cohort.index for mid in member_ids):
        return False
    members = [cohort.index[mid] for mid in member_ids]
    return constraints.availability_ok(members)


def _covers_missing_roles(wounded_ids: list[str], cand: str, cohort: Cohort) -> bool:
    before = set(constraints.missing_roles(
        [cohort.index[m] for m in wounded_ids], cohort.config.required_roles
    ))
    if not before:
        return False
    after = set(constraints.missing_roles(
        [cohort.index[m] for m in wounded_ids + [cand]], cohort.config.required_roles
    ))
    return bool(before - after)


def _primary_gap(flags: list[Flag]) -> Flag | None:
    for kind in ("missing_role", "single_point_of_failure", "availability_gap", "goal_mismatch"):
        for flag in flags:
            if flag.kind == kind:
                return flag
    return flags[0] if flags else None
