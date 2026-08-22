"""Engine acceptance tests (spec §7 Phase 3). No server, no database."""

from app.engine import constraints, objective, solve
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
    assert scores == sorted(scores)
    assert all(step.op in {"seed", "swap", "move"} for step in result.step_log)
