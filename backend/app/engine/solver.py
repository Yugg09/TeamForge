"""Partition a cohort into teams (spec §6).

Multi-start solver with simulated annealing:
1. Try multiple starting strategies (CP-SAT, greedy, random greedy)
2. Apply simulated annealing local search to escape local optima
3. Keep the best partition across all starts

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
LOCAL_SEARCH_ROUNDS = 30  # More rounds for better optimization
MULTI_START_RUNS = 3      # Number of different starting points
SA_INITIAL_TEMP = 0.05    # Initial temperature for simulated annealing
SA_COOLING_RATE = 0.95    # Temperature decay per round
SA_MIN_TEMP = 0.001       # Minimum temperature (stop annealing)


def solve(cohort: Cohort, *, rng: random.Random | None = None) -> SolveResult:
    """Partition `cohort` using multi-start solver with simulated annealing.
    
    Returns the best partition found across multiple starts, with a step log
    showing the optimization trajectory.
    """
    rng = rng or random.Random(0)
    
    # Multi-start: try different starting points and keep the best
    best_teams: list[list[str]] = []
    best_score = -1.0
    best_step_log: list[Step] = []
    
    start_strategies = [
        ("cp_sat", _cpsat_start),
        ("greedy", _greedy_start),
        ("random_greedy", _random_greedy_start),
    ]
    
    for start_idx, (strategy_name, strategy_fn) in enumerate(start_strategies[:MULTI_START_RUNS]):
        # Create a new RNG for each start to ensure different solutions
        start_rng = random.Random(rng.randint(0, 2**31))
        
        # Generate initial partition
        partition = strategy_fn(cohort, start_rng)
        if not partition:
            continue
        
        # Record the starting score
        start_score = _mean_score(partition, cohort)
        
        # Apply simulated annealing local search
        partition, anneal_log = _simulated_annealing(partition, cohort, start_rng)
        
        # Build step log for this start
        start_step = Step(
            op=f"start_{strategy_name}",
            teams_touched=[_placeholder_id(i) for i in range(len(partition))],
            total_score=start_score,
        )
        
        final_score = _mean_score(partition, cohort)
        
        # Track the best partition
        if final_score > best_score:
            best_teams = partition
            best_score = final_score
            best_step_log = [start_step] + anneal_log
    
    if not best_teams:
        # Fallback: try greedy one more time
        best_teams = _greedy_partition(cohort) or []
        if best_teams:
            best_score = _mean_score(best_teams, cohort)
            best_step_log = [Step(
                op="fallback_greedy",
                teams_touched=[_placeholder_id(i) for i in range(len(best_teams))],
                total_score=best_score,
            )]
    
    _relabel_steps(best_step_log, best_teams)
    return _assemble(best_teams, cohort, best_step_log)


# ------------------------------------------------------------------ start strategies


def _cpsat_start(cohort: Cohort, rng: random.Random) -> list[list[str]] | None:
    """Start with CP-SAT partition."""
    return _cpsat_partition(cohort)


def _greedy_start(cohort: Cohort, rng: random.Random) -> list[list[str]] | None:
    """Start with deterministic greedy partition."""
    return _greedy_partition(cohort)


def _random_greedy_start(cohort: Cohort, rng: random.Random) -> list[list[str]] | None:
    """Start with randomized greedy (shuffle candidate order)."""
    # Create a shuffled version of the cohort
    members = list(cohort.members)
    rng.shuffle(members)
    shuffled_cohort = Cohort(
        members=tuple(members),
        config=cohort.config,
        similarity=cohort.similarity,
    )
    return _greedy_partition(shuffled_cohort)


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


# ---------------------------------------------------------------- simulated annealing


def _simulated_annealing(
    teams: list[list[str]],
    cohort: Cohort,
    rng: random.Random,
) -> tuple[list[list[str]], list[Step]]:
    """Local search with simulated annealing to escape local optima.
    
    Unlike basic local search which only accepts improving moves,
    simulated annealing occasionally accepts worse moves to escape
    local optima, then gradually reduces this tolerance.
    """
    if not teams:
        return teams, []
    
    current = [list(t) for t in teams]
    team_scores = [objective.score_team(t, cohort).total for t in current]
    current_score = round(sum(team_scores) / len(team_scores), 4)
    
    best = [list(t) for t in current]
    best_scores = list(team_scores)
    best_score = current_score
    
    log: list[Step] = []
    temp = SA_INITIAL_TEMP
    
    for round_num in range(LOCAL_SEARCH_ROUNDS):
        improved = False
        
        # Try all SWAP moves
        for i in range(len(current)):
            for j in range(i + 1, len(current)):
                for a_idx, a in enumerate(current[i]):
                    for b_idx, b in enumerate(current[j]):
                        trial = [list(t) for t in current]
                        trial[i][a_idx], trial[j][b_idx] = b, a
                        
                        if not _teams_feasible(trial, (i, j), cohort):
                            continue
                        
                        new_scores = list(team_scores)
                        new_scores[i] = objective.score_team(trial[i], cohort).total
                        new_scores[j] = objective.score_team(trial[j], cohort).total
                        new_score = round(sum(new_scores) / len(new_scores), 4)
                        
                        delta = new_score - current_score
                        
                        # Accept if improving, or with probability based on temperature
                        if delta > 0 or (temp > SA_MIN_TEMP and rng.random() < math.exp(delta / temp)):
                            current = trial
                            team_scores = new_scores
                            current_score = new_score
                            improved = True
                            
                            if new_score > best_score:
                                best = [list(t) for t in current]
                                best_scores = list(team_scores)
                                best_score = new_score
                                log.append(Step(
                                    op="swap",
                                    teams_touched=[_placeholder_id(i), _placeholder_id(j)],
                                    total_score=new_score,
                                ))
                            break
                    if improved:
                        break
                if improved:
                    break
            if improved:
                break
        
        # Try all MOVE moves if no swap improved
        if not improved:
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
                        
                        if not _teams_feasible(trial, (src, dst), cohort):
                            continue
                        
                        new_scores = list(team_scores)
                        new_scores[src] = objective.score_team(trial[src], cohort).total
                        new_scores[dst] = objective.score_team(trial[dst], cohort).total
                        new_score = round(sum(new_scores) / len(new_scores), 4)
                        
                        delta = new_score - current_score
                        
                        if delta > 0 or (temp > SA_MIN_TEMP and rng.random() < math.exp(delta / temp)):
                            current = trial
                            team_scores = new_scores
                            current_score = new_score
                            improved = True
                            
                            if new_score > best_score:
                                best = [list(t) for t in current]
                                best_scores = list(team_scores)
                                best_score = new_score
                                log.append(Step(
                                    op="move",
                                    teams_touched=[_placeholder_id(src), _placeholder_id(dst)],
                                    total_score=new_score,
                                ))
                            break
                    if improved:
                        break
                if improved:
                    break
        
        # Cool down
        temp *= SA_COOLING_RATE
    
    # Return the best solution found (not necessarily the current one)
    return best, log


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
