"""Small helpers for building engine fixtures without a server or a database."""

from app.engine.preprocess import build_cohort

WEEKEND = [{"day": 5, "start_utc": 540, "end_utc": 1020}]          # 8h shared
NIGHT = [{"day": 5, "start_utc": 0, "end_utc": 300}]               # disjoint from WEEKEND
SLIVER = [{"day": 5, "start_utc": 1000, "end_utc": 1060}]          # 20 min into WEEKEND


def participant(
    pid: str,
    role: str = "backend",
    skills: list[str] | None = None,
    interests: list[str] | None = None,
    availability: list[dict] | None = None,
    ambition: str = "ship",
    work_style: str = "planner",
    sync_pref: str = "sync",
    proficiency: int = 5,
) -> dict:
    return {
        "id": pid,
        "name": pid,
        "bio": "",
        "timezone_offset_min": 0,
        "skills": [{"id": s, "proficiency": proficiency} for s in (skills or ["python"])],
        "preferred_roles": [role],
        "interests": interests or [],
        "availability": availability if availability is not None else WEEKEND,
        "ambition": ambition,
        "work_style": work_style,
        "sync_pref": sync_pref,
    }


def cohort_of(participants: list[dict], **kwargs):
    return build_cohort(participants, **kwargs)


ROLE_KITS = {
    "ai_ml": ["pytorch", "nlp", "llm_apps"],
    "backend": ["node", "postgres", "rest_api"],
    "frontend": ["react", "typescript", "nextjs"],
    "design": ["figma", "ui_design", "motion_design"],
    "product": ["product_strategy", "roadmapping", "pitching"],
    "devops": ["docker", "kubernetes", "ci_cd"],
}


def balanced_five(prefix: str = "b", availability: list[dict] | None = None) -> list[dict]:
    roles = ["ai_ml", "backend", "frontend", "design", "product"]
    return [
        participant(f"{prefix}{i}", role, ROLE_KITS[role], ["search"], availability)
        for i, role in enumerate(roles)
    ]


def identical_five(prefix: str = "s", role: str = "ai_ml",
                   availability: list[dict] | None = None) -> list[dict]:
    return [
        participant(f"{prefix}{i}", role, ROLE_KITS[role], ["search"], availability)
        for i in range(5)
    ]
