"""LLM-powered team explanations: generate fluent prose from score decomposition.

Uses OpenAI API when LLM_API_KEY is set; falls back to the existing template explainer.
The LLM may never invent facts absent from the score object.
"""

import json
import logging
from typing import Any

from app.config import settings
from app.engine.types import Score, TeamResult

log = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a team-analysis assistant for a hackathon team-formation tool.
Given a team's score decomposition, write a clear, concise explanation of why this team was formed.

Rules:
- Be specific: reference actual score terms and values
- Highlight strengths (high-scoring terms) with ✓
- Flag concerns (penalties, risk flags) with ⚠
- Use plain language — no jargon, no fluff
- Keep it to 3-5 bullet points
- Never invent facts — only use the provided data
- Be honest about tradeoffs

Format your response as a JSON array of objects with:
- "type": "strength" or "weakness" or "neutral"
- "text": the explanation line"""


def _format_score_for_llm(team: TeamResult) -> str:
    """Format team score data as a structured prompt for the LLM."""
    score = team.score
    data = {
        "team_id": team.id,
        "members": team.member_ids,
        "role_assignments": team.role_assignments,
        "total_score": round(score.total * 100),
        "terms": {k: round(v * 100) for k, v in score.terms.items()},
        "penalties": {k: round(v * 100) for k, v in score.penalties.items()},
        "flags": [{"kind": f.kind, "payload": f.payload} for f in score.flags],
    }
    return json.dumps(data, indent=2)


def _call_openai(team: TeamResult) -> list[dict[str, str]] | None:
    """Call LLM API (OpenRouter or OpenAI-compatible) to explain the team. Returns None on any failure."""
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
                {"role": "user", "content": f"Explain this team's score:\n\n{_format_score_for_llm(team)}"},
            ],
            temperature=0.3,
            max_tokens=500,
        )
        content = response.choices[0].message.content or ""
        # Extract JSON from the response
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        result = json.loads(content.strip())
        if isinstance(result, list):
            return result
        return None
    except Exception as exc:
        log.warning("LLM explanation failed: %s", exc)
        return None


def explain_team(team: TeamResult) -> str:
    """Generate a plain-language explanation of why this team was formed.
    
    Uses LLM when available, falls back to template-based explanation.
    """
    from app.engine.explain import explain_team as template_explain

    # Try LLM first
    llm_result = _call_openai(team)
    if llm_result is not None:
        log.info("Team explanation generated via LLM")
        lines = []
        for item in llm_result:
            if isinstance(item, dict) and "text" in item:
                lines.append(item["text"])
        if lines:
            return " ".join(lines)

    # Fallback to template
    return template_explain(team)


def explain_team_bullets(team: TeamResult) -> list[dict[str, str]]:
    """Generate structured explanation bullets.
    
    Returns list of {"type": "strength"|"weakness"|"neutral", "text": "..."}
    """
    from app.engine.explain import explain as template_explain

    # Try LLM first
    llm_result = _call_openai(team)
    if llm_result is not None:
        log.info("Team explanation bullets generated via LLM")
        valid_types = {"strength", "weakness", "neutral"}
        bullets = []
        for item in llm_result:
            if isinstance(item, dict) and "text" in item:
                item_type = item.get("type", "neutral")
                if item_type not in valid_types:
                    item_type = "neutral"
                bullets.append({"type": item_type, "text": item["text"]})
        if bullets:
            return bullets

    # Fallback to template — decompose the template explanation into bullets
    score = team.score
    bullets = []

    # Strengths from high-scoring terms
    for term, value in sorted(score.terms.items(), key=lambda x: x[1], reverse=True):
        if value >= 0.7:
            label = _TERM_LABEL.get(term, term)
            bullets.append({"type": "strength", "text": f"Strong {label} ({round(value * 100)}%)"})

    # Weaknesses from penalties
    for penalty, value in score.penalties.items():
        if value > 0:
            label = _PENALTY_LABEL.get(penalty, penalty)
            bullets.append({"type": "weakness", "text": f"Penalty: {label} (−{round(value * 100)}%)"})

    # Flags
    for flag in score.flags:
        if flag.kind == "missing_role":
            bullets.append({"type": "weakness", "text": f"Missing required role: {flag.payload.get('role', 'unknown')}"})
        elif flag.kind == "single_point_of_failure":
            bullets.append({"type": "weakness", "text": f"Single point of failure: {flag.payload.get('skill', 'unknown')}"})

    if not bullets:
        bullets.append({"type": "neutral", "text": f"Team score: {round(score.total * 100)}"})

    return bullets


# Labels for human-readable output
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
