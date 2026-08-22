"""Hard constraints and risk flags (spec §5).

Constraints gate feasibility — they are never traded off against score. Flags are
advisory: they describe what is wrong with a team that is nonetheless legal, and
the frontend renders them.
"""

from app.engine.objective import missing_roles, overlap_minutes
from app.engine.types import (
    AMBITION_VALUE,
    MIN_OVERLAP_MINUTES,
    Cohort,
    Config,
    Flag,
    Member,
)

# An overlap this close to the floor is legal but worth warning about.
AVAILABILITY_GAP_MARGIN = 60


def size_ok(member_ids: list[str], config: Config) -> bool:
    return config.min_size <= len(member_ids) <= config.max_size


def availability_ok(members: list[Member]) -> bool:
    return overlap_minutes(members) >= MIN_OVERLAP_MINUTES


def pair_can_meet(a: Member, b: Member) -> bool:
    """Necessary condition: two people who cannot clear the floor together can
    never sit on the same team, whoever else joins. The solver uses this to prune."""
    return overlap_minutes([a, b]) >= MIN_OVERLAP_MINUTES


def team_feasible(member_ids: list[str], cohort: Cohort) -> bool:
    """A team is legal iff its size is in range and it can actually meet."""
    if not size_ok(member_ids, cohort.config):
        return False
    index = cohort.index
    return availability_ok([index[mid] for mid in member_ids])


def partition_violations(teams: list[list[str]], cohort: Cohort) -> list[str]:
    """Every way a proposed partition breaks the hard rules. Empty means valid."""
    problems: list[str] = []
    config = cohort.config
    index = cohort.index

    seen: dict[str, int] = {}
    for t_idx, team in enumerate(teams):
        if not size_ok(team, config):
            problems.append(
                f"team {t_idx} has {len(team)} members, outside [{config.min_size}, {config.max_size}]"
            )
        members = [index[mid] for mid in team]
        minutes = overlap_minutes(members)
        if minutes < MIN_OVERLAP_MINUTES:
            problems.append(f"team {t_idx} shares only {minutes} min/week (floor {MIN_OVERLAP_MINUTES})")
        for mid in team:
            if mid in seen:
                problems.append(f"{mid} appears on teams {seen[mid]} and {t_idx}")
            seen[mid] = t_idx

    unplaced = [m.id for m in cohort.members if m.id not in seen]
    if unplaced:
        problems.append(f"{len(unplaced)} participants unplaced: {unplaced[:5]}")
    return problems


def partition_valid(teams: list[list[str]], cohort: Cohort) -> bool:
    return not partition_violations(teams, cohort)


def fairness_ok(teams: list[list[str]], cohort: Cohort) -> bool:
    """Everyone placed exactly once — the fairness guarantee the product promises."""
    placed = [mid for team in teams for mid in team]
    return len(placed) == len(set(placed)) == len(cohort.members)


# ------------------------------------------------------------------------- flags


def risk_flags(member_ids: list[str], cohort: Cohort) -> list[Flag]:
    """Advisory risks for a team, in the RiskFlag wire shape."""
    index = cohort.index
    members = [index[mid] for mid in member_ids]
    config = cohort.config
    flags: list[Flag] = []

    for role in missing_roles(members, config.required_roles):
        flags.append(Flag(kind="missing_role", payload={"role": role}))

    # single_point_of_failure: a required-role capability resting on one person.
    for role in config.required_roles:
        holders = [m for m in members if role in m.roles]
        if len(holders) == 1:
            holder = holders[0]
            skill = max(
                (s for s in holder.skills if role in s.roles),
                key=lambda s: s.proficiency,
                default=None,
            )
            flags.append(Flag(
                kind="single_point_of_failure",
                payload={"skill": skill.id if skill else role, "member_id": holder.id},
            ))

    minutes = overlap_minutes(members)
    if minutes < MIN_OVERLAP_MINUTES + AVAILABILITY_GAP_MARGIN:
        flags.append(Flag(kind="availability_gap", payload={"overlap_minutes": minutes}))

    outlier = ambition_outlier(members)
    if outlier is not None:
        flags.append(Flag(kind="goal_mismatch", payload={"outlier_id": outlier}))

    return flags


def ambition_outlier(members: list[Member]) -> str | None:
    """The lone member whose ambition disagrees with everyone else's."""
    if len(members) < 3:
        return None
    counts: dict[str, list[str]] = {}
    for m in members:
        counts.setdefault(m.ambition, []).append(m.id)
    if len(counts) < 2:
        return None
    minority = min(counts.items(), key=lambda kv: len(kv[1]))
    if len(minority[1]) != 1:
        return None
    # Only flag a genuine outlier: adjacent ambitions (ship vs win) are not a clash.
    others = [AMBITION_VALUE[m.ambition] for m in members if m.id != minority[1][0]]
    distance = abs(AMBITION_VALUE[minority[0]] - sum(others) / len(others))
    return minority[1][0] if distance > 1.0 else None
