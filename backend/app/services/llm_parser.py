"""LLM-powered bio parsing: extract structured skills, roles, and interests from free text.

Uses OpenAI API when LLM_API_KEY is set; falls back to the existing regex parser.
The LLM may never invent facts absent from the bio — it extracts, not generates.
"""

import json
import logging
from typing import Any

from app.config import settings
from app.services.bio_parse import enrich as regex_enrich, parse_bio as regex_parse_bio

log = logging.getLogger(__name__)

# Canonical skill IDs the LLM should output (from taxonomy.py)
CANONICAL_SKILLS = [
    "react", "vue", "typescript", "css", "nextjs", "flutter", "swift",
    "python", "node", "go", "java", "rust", "postgres", "redis", "graphql", "rest_api",
    "pytorch", "tensorflow", "nlp", "computer_vision", "llm_apps", "vector_search",
    "data_analysis", "statistics",
    "figma", "ui_design", "motion_design", "user_research", "prototyping",
    "product_strategy", "roadmapping", "pitching", "technical_writing",
    "literature_review", "experiment_design",
    "docker", "kubernetes", "aws", "ci_cd", "terraform",
]

SYSTEM_PROMPT = f"""You are a profile parser for a hackathon team-formation tool.
Given a free-text bio, extract structured fields. Output ONLY valid JSON with these keys:

- "skills": array of objects with "id" (one of: {json.dumps(CANONICAL_SKILLS)}), "proficiency" (1-5 integer), "verified" (false)
- "preferred_roles": array of role strings from: ["frontend", "backend", "ai_ml", "design", "product", "research", "devops"]
- "interests": array of short interest tags (lowercase, max 3)
- "ambition": one of "win", "ship", "learn"
- "work_style": one of "planner", "improviser"
- "sync_pref": one of "sync", "async"

Rules:
- Only extract skills that are clearly mentioned or strongly implied by the bio
- If a skill is mentioned but you're unsure of the canonical ID, skip it
- Proficiency should reflect confidence from the bio (mentioning = 3, experienced = 4, expert = 5)
- Infer ambition from tone: competitive = win, building/shipping = ship, learning/curious = learn
- Infer work_style from language: structured/methodical = planner, spontaneous/winging it = improviser
- Infer sync_pref from timezone mentions or collaboration language
- Return empty arrays for fields that cannot be inferred
- Do NOT add skills or roles not supported by the text"""


def _call_openai(bio: str) -> dict[str, Any] | None:
    """Call LLM API (OpenRouter or OpenAI-compatible) to parse the bio. Returns None on any failure."""
    api_key = getattr(settings, "llm_api_key", None)
    if not api_key:
        return None

    try:
        import openai
        base_url = getattr(settings, "llm_base_url", "https://openrouter.ai/api/v1")
        client = openai.OpenAI(api_key=api_key, base_url=base_url)
        model = getattr(settings, "llm_model", "meta-llama/llama-3.1-8b-instruct:free")
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Parse this hackathon participant bio:\n\n{bio}"},
            ],
            temperature=0.1,
            max_tokens=500,
        )
        content = response.choices[0].message.content or ""
        # Extract JSON from the response (handle markdown code blocks)
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        return json.loads(content.strip())
    except Exception as exc:
        log.warning("LLM bio parsing failed: %s", exc)
        return None


def parse_bio(bio: str) -> dict[str, Any]:
    """Parse a free-text bio into structured fields.
    
    Uses LLM when available, falls back to regex-based extraction.
    """
    if not bio.strip():
        return {"skills": [], "preferred_roles": [], "interests": []}

    # Try LLM first
    llm_result = _call_openai(bio)
    if llm_result is not None:
        log.info("Bio parsed via LLM")
        # Validate and clean the LLM output
        return _validate_llm_output(llm_result)

    # Fallback to regex
    log.info("Bio parsed via regex fallback")
    return regex_parse_bio(bio)


def enrich(payload: dict[str, Any]) -> dict[str, Any]:
    """Fill blank structured fields from the bio, never overwriting explicit input.
    
    Uses LLM when available, falls back to regex-based extraction.
    """
    if not payload.get("bio", "").strip():
        return payload

    # Try LLM first
    llm_result = _call_openai(payload["bio"])
    if llm_result is not None:
        parsed = _validate_llm_output(llm_result)
        log.info("Bio enriched via LLM")
    else:
        parsed = regex_parse_bio(payload["bio"])
        log.info("Bio enriched via regex fallback")

    out = dict(payload)
    if not out.get("skills"):
        out["skills"] = [
            {"id": sid, "proficiency": s.get("proficiency", 3), "verified": False}
            for sid, s in zip(
                [s["id"] for s in parsed.get("skills", []) if isinstance(s, dict)],
                parsed.get("skills", []),
            )
            if isinstance(s, dict) and "id" in s
        ]
    if not out.get("preferred_roles"):
        out["preferred_roles"] = parsed.get("preferred_roles", [])[:3]
    if not out.get("interests"):
        out["interests"] = parsed.get("interests", [])
    for field in ("ambition", "work_style", "sync_pref"):
        if field in parsed and field not in out:
            out[field] = parsed[field]
    return out


def _validate_llm_output(data: dict[str, Any]) -> dict[str, Any]:
    """Validate and clean LLM output to match expected schema."""
    valid_roles = {"frontend", "backend", "ai_ml", "design", "product", "research", "devops"}
    valid_ambitions = {"win", "ship", "learn"}
    valid_styles = {"planner", "improviser"}
    valid_sync = {"sync", "async"}

    result: dict[str, Any] = {}

    # Skills
    skills = data.get("skills", [])
    if isinstance(skills, list):
        cleaned = []
        for s in skills:
            if isinstance(s, dict) and "id" in s:
                sid = s["id"]
                if sid in CANONICAL_SKILLS:
                    prof = s.get("proficiency", 3)
                    if not isinstance(prof, int) or prof < 1 or prof > 5:
                        prof = 3
                    cleaned.append({"id": sid, "proficiency": prof, "verified": False})
        result["skills"] = cleaned
    else:
        result["skills"] = []

    # Preferred roles
    roles = data.get("preferred_roles", [])
    if isinstance(roles, list):
        result["preferred_roles"] = [r for r in roles if r in valid_roles]
    else:
        result["preferred_roles"] = []

    # Interests
    interests = data.get("interests", [])
    if isinstance(interests, list):
        result["interests"] = [str(i).lower().strip() for i in interests[:5] if i]
    else:
        result["interests"] = []

    # Ambition
    ambition = data.get("ambition", "ship")
    result["ambition"] = ambition if ambition in valid_ambitions else "ship"

    # Work style
    style = data.get("work_style", "planner")
    result["work_style"] = style if style in valid_styles else "planner"

    # Sync pref
    sync = data.get("sync_pref", "sync")
    result["sync_pref"] = sync if sync in valid_sync else "sync"

    return result
