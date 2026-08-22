"""Deterministic score → prose. Never invents facts absent from the score object."""

from app.engine.types import Score, TeamResult

_TERM_LABEL = {
    "coverage": "role coverage",
    "complementarity": "skill spread",
    "availability_overlap": "shared hours",
    "goal_alignment": "shared ambition",
    "style_fit": "working-style fit",
    "interest_fit": "shared interests",
}

_PENALTY_LABEL = {
    "skill_redundancy": "overlapping skills",
    "role_gaps": "missing roles",
    "availability_starvation": "thin shared availability",
}

_FLAG_LINE = {
    "missing_role": "Missing required role: {role}.",
    "single_point_of_failure": "{skill} rests on a single member ({member_id}).",
    "availability_gap": "Shared overlap is only {overlap_minutes} min/week.",
    "goal_mismatch": "{outlier_id} is an ambition outlier on this team.",
}


def explain(score: Score) -> str:
    """One short paragraph decomposing terms, penalties, and flags."""
    parts: list[str] = [f"Team score {score.total:.2f}."]

    ranked_terms = sorted(score.terms.items(), key=lambda kv: kv[1], reverse=True)
    if ranked_terms:
        top_k, top_v = ranked_terms[0]
        parts.append(f"Strongest term is {_TERM_LABEL.get(top_k, top_k)} ({top_v:.2f}).")

    active_pens = [(k, v) for k, v in score.penalties.items() if v > 0]
    if active_pens:
        worst_k, worst_v = max(active_pens, key=lambda kv: kv[1])
        parts.append(f"Largest penalty is {_PENALTY_LABEL.get(worst_k, worst_k)} ({worst_v:.2f}).")
    else:
        parts.append("No penalties fired.")

    for flag in score.flags:
        template = _FLAG_LINE.get(flag.kind)
        if template:
            parts.append(template.format(**flag.payload))

    return " ".join(parts)


def explain_team(team: TeamResult) -> str:
    roles = ", ".join(f"{mid}={role}" for mid, role in sorted(team.role_assignments.items()))
    return f"{team.id} [{roles}]. {explain(team.score)}"
