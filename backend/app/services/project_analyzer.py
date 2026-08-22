"""LLM-powered project analysis: extract structured requirements from a project brief.

Uses OpenRouter when LLM_API_KEY is set; falls back to keyword extraction.
"""

import json
import logging
import re
from typing import Any

from app.config import settings
from app.services.taxonomy import SKILLS, ROLES

log = logging.getLogger(__name__)

# Canonical skill IDs the LLM should output
CANONICAL_SKILLS = list(SKILLS.keys())

SYSTEM_PROMPT = f"""You are a project analyst for a hackathon team-formation tool.
Given a project description, extract structured requirements. Output ONLY valid JSON with these keys:

- "domain": string — the project category or problem space (e.g., "education", "healthcare", "developer tools")
- "required_skills": array of skill IDs from: {json.dumps(CANONICAL_SKILLS)}
- "roles": array of role strings from: {json.dumps(ROLES)}
- "description": string — a 1-2 sentence summary of what the project needs

Rules:
- Only extract skills that are clearly needed for the project
- Include roles based on what the project demands (e.g., a React frontend needs "frontend")
- The domain should be a simple category, not a full sentence
- Be specific about skills: if they mention "chat", use "rest_api" or "graphql", not just "backend"
- If the project mentions AI/ML, include "ai_ml" role and relevant skills like "pytorch", "llm_apps", etc.
- If the project mentions design/UX, include "design" role and "figma", "ui_design", etc.
- Return empty arrays for fields that cannot be determined"""


def _call_llm(description: str) -> dict[str, Any] | None:
    """Call LLM to analyze the project. Returns None on any failure."""
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
                {"role": "user", "content": f"Analyze this hackathon project:\n\n{description}"},
            ],
            temperature=0.1,
            max_tokens=500,
        )
        content = response.choices[0].message.content or ""
        # Extract JSON from the response
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        return json.loads(content.strip())
    except Exception as exc:
        log.warning("LLM project analysis failed: %s", exc)
        return None


def _keyword_extract(description: str) -> dict[str, Any]:
    """Fallback keyword extraction when LLM is unavailable."""
    text = description.lower()

    # Extract domain from common patterns
    domain = "general"
    domain_patterns = {
        "education": ["education", "learning", "school", "university", "student", "teach"],
        "healthcare": ["health", "medical", "patient", "hospital", "doctor"],
        "fintech": ["finance", "payment", "banking", "money", "crypto"],
        "developer tools": ["developer", "coding", "programming", "ide", "api"],
        "gaming": ["game", "gaming", "play"],
        "social impact": ["social", "community", "nonprofit", "charity"],
        "climate": ["climate", "environment", "sustainability", "green"],
        "accessibility": ["accessibility", "a11y", "disability", "inclusive"],
    }
    for domain_name, keywords in domain_patterns.items():
        if any(kw in text for kw in keywords):
            domain = domain_name
            break

    # Extract skills from mentions
    found_skills = []
    skill_aliases = {
        "react": ["react", "reactjs", "react.js"],
        "vue": ["vue", "vuejs", "vue.js"],
        "python": ["python", "flask", "django", "fastapi"],
        "node": ["node", "nodejs", "node.js", "express"],
        "pytorch": ["pytorch", "torch"],
        "tensorflow": ["tensorflow", "tf"],
        "nlp": ["nlp", "natural language", "text processing"],
        "llm_apps": ["llm", "gpt", "language model", "chatbot", "chat"],
        "figma": ["figma", "design tool"],
        "ui_design": ["ui", "ux", "interface", "design"],
        "docker": ["docker", "container"],
        "kubernetes": ["kubernetes", "k8s"],
        "aws": ["aws", "amazon", "cloud"],
        "react": ["react", "frontend"],
        "rest_api": ["api", "rest", "endpoint"],
        "graphql": ["graphql", "gql"],
        "postgres": ["postgres", "postgresql", "sql", "database"],
        "redis": ["redis", "cache"],
    }
    for skill_id, aliases in skill_aliases.items():
        if skill_id in CANONICAL_SKILLS and any(alias in text for alias in aliases):
            if skill_id not in found_skills:
                found_skills.append(skill_id)

    # Extract roles
    found_roles = []
    role_patterns = {
        "frontend": ["frontend", "front-end", "ui", "react", "vue", "angular"],
        "backend": ["backend", "back-end", "api", "server", "database"],
        "ai_ml": ["ai", "ml", "machine learning", "deep learning", "data science", "nlp"],
        "design": ["design", "figma", "ux", "ui design", "prototype"],
        "product": ["product", "pm", "roadmap", "strategy"],
        "devops": ["devops", "infrastructure", "deploy", "ci/cd", "cloud"],
        "research": ["research", "literature", "experiment"],
    }
    for role, keywords in role_patterns.items():
        if any(kw in text for kw in keywords):
            if role not in found_roles:
                found_roles.append(role)

    # If no roles found, add defaults
    if not found_roles:
        found_roles = ["frontend", "backend"]

    return {
        "domain": domain,
        "required_skills": found_skills[:10],  # Cap at 10
        "roles": found_roles,
        "description": f"Project analysis for: {description[:100]}",
    }


def _validate_output(data: dict[str, Any]) -> dict[str, Any]:
    """Validate and clean LLM output."""
    valid_roles = set(ROLES)
    valid_skills = set(CANONICAL_SKILLS)

    result = {
        "domain": str(data.get("domain", "general"))[:100],
        "required_skills": [
            s for s in (data.get("required_skills") or [])
            if s in valid_skills
        ][:10],
        "roles": [
            r for r in (data.get("roles") or [])
            if r in valid_roles
        ],
        "description": str(data.get("description", ""))[:500],
    }

    if not result["roles"]:
        result["roles"] = ["frontend", "backend"]

    return result


def analyze_project(description: str) -> dict[str, Any]:
    """Analyze a project description and extract structured requirements.
    
    Uses LLM when available, falls back to keyword extraction.
    """
    if not description.strip():
        return {
            "domain": "general",
            "required_skills": [],
            "roles": ["frontend", "backend"],
            "description": "",
        }

    # Try LLM first
    llm_result = _call_llm(description)
    if llm_result is not None:
        log.info("Project analyzed via LLM")
        return _validate_output(llm_result)

    # Fallback to keyword extraction
    log.info("Project analyzed via keyword fallback")
    return _keyword_extract(description)
