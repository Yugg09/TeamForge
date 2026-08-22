"""Assign each member a role via max-weight bipartite matching (spec §6).

Members on one side, the event's required roles on the other. Weight is
role-relevant proficiency × preference rank. Extra members (team larger than
the required-role set) fall through to their next-best preferred or implied role.
"""

from collections import defaultdict

import networkx as nx

from app.engine.types import Cohort, Member
from app.services.taxonomy import ROLES


def _weight(member: Member, role: str) -> float:
    proficiency = member.proficiency_for(role)
    if role in member.preferred_roles:
        rank = member.preferred_roles.index(role)
    elif role in member.implied_roles:
        rank = len(member.preferred_roles) + 1
    else:
        return 0.0
    # Prefer earlier-listed roles; proficiency still dominates.
    return proficiency * (1.0 / (1 + rank)) + (0.1 if role in member.preferred_roles else 0.0)


def assign_roles(member_ids: list[str], cohort: Cohort) -> dict[str, str]:
    """member_id -> role id. Every member gets exactly one role."""
    members = [cohort.index[mid] for mid in member_ids]
    required = list(cohort.config.required_roles)

    graph = nx.Graph()
    graph.add_nodes_from([m.id for m in members], bipartite=0)
    graph.add_nodes_from([f"role:{r}" for r in required], bipartite=1)

    for member in members:
        for role in required:
            weight = _weight(member, role)
            if weight <= 0:
                continue
            graph.add_edge(member.id, f"role:{role}", weight=weight)

    raw = nx.max_weight_matching(graph, maxcardinality=True)
    matched: dict[str, str] = {}
    if isinstance(raw, dict):
        matched = {str(k): str(v) for k, v in raw.items()}
    else:
        for edge in raw:
            a, b = tuple(edge)
            matched[str(a)] = str(b)
            matched[str(b)] = str(a)

    assignments: dict[str, str] = {}
    taken: set[str] = set()
    for member in members:
        other = matched.get(member.id)
        if other and other.startswith("role:"):
            role = other.split(":", 1)[1]
            assignments[member.id] = role
            taken.add(role)

    for member in members:
        if member.id in assignments:
            continue
        assignments[member.id] = _fallback_role(member, taken)
        taken.add(assignments[member.id])

    return assignments


def _fallback_role(member: Member, taken: set[str]) -> str:
    """Best unused (or, failing that, any) role this member can actually fill."""
    candidates = list(member.preferred_roles) + [r for r in member.implied_roles if r not in member.preferred_roles]
    for role in candidates:
        if role not in taken and role in ROLES:
            return role
    for role in candidates:
        if role in ROLES:
            return role
    return member.preferred_roles[0] if member.preferred_roles else "backend"


def role_histogram(assignments: dict[str, str]) -> dict[str, int]:
    counts: dict[str, int] = defaultdict(int)
    for role in assignments.values():
        counts[role] += 1
    return dict(counts)
