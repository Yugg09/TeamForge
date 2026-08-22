"""Canonical skill taxonomy: skill id -> category, and skill -> implied roles.

Pure data + pure functions. The engine depends on this indirectly through
preprocessing, so it holds no framework imports.
"""

ROLES = ["frontend", "backend", "ai_ml", "design", "product", "research", "devops"]

# skill id -> (category, roles the skill implies)
SKILLS: dict[str, tuple[str, tuple[str, ...]]] = {
    # frontend
    "react": ("web_ui", ("frontend",)),
    "vue": ("web_ui", ("frontend",)),
    "typescript": ("web_ui", ("frontend",)),
    "css": ("web_ui", ("frontend", "design")),
    "nextjs": ("web_ui", ("frontend",)),
    "flutter": ("mobile", ("frontend",)),
    "swift": ("mobile", ("frontend",)),
    # backend
    "python": ("server", ("backend", "ai_ml")),
    "node": ("server", ("backend",)),
    "go": ("server", ("backend", "devops")),
    "java": ("server", ("backend",)),
    "rust": ("server", ("backend",)),
    "postgres": ("data_store", ("backend",)),
    "redis": ("data_store", ("backend",)),
    "graphql": ("api", ("backend", "frontend")),
    "rest_api": ("api", ("backend",)),
    # ai / ml
    "pytorch": ("ml", ("ai_ml",)),
    "tensorflow": ("ml", ("ai_ml",)),
    "nlp": ("ml", ("ai_ml", "research")),
    "computer_vision": ("ml", ("ai_ml", "research")),
    "llm_apps": ("ml", ("ai_ml",)),
    "vector_search": ("ml", ("ai_ml", "backend")),
    "data_analysis": ("data_science", ("ai_ml", "research")),
    "statistics": ("data_science", ("research", "ai_ml")),
    # design
    "figma": ("design_craft", ("design",)),
    "ui_design": ("design_craft", ("design",)),
    "motion_design": ("design_craft", ("design",)),
    "user_research": ("discovery", ("design", "product", "research")),
    "prototyping": ("design_craft", ("design", "product")),
    # product
    "product_strategy": ("discovery", ("product",)),
    "roadmapping": ("discovery", ("product",)),
    "pitching": ("comms", ("product",)),
    "technical_writing": ("comms", ("product", "research")),
    # research
    "literature_review": ("discovery", ("research",)),
    "experiment_design": ("discovery", ("research",)),
    # devops
    "docker": ("infra", ("devops", "backend")),
    "kubernetes": ("infra", ("devops",)),
    "aws": ("infra", ("devops", "backend")),
    "ci_cd": ("infra", ("devops",)),
    "terraform": ("infra", ("devops",)),
}

CATEGORIES = sorted({cat for cat, _ in SKILLS.values()})


def category_of(skill_id: str) -> str:
    """Category for a skill id; unknown skills get their own bucket."""
    entry = SKILLS.get(skill_id)
    return entry[0] if entry else "other"


def roles_for_skill(skill_id: str) -> tuple[str, ...]:
    entry = SKILLS.get(skill_id)
    return entry[1] if entry else ()


def implied_roles(skill_ids: list[str]) -> set[str]:
    """Union of roles implied by a set of skills."""
    out: set[str] = set()
    for sid in skill_ids:
        out.update(roles_for_skill(sid))
    return out


def skills_for_role(role: str) -> list[str]:
    return [sid for sid, (_, roles) in SKILLS.items() if role in roles]
