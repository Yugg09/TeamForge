"""Contract-shaped participants -> engine `Cohort`.

This is the only place where app-side taxonomy/availability/embedding knowledge is
resolved into the plain data the engine works on, which is what keeps
`engine/types.py` dependency-free.
"""

from app.engine.types import Cohort, Config, Member, SkillRef
from app.services.availability import to_week_intervals
from app.services.embeddings import similarity_matrix
from app.services.taxonomy import CATEGORIES, category_of, roles_for_skill


def build_member(p: dict) -> Member:
    skills = tuple(
        SkillRef(
            id=s["id"],
            proficiency=int(s.get("proficiency", 3)),
            verified=bool(s.get("verified", False)),
            category=category_of(s["id"]),
            roles=frozenset(roles_for_skill(s["id"])),
        )
        for s in p.get("skills", [])
    )
    implied = frozenset(r for s in skills if s.strong for r in s.roles)
    return Member(
        id=p["id"],
        skills=skills,
        preferred_roles=tuple(p.get("preferred_roles", [])),
        implied_roles=implied,
        interests=frozenset(i.lower().strip() for i in p.get("interests", [])),
        intervals=tuple(to_week_intervals(p.get("availability", []))),
        ambition=p.get("ambition", "ship"),
        work_style=p.get("work_style", "planner"),
        sync_pref=p.get("sync_pref", "sync"),
        timezone_offset_min=int(p.get("timezone_offset_min", 0)),
    )


def build_cohort(
    participants: list[dict],
    *,
    min_size: int = 3,
    max_size: int = 5,
    required_roles: tuple[str, ...] = ("frontend", "backend", "ai_ml", "design"),
    similarity: dict | None = None,
) -> Cohort:
    members = tuple(build_member(p) for p in participants)
    if similarity is None:
        similarity = similarity_matrix({
            p["id"]: {"interests": p.get("interests", []), "text": p.get("bio", "")}
            for p in participants
        })
    config = Config(
        required_roles=tuple(required_roles),
        min_size=min_size,
        max_size=max_size,
        n_categories=len(CATEGORIES),
    )
    return Cohort(members=members, config=config, similarity=similarity)
