"""Engine acceptance tests (spec §7 Phase 3). No server, no database."""

from app.engine import accept_replacement, constraints, objective, remove_member, solve
from app.engine.types import MIN_OVERLAP_MINUTES
from tests.factories import (
    NIGHT,
    WEEKEND,
    balanced_five,
    cohort_of,
    identical_five,
    participant,
)


def test_identical_specialists_score_below_a_complementary_team():
    stacked = objective.score_team(
        [p["id"] for p in identical_five()], cohort_of(identical_five())
    )
    balanced = objective.score_team(
        [p["id"] for p in balanced_five()], cohort_of(balanced_five())
    )
    assert stacked.total < balanced.total


def test_unmeetable_subset_never_yields_a_team_under_the_overlap_floor():
    day = balanced_five(prefix="d", availability=WEEKEND)
    night = balanced_five(prefix="n", availability=NIGHT)
    cohort = cohort_of(day + night)
    result = solve(cohort)

    for team in result.teams:
        members = [cohort.index[mid] for mid in team.member_ids]
        assert constraints.overlap_minutes(members) >= MIN_OVERLAP_MINUTES
        bands = {mid[0] for mid in team.member_ids}
        assert len(bands) == 1, "day and night people must not share a team"


def test_seed_cohort_places_everyone_on_legal_teams():
    from app.seed import build_cohort as seed_people

    people = seed_people()
    cohort = cohort_of(people)
    result = solve(cohort)
    placed = [mid for team in result.teams for mid in team.member_ids]
    assert len(people) == 48
    assert sorted(placed) == sorted(p["id"] for p in people)
    assert result.fairness_ok
    for team in result.teams:
        assert constraints.team_feasible(team.member_ids, cohort)


def test_form_teams_places_everyone_exactly_once():
    people = balanced_five(prefix="a") + balanced_five(prefix="b")
    cohort = cohort_of(people)
    result = solve(cohort)
    placed = [mid for team in result.teams for mid in team.member_ids]
    assert sorted(placed) == sorted(p["id"] for p in people)
    assert result.fairness_ok
    assert constraints.partition_valid([t.member_ids for t in result.teams], cohort)


def test_step_log_is_monotonically_non_decreasing():
    people = (
        balanced_five(prefix="a")
        + identical_five(prefix="s")
        + balanced_five(prefix="c")
    )
    result = solve(cohort_of(people))
    assert result.step_log, "solver must emit a step_log the frontend can animate"
    scores = [step.total_score for step in result.step_log]
    # Scores should be non-decreasing (each step improves or maintains the score)
    for i in range(1, len(scores)):
        assert scores[i] >= scores[i - 1], f"Score decreased at step {i}: {scores[i-1]} -> {scores[i]}"
    # Valid operations: start strategies, swap, move
    valid_ops = {"seed", "swap", "move", "start_cp_sat", "start_greedy", "start_random_greedy", "fallback_greedy"}
    assert all(step.op in valid_ops for step in result.step_log)


def _unique_role_member(team, cohort):
    for mid in team.member_ids:
        rest = [m for m in team.member_ids if m != mid]
        flags = constraints.risk_flags(rest, cohort)
        if any(f.kind == "missing_role" for f in flags):
            return mid
    return team.member_ids[0]


def test_remove_returns_gap_flag_and_a_replacement():
    people = balanced_five(prefix="a") + balanced_five(prefix="b")
    cohort = cohort_of(people)
    result = solve(cohort)
    team = result.teams[0]
    member = _unique_role_member(team, cohort)
    teams = {t.id: list(t.member_ids) for t in result.teams}

    out = remove_member(team.id, member, teams, cohort)
    assert out.gap_flag is not None
    assert out.suggested_replacement_id is not None
    assert out.suggested_replacement_id not in out.team.member_ids
    assert member not in out.team.member_ids


def test_accept_heals_the_gap_and_raises_score():
    people = balanced_five(prefix="a") + balanced_five(prefix="b")
    cohort = cohort_of(people)
    result = solve(cohort)
    team = result.teams[0]
    member = _unique_role_member(team, cohort)
    teams = {t.id: list(t.member_ids) for t in result.teams}

    wounded = remove_member(team.id, member, teams, cohort)
    teams[team.id] = wounded.team.member_ids
    healed = accept_replacement(team.id, wounded.suggested_replacement_id, teams, cohort)

    assert healed.gap_flag is None
    assert healed.score_after > healed.score_before
    assert wounded.suggested_replacement_id in healed.team.member_ids
    assert member not in healed.team.member_ids
