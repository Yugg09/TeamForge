"""Partition a cohort into teams (spec §6).

Primary: OR-Tools CP-SAT on a linearized proxy (role coverage minus same-role
stacking) under the hard constraints, ~3s budget.
Fallback: greedy seed around the least-placeable participant, then SWAP/MOVE
local search. A move is accepted only if it raises the global mean score.

The engine is pure Python: no FastAPI, no SQLModel.
"""

from __future__ import annotations

import math
import random
from collections import defaultdict

from ortools.sat.python import cp_model

from app.engine import constraints, objective
from app.engine.roles import assign_roles
from app.engine.types import Cohort, Score, SolveResult, Step, TeamResult

CP_SAT_BUDGET_SECONDS = 3.0
LOCAL_SEARCH_ROUNDS = 20


def solve(cohort: Cohort, *, rng: random.Random | None = None) -> SolveResult:
    """Partition `cohort` and return teams, a climbing step_log, and fairness."""
    rng = rng or random.Random(0)
    components = _connected_components(cohort)
    teams: list[list[str]] = []
    step_log: list[Step] = []

    for component in components:
        sub = _sub_cohort(cohort, component)
        partition = _best_start(sub)
        if not partition:
            continue
        teams.extend(partition)

    if teams:
        step_log.append(Step(
            op="seed",
            teams_touched=[_placeholder_id(i) for i in range(len(teams))],
            total_score=_mean_score(teams, cohort),
        ))

    teams, extra = _local_search(teams, cohort, rng)
    step_log.extend(extra)
    _relabel_steps(step_log, teams)

    return _assemble(teams, cohort, step_log)


def _best_start(cohort: Cohort) -> list[list[str]] | None:
    """CP-SAT on small components (linear proxy); greedy otherwise, then the other as backup."""
    n = len(cohort.members)
    greedy = _greedy_partition(cohort)
    complete = greedy and sum(len(t) for t in greedy) == n
    if complete:
        return greedy

    cpsat = _cpsat_partition(cohort)
    ranked = [p for p in (cpsat, greedy) if p]
    if not ranked:
        return None

    def key(part: list[list[str]]) -> tuple[int, float]:
        placed = sum(len(t) for t in part)
        return (int(placed == n), _mean_score(part, cohort) if placed else 0.0)

    return max(ranked, key=key)


# --------------------------------------------------------------------------- CP-SAT


def _cpsat_partition(cohort: Cohort, time_limit: float = CP_SAT_BUDGET_SECONDS) -> list[list[str]] | None:
    members = list(cohort.members)
    n = len(members)
    cfg = cohort.config
    n_teams = _n_teams(n, cfg.min_size, cfg.max_size)
    if n_teams is None:
        return None

    model = cp_model.CpModel()
    x = {(i, t): model.NewBoolVar(f"x_{i}_{t}") for i in range(n) for t in range(n_teams)}

    for i in range(n):
        model.Add(sum(x[i, t] for t in range(n_teams)) == 1)
    for t in range(n_teams):
        model.Add(sum(x[i, t] for i in range(n)) >= cfg.min_size)
        model.Add(sum(x[i, t] for i in range(n)) <= cfg.max_size)

    for i in range(n):
        for j in range(i + 1, n):
            if constraints.pair_can_meet(members[i], members[j]):
                continue
            for t in range(n_teams):
                model.Add(x[i, t] + x[j, t] <= 1)

    cover_vars = []
    for t in range(n_teams):
        for role in cfg.required_roles:
            covered = model.NewBoolVar(f"cover_{t}_{role}")
            holders = [i for i, m in enumerate(members) if role in m.roles]
            if holders:
                model.Add(sum(x[i, t] for i in holders) >= covered)
            else:
                model.Add(covered == 0)
            cover_vars.append(covered)

    stack_vars = []
    for t in range(n_teams):
        for i in range(n):
            for j in range(i + 1, n):
                a, b = members[i].preferred_roles[:1], members[j].preferred_roles[:1]
                if not a or a != b:
                    continue
                same = model.NewBoolVar(f"stack_{i}_{j}_{t}")
                model.Add(x[i, t] + x[j, t] <= 1 + same)
                stack_vars.append(same)

    model.Maximize(100 * sum(cover_vars) - sum(stack_vars))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit
    solver.parameters.random_seed = 0
    status = solver.Solve(model)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return None

    teams = []
    for t in range(n_teams):
        group = [members[i].id for i in range(n) if solver.Value(x[i, t])]
        if group:
            teams.append(sorted(group))
    if constraints.partition_valid(teams, cohort):
        return teams
    return _repair(teams, cohort)


# ------------------------------------------------------------------------- greedy


def _greedy_partition(cohort: Cohort) -> list[list[str]] | None:
    """Opportunistic packing: grow legal teams, then dump leftovers into slack."""
    cfg = cohort.config
    remaining = {m.id for m in cohort.members}
    teams: list[list[str]] = []
    skipped: set[str] = set()

    while len(remaining) >= cfg.min_size:
        candidates = remaining - skipped
        if not candidates:
            break
        seed = _least_placeable(candidates, cohort)
        target = _next_target(len(remaining), cfg.min_size, cfg.max_size)
        pool = set(remaining)
        team = _grow_team(seed, pool, target, cohort)
        if not constraints.size_ok(team, cfg):
            skipped.add(seed)
            continue
        remaining = pool
        skipped.clear()
        teams.append(sorted(team))

    _absorb_leftovers(teams, remaining, cohort)
    if remaining:
        extra = _rescue_leftovers(teams, remaining, cohort)
        if extra:
            teams.extend(extra)

    if remaining or not teams:
        return None
    if not constraints.partition_valid(teams, cohort):
        return None
    return teams


def _repair(teams: list[list[str]], cohort: Cohort) -> list[list[str]] | None:
    """Keep legal teams from a pairwise-only CP-SAT assignment; re-pack the rest."""
    keep: list[list[str]] = []
    leftover: list[str] = []
    for group in teams:
        if constraints.team_feasible(group, cohort):
            keep.append(sorted(group))
        else:
            leftover.extend(group)
    if leftover:
        sub = _sub_cohort(cohort, leftover)
        rebuilt = _greedy_partition(sub)
        if rebuilt is None:
            return keep or None
        keep.extend(rebuilt)
    if not constraints.partition_valid(keep, cohort):
        return None
    return keep


def _absorb_leftovers(teams: list[list[str]], remaining: set[str], cohort: Cohort) -> None:
    cfg = cohort.config
    progressed = True
    while remaining and progressed:
        progressed = False
        for pid in sorted(remaining):
            best: tuple[float, int] | None = None
            for i, team in enumerate(teams):
                if len(team) >= cfg.max_size:
                    continue
                trial = team + [pid]
                if not constraints.team_feasible(trial, cohort):
                    continue
                score = objective.score_team(trial, cohort).total
                if best is None or score > best[0]:
                    best = (score, i)
            if best is None:
                continue
            teams[best[1]].append(pid)
            teams[best[1]].sort()
            remaining.remove(pid)
            progressed = True
            break


def _rescue_leftovers(
    teams: list[list[str]], remaining: set[str], cohort: Cohort
) -> list[list[str]]:
    """Steal from oversized teams to give leftovers a legal home."""
    cfg = cohort.config
    extras: list[list[str]] = []
    while remaining and any(len(t) > cfg.min_size for t in teams):
        seed = sorted(remaining)[0]
        pool = set(remaining)
        trial = _grow_team(seed, pool, cfg.max_size, cohort)
        if constraints.size_ok(trial, cfg):
            remaining.intersection_update(pool)
            extras.append(sorted(trial))
            continue

        formed: list[str] | None = None
        donors = [i for i, t in enumerate(teams) if len(t) > cfg.min_size]
        for donor_i in donors:
            for member in list(teams[donor_i]):
                rest = [m for m in teams[donor_i] if m != member]
                if not constraints.size_ok(rest, cfg) or not constraints.team_feasible(rest, cohort):
                    continue
                grown_pool = set(remaining) | {member}
                grown = _grow_team(seed, grown_pool, cfg.max_size, cohort)
                if not constraints.size_ok(grown, cfg) or member not in grown:
                    continue
                stolen = [m for m in grown if m not in remaining and m != seed]
                new_donor = [m for m in teams[donor_i] if m not in stolen]
                if not constraints.team_feasible(new_donor, cohort):
                    continue
                teams[donor_i] = sorted(new_donor)
                remaining.difference_update(grown)
                formed = sorted(grown)
                break
            if formed:
                break
        if not formed:
            break
        extras.append(formed)
    return extras


def _grow_team(seed: str, remaining: set[str], target: int, cohort: Cohort) -> list[str]:
    team = [seed]
    remaining.remove(seed)
    while len(team) < target and remaining:
        best: tuple[float, str] | None = None
        for cand in remaining:
            trial = team + [cand]
            if not _partial_ok(trial, cohort):
                continue
            # Score even undersized groups so we grow toward complementarity.
            score = objective.score_team(trial, cohort).total
            key = (score, cand)
            if best is None or key > best:
                best = key
        if best is None:
            break
        team.append(best[1])
        remaining.remove(best[1])
    return team


def _partial_ok(member_ids: list[str], cohort: Cohort) -> bool:
    """Availability + max-size only. Min-size is enforced once the team is finished."""
    if len(member_ids) > cohort.config.max_size:
        return False
    members = [cohort.index[mid] for mid in member_ids]
    return constraints.availability_ok(members)


def _least_placeable(candidates: set[str], cohort: Cohort) -> str:
    index = cohort.index
    scored = []
    for pid in candidates:
        friends = sum(
            1 for other in candidates
            if other != pid and constraints.pair_can_meet(index[pid], index[other])
        )
        scored.append((friends, pid))
    scored.sort()
    return scored[0][1]


# -------------------------------------------------------------------- local search


def _local_search(
    teams: list[list[str]],
    cohort: Cohort,
    rng: random.Random,
) -> tuple[list[list[str]], list[Step]]:
    if not teams:
        return teams, []
    current = [list(t) for t in teams]
    team_scores = [objective.score_team(t, cohort).total for t in current]
    best_score = round(sum(team_scores) / len(team_scores), 4)
    log: list[Step] = []

    def consider(trial: list[list[str]], touched: tuple[int, ...], op: str) -> bool:
        nonlocal current, team_scores, best_score
        if not _teams_feasible(trial, touched, cohort):
            return False
        new_scores = list(team_scores)
        for idx in touched:
            new_scores[idx] = objective.score_team(trial[idx], cohort).total
        score = round(sum(new_scores) / len(new_scores), 4)
        if score <= best_score:
            return False
        current = trial
        team_scores = new_scores
        best_score = score
        log.append(Step(
            op=op,
            teams_touched=[_placeholder_id(i) for i in touched],
            total_score=score,
        ))
        return True

    for _ in range(LOCAL_SEARCH_ROUNDS):
        improved = False

        for i in range(len(current)):
            for j in range(i + 1, len(current)):
                for a_idx, a in enumerate(current[i]):
                    for b_idx, b in enumerate(current[j]):
                        trial = [list(t) for t in current]
                        trial[i][a_idx], trial[j][b_idx] = b, a
                        if consider(trial, (i, j), "swap"):
                            improved = True
                            break
                    if improved:
                        break
                if improved:
                    break
            if improved:
                break

        if improved:
            continue

        for src in range(len(current)):
            if len(current[src]) <= cohort.config.min_size:
                continue
            for dst in range(len(current)):
                if src == dst or len(current[dst]) >= cohort.config.max_size:
                    continue
                for member in list(current[src]):
                    trial = [list(t) for t in current]
                    trial[src] = [m for m in trial[src] if m != member]
                    trial[dst] = trial[dst] + [member]
                    if consider(trial, (src, dst), "move"):
                        improved = True
                        break
                if improved:
                    break
            if improved:
                break

        if not improved:
            break

    _ = rng  # reserved for simulated-annealing plateaus; only improving moves are kept
    return current, log


def _teams_feasible(teams: list[list[str]], touched: tuple[int, ...], cohort: Cohort) -> bool:
    for idx in touched:
        if not constraints.team_feasible(teams[idx], cohort):
            return False
    return True


# ------------------------------------------------------------------- assembly


def build_team(team_id: str, member_ids: list[str], cohort: Cohort) -> TeamResult:
    """Score, flag, and assign roles for one team. Used by the solver and rebalancer."""
    ordered = sorted(member_ids)
    return TeamResult(
        id=team_id,
        member_ids=ordered,
        role_assignments=assign_roles(ordered, cohort),
        score=_scored(ordered, cohort),
    )


def _assemble(teams: list[list[str]], cohort: Cohort, step_log: list[Step]) -> SolveResult:
    results: list[TeamResult] = []
    for i, members in enumerate(teams):
        results.append(build_team(_placeholder_id(i), members, cohort))
    return SolveResult(
        teams=results,
        step_log=step_log,
        fairness_ok=constraints.fairness_ok([t.member_ids for t in results], cohort),
    )


def _scored(member_ids: list[str], cohort: Cohort) -> Score:
    score = objective.score_team(member_ids, cohort)
    score.flags = constraints.risk_flags(member_ids, cohort)
    return score


def _mean_score(teams: list[list[str]], cohort: Cohort) -> float:
    return round(objective.cohort_score(teams, cohort), 4)


def _placeholder_id(index: int) -> str:
    return f"team_{index + 1}"


def _relabel_steps(step_log: list[Step], teams: list[list[str]]) -> None:
    """Keep team ids stable as team_1..team_n matching the final order."""
    # Steps already use placeholder ids by index; re-stamp after any MOVE that
    # could have changed lengths but not identities of the slots.
    _ = teams
    for step in step_log:
        step.teams_touched = list(dict.fromkeys(step.teams_touched))


# -------------------------------------------------------------------- helpers


def _connected_components(cohort: Cohort) -> list[list[str]]:
    """Compatibility-graph components. Cross-band people never share a team."""
    ids = [m.id for m in cohort.members]
    parent = {i: i for i in ids}

    def find(x: str) -> str:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a: str, b: str) -> None:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[rb] = ra

    index = cohort.index
    for i, a in enumerate(ids):
        for b in ids[i + 1:]:
            if constraints.pair_can_meet(index[a], index[b]):
                union(a, b)

    groups: dict[str, list[str]] = defaultdict(list)
    for pid in ids:
        groups[find(pid)].append(pid)
    return [sorted(g) for g in groups.values()]


def _sub_cohort(cohort: Cohort, ids: list[str]) -> Cohort:
    wanted = set(ids)
    members = tuple(m for m in cohort.members if m.id in wanted)
    similarity = {
        pair: value for pair, value in cohort.similarity.items()
        if pair[0] in wanted and pair[1] in wanted
    }
    return Cohort(members=members, config=cohort.config, similarity=similarity)


def _n_teams(n: int, min_size: int, max_size: int) -> int | None:
    if n < min_size:
        return None
    lo = math.ceil(n / max_size)
    hi = n // min_size
    if lo > hi:
        return None
    return lo


def _next_target(remaining: int, min_size: int, max_size: int) -> int:
    """Pick a team size that leaves 0 or at least min_size people still to place."""
    for size in range(max_size, min_size - 1, -1):
        left = remaining - size
        if left == 0 or left >= min_size:
            return size
    return min_size
