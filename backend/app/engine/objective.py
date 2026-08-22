"""Team scoring (spec §4).

    score = Σ weight_i · term_i  −  Σ weight_j · penalty_j,  clamped to [0, 1]

The positive terms reward coverage and spread; the penalties are what make a
stack of five identical specialists score *below* a balanced four. Without
`skill_redundancy` in particular this whole thing degenerates into a skill-sum
ranker, which is the failure mode the spec calls out.

Pure Python + numpy/scipy only — no FastAPI, no SQLModel.
"""

import math

from scipy.stats import entropy

from app.engine.types import (
    AMBITION_VALUE,
    MIN_OVERLAP_MINUTES,
    OVERLAP_SATURATION_MINUTES,
    Cohort,
    Config,
    Member,
    Score,
)
from app.services.availability import intersect_all, total_minutes


def team_roles(members: list[Member]) -> set[str]:
    """Every role the team can plausibly staff."""
    out: set[str] = set()
    for m in members:
        out |= m.roles
    return out


def covered_roles(members: list[Member], required: tuple[str, ...]) -> set[str]:
    return {r for r in required if any(r in m.roles for m in members)}


def missing_roles(members: list[Member], required: tuple[str, ...]) -> list[str]:
    covered = covered_roles(members, required)
    return [r for r in required if r not in covered]


def overlap_minutes(members: list[Member]) -> int:
    """Shared weekly minutes across the whole team."""
    if not members:
        return 0
    return total_minutes(intersect_all([list(m.intervals) for m in members]))


# --------------------------------------------------------------------------- terms


def coverage(members: list[Member], config: Config) -> float:
    required = config.required_roles
    if not required:
        return 1.0
    return len(covered_roles(members, required)) / len(required)


def complementarity(members: list[Member], config: Config) -> float:
    """Normalized Shannon entropy of the team's skill-category distribution.

    Rewards spread across categories, not depth within one — five people who all
    hold `ml` skills land near 0, a balanced team near 1.
    """
    counts: dict[str, int] = {}
    for m in members:
        for s in m.skills:
            if s.strong:
                counts[s.category] = counts.get(s.category, 0) + 1
    if len(counts) <= 1:
        return 0.0
    # Normalize by the most spread this many skill instances could possibly be,
    # so a small team is not punished for holding fewer categories than exist.
    total = sum(counts.values())
    max_categories = min(config.n_categories, total)
    denom = math.log(max_categories) if max_categories > 1 else 1.0
    return float(entropy(list(counts.values())) / denom)


def availability_overlap(members: list[Member]) -> float:
    minutes = overlap_minutes(members)
    return min(minutes / OVERLAP_SATURATION_MINUTES, 1.0)


def goal_alignment(members: list[Member]) -> float:
    """1 − normalized variance of ambition over {learn:0, ship:1, win:2}.

    Max variance on a 0..2 axis is 1.0 (half the team at each extreme), so the
    variance is already on the right scale.
    """
    if len(members) <= 1:
        return 1.0
    values = [AMBITION_VALUE.get(m.ambition, 1.0) for m in members]
    mean = sum(values) / len(values)
    variance = sum((v - mean) ** 2 for v in values) / len(values)
    return max(0.0, 1.0 - min(variance, 1.0))


def style_fit(members: list[Member]) -> float:
    """Mild agreement term over work_style and sync_pref: the majority fraction
    of each attribute, averaged. Ranges 0.5 (perfectly split) to 1.0."""
    if not members:
        return 0.0
    if len(members) == 1:
        return 1.0
    fractions = []
    for attr in ("work_style", "sync_pref"):
        counts: dict[str, int] = {}
        for m in members:
            value = getattr(m, attr)
            counts[value] = counts.get(value, 0) + 1
        fractions.append(max(counts.values()) / len(members))
    return sum(fractions) / len(fractions)


def interest_fit(members: list[Member], cohort: Cohort) -> float:
    """Mean pairwise interest similarity, blended with a fairness component.

    The fairness half is the fraction of members who share at least something
    with at least one teammate — it is what stops the optimizer from parking a
    person with no connection to anyone into an otherwise strong team.
    """
    if len(members) <= 1:
        return 1.0
    sims = []
    connected = {m.id: False for m in members}
    for i, a in enumerate(members):
        for b in members[i + 1:]:
            s = cohort.sim(a.id, b.id)
            sims.append(s)
            if s > 0:
                connected[a.id] = True
                connected[b.id] = True
    mean_pairwise = sum(sims) / len(sims)
    fairness = sum(connected.values()) / len(members)
    return 0.7 * mean_pairwise + 0.3 * fairness


# ---------------------------------------------------------------------- penalties


def skill_redundancy(members: list[Member]) -> float:
    """Redundancy mass: duplicated strong skills as a fraction of all strong skills.

    Each skill held above threshold by more than one member contributes
    (holders − 1). Five people with the same stack approach 1.0; a team where
    everyone brings something different sits at 0.
    """
    holders: dict[str, int] = {}
    for m in members:
        for sid in {s.id for s in m.skills if s.strong}:
            holders[sid] = holders.get(sid, 0) + 1
    if not holders:
        return 0.0
    duplicated = sum(count - 1 for count in holders.values())
    total = sum(holders.values())
    return duplicated / total


def role_gaps(members: list[Member], config: Config) -> float:
    """Absolute magnitude of unfilled required roles, normalized."""
    required = config.required_roles
    if not required:
        return 0.0
    return len(missing_roles(members, required)) / len(required)


def availability_starvation(members: list[Member]) -> float:
    """Fires only below the 120 min/week floor; ramps to 1.0 at zero overlap."""
    minutes = overlap_minutes(members)
    if minutes >= MIN_OVERLAP_MINUTES:
        return 0.0
    return (MIN_OVERLAP_MINUTES - minutes) / MIN_OVERLAP_MINUTES


# -------------------------------------------------------------------------- total


def score_team(member_ids: list[str], cohort: Cohort) -> Score:
    """Full decomposed score for a candidate team."""
    index = cohort.index
    members = [index[mid] for mid in member_ids]
    config = cohort.config

    terms = {
        "coverage": coverage(members, config),
        "complementarity": complementarity(members, config),
        "availability_overlap": availability_overlap(members),
        "goal_alignment": goal_alignment(members),
        "style_fit": style_fit(members),
        "interest_fit": interest_fit(members, cohort),
    }
    pens = {
        "skill_redundancy": skill_redundancy(members),
        "role_gaps": role_gaps(members, config),
        "availability_starvation": availability_starvation(members),
    }

    positive = sum(config.weights[k] * v for k, v in terms.items())
    negative = sum(config.penalties[k] * v for k, v in pens.items())
    total = max(0.0, min(1.0, positive - negative))

    return Score(
        total=round(total, 4),
        terms={k: round(v, 4) for k, v in terms.items()},
        penalties={k: round(v, 4) for k, v in pens.items()},
        flags=[],
    )


def cohort_score(teams: list[list[str]], cohort: Cohort) -> float:
    """The global objective the solver maximizes: mean team score.

    Mean rather than sum so the number is comparable across partitions with
    different team counts, and so it lands on the 0..1 scale the frontend
    animates.
    """
    if not teams:
        return 0.0
    return sum(score_team(t, cohort).total for t in teams) / len(teams)
