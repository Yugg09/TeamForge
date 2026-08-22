"""Free-text bio -> structured profile fields.

Deterministic keyword/alias extraction over the canonical taxonomy. No API keys:
this is the "reads as intelligent, costs nothing" layer from the master doc, and an
LLM rewrite can be layered on later without changing the interface.
"""

import re

from app.services.taxonomy import ROLES, SKILLS, roles_for_skill

# Aliases that appear in prose but are not the canonical skill id.
SKILL_ALIASES: dict[str, str] = {
    "react.js": "react", "reactjs": "react", "react": "react",
    "next.js": "nextjs", "nextjs": "nextjs",
    "vue.js": "vue", "vuejs": "vue",
    "ts": "typescript", "typescript": "typescript",
    "js": "node", "node.js": "node", "nodejs": "node",
    "golang": "go",
    "postgresql": "postgres", "psql": "postgres",
    "torch": "pytorch", "pytorch": "pytorch",
    "tf": "tensorflow",
    "natural language processing": "nlp", "llm": "llm_apps", "llms": "llm_apps",
    "large language models": "llm_apps", "rag": "vector_search",
    "embeddings": "vector_search", "vector database": "vector_search",
    "cv": "computer_vision", "computer vision": "computer_vision",
    "ux research": "user_research", "user research": "user_research",
    "ui/ux": "ui_design", "ui design": "ui_design",
    "k8s": "kubernetes",
    "ci/cd": "ci_cd", "devops": "ci_cd",
    "aws": "aws", "amazon web services": "aws",
    "data analysis": "data_analysis", "stats": "statistics",
    "product strategy": "product_strategy", "roadmap": "roadmapping",
    "writing": "technical_writing",
}

ROLE_PHRASES: dict[str, str] = {
    "frontend": "frontend", "front-end": "frontend", "front end": "frontend",
    "backend": "backend", "back-end": "backend", "back end": "backend",
    "full stack": "backend", "fullstack": "backend",
    "machine learning": "ai_ml", "ml engineer": "ai_ml", "ai engineer": "ai_ml",
    "data scientist": "ai_ml",
    "designer": "design", "design": "design",
    "product manager": "product", "product": "product",
    "researcher": "research", "research": "research",
    "devops": "devops", "sre": "devops", "infrastructure": "devops",
}

AMBITION_PHRASES = {
    "win": ["win", "winning", "competitive", "first place", "trophy", "prize"],
    "learn": ["learn", "learning", "first hackathon", "beginner", "new to", "curious"],
    "ship": ["ship", "shipping", "build something", "prototype", "launch"],
}

STYLE_PHRASES = {
    "planner": ["plan", "planner", "structured", "organised", "organized", "methodical"],
    "improviser": ["improvis", "wing it", "spontaneous", "explore as we go", "scrappy"],
}

SYNC_PHRASES = {
    "async": ["async", "asynchronous", "on my own hours", "different timezone"],
    "sync": ["sync", "pair", "call", "together", "in person", "same room"],
}

INTEREST_HINTS = [
    "climate", "healthcare", "fintech", "education", "accessibility", "gaming",
    "robotics", "security", "search", "developer tools", "social impact",
    "creative tools", "sustainability", "music", "sports", "agriculture",
]


def _found(text: str, phrase: str) -> bool:
    return re.search(rf"(?<!\w){re.escape(phrase)}(?!\w)", text) is not None


def extract_skills(bio: str) -> list[str]:
    """Canonical skill ids mentioned in the bio, longest alias first."""
    text = bio.lower()
    hits: list[str] = []
    candidates = sorted(
        set(list(SKILL_ALIASES) + list(SKILLS)), key=len, reverse=True
    )
    for phrase in candidates:
        canonical = SKILL_ALIASES.get(phrase, phrase)
        if canonical in hits:
            continue
        probe = phrase.replace("_", " ")
        if _found(text, phrase) or _found(text, probe):
            hits.append(canonical)
    return hits


def extract_roles(bio: str) -> list[str]:
    text = bio.lower()
    out: list[str] = []
    for phrase, role in ROLE_PHRASES.items():
        if role not in out and _found(text, phrase):
            out.append(role)
    return [r for r in out if r in ROLES]


def extract_interests(bio: str) -> list[str]:
    text = bio.lower()
    return [hint for hint in INTEREST_HINTS if hint in text]


def _pick(text: str, table: dict[str, list[str]], default: str) -> str:
    for value, phrases in table.items():
        if any(p in text for p in phrases):
            return value
    return default


def parse_bio(bio: str) -> dict:
    """Structured fields inferred from free text. Empty bio -> empty inference."""
    if not bio.strip():
        return {"skills": [], "preferred_roles": [], "interests": []}
    text = bio.lower()
    skills = extract_skills(bio)
    roles = extract_roles(bio)
    # Skills imply roles too, so a bio naming only tools still yields roles.
    for sid in skills:
        for role in roles_for_skill(sid):
            if role not in roles:
                roles.append(role)
    return {
        "skills": skills,
        "preferred_roles": roles,
        "interests": extract_interests(bio),
        "ambition": _pick(text, AMBITION_PHRASES, "ship"),
        "work_style": _pick(text, STYLE_PHRASES, "planner"),
        "sync_pref": _pick(text, SYNC_PHRASES, "sync"),
    }


def enrich(payload: dict) -> dict:
    """Fill blank structured fields from the bio, never overwriting explicit input."""
    parsed = parse_bio(payload.get("bio", ""))
    out = dict(payload)
    if not out.get("skills"):
        out["skills"] = [{"id": sid, "proficiency": 3, "verified": False} for sid in parsed["skills"]]
    if not out.get("preferred_roles"):
        out["preferred_roles"] = parsed["preferred_roles"][:3]
    if not out.get("interests"):
        out["interests"] = parsed["interests"]
    for field in ("ambition", "work_style", "sync_pref"):
        if field in parsed and field not in payload:
            out[field] = parsed[field]
    return out
