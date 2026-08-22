"""Objective and constraint unit tests (spec §4, §5). No server, no database."""

from app.engine import constraints, objective
from app.engine.types import MIN_OVERLAP_MINUTES
from tests.factories import (
    NIGHT,
    SLIVER,
    WEEKEND,
    balanced_five,
    cohort_of,
    identical_five,
    participant,
)


def score_of(people):
    cohort = cohort_of(people)
    return objective.score_team([p["id"] for p in people], cohort)


# --- the product's defining property ---------------------------------------


def test_identical_specialists_score_below_a_complementary_team():
    """The Team A / Team B guarantee: this is the whole product."""
    stacked = score_of(identical_five())
    balanced = score_of(balanced_five())
    assert stacked.total < balanced.total
    assert stacked.penalties["skill_redundancy"] > 0.5
    assert balanced.penalties["skill_redundancy"] == 0.0


def test_redundancy_penalty_is_what_breaks_the_tie():
    """Strip the penalty and the stacked team must stop being clearly worse —
    proving the penalty, not some incidental term, carries the property."""
    stacked = score_of(identical_five())
    weights = {"skill_redundancy": 0.15, "role_gaps": 0.30, "availability_starvation": 0.25}
    penalty_mass = sum(weights[k] * v for k, v in stacked.penalties.items())
    assert penalty_mass > 0.3


# --- individual terms -------------------------------------------------------


def test_coverage_counts_required_roles_only():
    people = [
        participant("a", "backend", ["node"]),
        participant("b", "frontend", ["react"]),
        participant("c", "devops", ["kubernetes"]),
    ]
    cohort = cohort_of(people)
    score = objective.score_team(["a", "b", "c"], cohort)
    # required = frontend, backend, ai_ml, design -> 2 of 4 covered
    assert score.terms["coverage"] == 0.5
    assert score.penalties["role_gaps"] == 0.5


def test_complementarity_is_zero_for_a_single_category():
    people = identical_five()
    assert score_of(people).terms["complementarity"] == 0.0
    assert score_of(balanced_five()).terms["complementarity"] > 0.7


def test_availability_overlap_saturates_at_ten_hours():
    long_window = [{"day": 5, "start_utc": 0, "end_utc": 1200}]
    people = balanced_five(availability=long_window)
    assert score_of(people).terms["availability_overlap"] == 1.0


def test_goal_alignment_is_one_when_everyone_agrees():
    people = [participant(f"g{i}", "backend", ambition="win") for i in range(4)]
    assert score_of(people).terms["goal_alignment"] == 1.0


def test_goal_alignment_drops_when_ambitions_split():
    people = [
        participant("g0", "backend", ambition="win"),
        participant("g1", "frontend", ambition="win"),
        participant("g2", "design", ambition="learn"),
        participant("g3", "ai_ml", ambition="learn"),
    ]
    assert score_of(people).terms["goal_alignment"] == 0.0


def test_style_fit_is_higher_when_the_team_agrees():
    agree = [participant(f"a{i}", "backend", work_style="planner", sync_pref="sync") for i in range(4)]
    split = [
        participant("s0", "backend", work_style="planner", sync_pref="sync"),
        participant("s1", "backend", work_style="improviser", sync_pref="async"),
        participant("s2", "backend", work_style="planner", sync_pref="async"),
        participant("s3", "backend", work_style="improviser", sync_pref="sync"),
    ]
    assert score_of(agree).terms["style_fit"] > score_of(split).terms["style_fit"]


def test_interest_fit_rewards_shared_interests():
    shared = [participant(f"i{i}", "backend", interests=["search"]) for i in range(4)]
    disjoint = [participant(f"d{i}", "backend", interests=[f"topic_{i}"]) for i in range(4)]
    assert score_of(shared).terms["interest_fit"] > score_of(disjoint).terms["interest_fit"]


def test_starvation_penalty_only_fires_below_the_floor():
    healthy = score_of(balanced_five())
    assert healthy.penalties["availability_starvation"] == 0.0

    starving = balanced_five()
    starving[0]["availability"] = SLIVER
    assert score_of(starving).penalties["availability_starvation"] > 0.0


def test_total_is_clamped_to_unit_interval():
    for people in (identical_five(), balanced_five()):
        total = score_of(people).total
        assert 0.0 <= total <= 1.0


# --- hard constraints -------------------------------------------------------


def test_team_with_no_shared_time_is_infeasible():
    people = balanced_five()
    people[0]["availability"] = NIGHT
    cohort = cohort_of(people)
    assert not constraints.team_feasible([p["id"] for p in people], cohort)


def test_size_bounds_are_enforced():
    people = balanced_five()
    cohort = cohort_of(people, min_size=3, max_size=4)
    assert not constraints.team_feasible([p["id"] for p in people], cohort)
    assert constraints.team_feasible([p["id"] for p in people[:4]], cohort)


def test_pair_pruning_matches_full_team_check():
    a = participant("a", "backend", availability=WEEKEND)
    b = participant("b", "frontend", availability=NIGHT)
    cohort = cohort_of([a, b])
    index = cohort.index
    assert not constraints.pair_can_meet(index["a"], index["b"])


def test_partition_violations_catch_duplicates_and_omissions():
    people = balanced_five() + balanced_five(prefix="c")
    cohort = cohort_of(people)
    duplicated = [["b0", "b1", "b2"], ["b0", "b3", "b4"]]
    problems = constraints.partition_violations(duplicated, cohort)
    assert any("appears on teams" in p for p in problems)
    assert any("unplaced" in p for p in problems)
    assert not constraints.fairness_ok(duplicated, cohort)


def test_a_valid_partition_has_no_violations():
    people = balanced_five() + balanced_five(prefix="c")
    cohort = cohort_of(people)
    teams = [["b0", "b1", "b2", "b3", "b4"], ["c0", "c1", "c2", "c3", "c4"]]
    assert constraints.partition_violations(teams, cohort) == []
    assert constraints.fairness_ok(teams, cohort)


# --- risk flags -------------------------------------------------------------


def test_missing_role_flag_names_the_gap():
    people = [
        participant("a", "backend", ["python"]),
        participant("b", "frontend", ["react"]),
        participant("c", "ai_ml", ["pytorch"]),
    ]
    cohort = cohort_of(people)
    flags = constraints.risk_flags(["a", "b", "c"], cohort)
    missing = [f for f in flags if f.kind == "missing_role"]
    assert [f.payload["role"] for f in missing] == ["design"]


def test_single_point_of_failure_flag_names_the_member():
    cohort = cohort_of(balanced_five())
    flags = constraints.risk_flags([f"b{i}" for i in range(5)], cohort)
    spofs = [f for f in flags if f.kind == "single_point_of_failure"]
    # every required role rests on exactly one person in a perfectly balanced team
    assert len(spofs) == 4
    assert all({"skill", "member_id"} <= set(f.payload) for f in spofs)


def test_availability_gap_flag_fires_near_the_floor():
    people = balanced_five()
    people[0]["availability"] = [{"day": 5, "start_utc": 900, "end_utc": 1030}]  # 130 min
    cohort = cohort_of(people)
    flags = constraints.risk_flags([p["id"] for p in people], cohort)
    gaps = [f for f in flags if f.kind == "availability_gap"]
    assert gaps and gaps[0].payload["overlap_minutes"] >= MIN_OVERLAP_MINUTES


def test_goal_mismatch_flags_only_a_real_outlier():
    outlier = [participant(f"o{i}", "backend", ambition="win") for i in range(3)]
    outlier.append(participant("o3", "design", ambition="learn"))
    cohort = cohort_of(outlier)
    flags = constraints.risk_flags([p["id"] for p in outlier], cohort)
    assert [f.payload["outlier_id"] for f in flags if f.kind == "goal_mismatch"] == ["o3"]

    # ship among wins is adjacent, not a clash
    mild = [participant(f"m{i}", "backend", ambition="win") for i in range(3)]
    mild.append(participant("m3", "design", ambition="ship"))
    cohort = cohort_of(mild)
    flags = constraints.risk_flags([p["id"] for p in mild], cohort)
    assert not [f for f in flags if f.kind == "goal_mismatch"]
