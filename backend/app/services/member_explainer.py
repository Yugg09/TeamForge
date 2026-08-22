"""Explain why a specific member is placed on a specific team.

Analyzes the member's contribution to the team's score and explains
the reasoning behind the placement.
"""

import logging
from typing import Any

from app.config import settings
from app.engine.types import Cohort, Member, Score, TeamResult

log = logging.getLogger(__name__)


def explain_member_placement(
    member_id: str,
    team: TeamResult,
    cohort: Cohort,
) -> dict[str, Any]:
    """Explain why this member is on this team.
    
    Returns a structured explanation with:
    - role_match: how well their skills match their assigned role
    - contribution: their contribution to each scoring term
    - tradeoffs: what the team gains/loses by having them
    - alternatives: who else could fill this role (and why they're worse)
    """
    member = cohort.by_id(member_id)
    team_members = [cohort.by_id(mid) for mid in team.member_ids if mid != member_id]
    
    explanation = {
        "member_id": member_id,
        "team_id": team.id,
        "assigned_role": team.role_assignments.get(member_id, "unknown"),
        "reasons": [],
        "strengths": [],
        "tradeoffs": [],
        "fit_score": 0.0,
    }
    
    # 1. Role match analysis
    role = team.role_assignments.get(member_id, "")
    role_match = _analyze_role_match(member, role)
    explanation["reasons"].extend(role_match["reasons"])
    explanation["fit_score"] += role_match["fit_score"]
    
    # 2. Skill contribution
    skill_contribution = _analyze_skill_contribution(member, team_members, cohort)
    explanation["strengths"].extend(skill_contribution["strengths"])
    explanation["fit_score"] += skill_contribution["fit_score"]
    
    # 3. Availability compatibility
    avail_score = _analyze_availability(member, team_members)
    explanation["reasons"].extend(avail_score["reasons"])
    explanation["fit_score"] += avail_score["fit_score"]
    
    # 4. Interest alignment
    interest_score = _analyze_interests(member, team_members, cohort)
    explanation["strengths"].extend(interest_score["strengths"])
    explanation["fit_score"] += interest_score["fit_score"]
    
    # 5. Goal alignment
    goal_score = _analyze_goals(member, team_members)
    explanation["reasons"].extend(goal_score["reasons"])
    explanation["fit_score"] += goal_score["fit_score"]
    
    # 6. Tradeoffs (what the team loses if this person leaves)
    tradeoffs = _analyze_tradeoffs(member, team, cohort)
    explanation["tradeoffs"] = tradeoffs
    
    # Normalize fit score to 0-100
    explanation["fit_score"] = min(100, max(0, round(explanation["fit_score"])))
    
    return explanation


def _analyze_role_match(member: Member, role: str) -> dict[str, Any]:
    """Analyze how well the member's skills match their assigned role."""
    reasons = []
    fit_score = 0.0
    
    if role in member.preferred_roles:
        reasons.append(f"Preferred role: {role} (ranked #{member.preferred_roles.index(role) + 1})")
        fit_score += 30
    elif role in member.implied_roles:
        reasons.append(f"Implied role from skills: {role}")
        fit_score += 20
    else:
        reasons.append(f"Assigned to {role} as best available match")
        fit_score += 10
    
    # Check proficiency for the role
    proficiency = member.proficiency_for(role)
    if proficiency >= 4:
        reasons.append(f"High proficiency ({proficiency}/5) in role-relevant skills")
        fit_score += 20
    elif proficiency >= 3:
        reasons.append(f"Solid proficiency ({proficiency}/5) in role-relevant skills")
        fit_score += 15
    else:
        reasons.append(f"Developing proficiency ({proficiency}/5) — learning opportunity")
        fit_score += 5
    
    return {"reasons": reasons, "fit_score": fit_score}


def _analyze_skill_contribution(
    member: Member,
    team_members: list[Member],
    cohort: Cohort,
) -> dict[str, Any]:
    """Analyze what unique skills this member brings to the team."""
    strengths = []
    fit_score = 0.0
    
    # Find skills that only this member has (unique contribution)
    team_skills = set()
    for m in team_members:
        for s in m.skills:
            if s.strong:
                team_skills.add(s.id)
    
    unique_skills = []
    for s in member.skills:
        if s.strong and s.id not in team_skills:
            unique_skills.append(s.id)
    
    if unique_skills:
        strengths.append(f"Unique strong skills: {', '.join(unique_skills[:3])}")
        fit_score += 25
    
    # Check if they fill a skill gap
    member_skill_cats = {s.category for s in member.skills if s.strong}
    team_skill_cats = set()
    for m in team_members:
        for s in m.skills:
            if s.strong:
                team_skill_cats.add(s.category)
    
    new_cats = member_skill_cats - team_skill_cats
    if new_cats:
        strengths.append(f"Adds new skill category: {', '.join(new_cats)}")
        fit_score += 15
    
    return {"strengths": strengths, "fit_score": fit_score}


def _analyze_availability(member: Member, team_members: list[Member]) -> dict[str, Any]:
    """Analyze availability overlap with the team."""
    from app.services.availability import intersect_all, total_minutes
    
    reasons = []
    fit_score = 0.0
    
    all_members = [member] + team_members
    overlap = total_minutes(intersect_all([list(m.intervals) for m in all_members]))
    
    if overlap >= 600:
        reasons.append(f"Excellent availability overlap ({overlap} min/week)")
        fit_score += 20
    elif overlap >= 300:
        reasons.append(f"Good availability overlap ({overlap} min/week)")
        fit_score += 15
    elif overlap >= 120:
        reasons.append(f"Adequate availability overlap ({overlap} min/week)")
        fit_score += 10
    else:
        reasons.append(f"Tight availability ({overlap} min/week) — scheduling needed")
        fit_score += 5
    
    return {"reasons": reasons, "fit_score": fit_score}


def _analyze_interests(
    member: Member,
    team_members: list[Member],
    cohort: Cohort,
) -> dict[str, Any]:
    """Analyze interest alignment with the team."""
    strengths = []
    fit_score = 0.0
    
    # Shared interests
    member_interests = member.interests
    team_interests = set()
    for m in team_members:
        team_interests.update(m.interests)
    
    shared = member_interests & team_interests
    if shared:
        strengths.append(f"Shared interests: {', '.join(list(shared)[:3])}")
        fit_score += 15
    
    # Pairwise similarity
    similarities = []
    for m in team_members:
        sim = cohort.sim(member.id, m.id)
        if sim > 0:
            similarities.append(sim)
    
    if similarities:
        avg_sim = sum(similarities) / len(similarities)
        if avg_sim > 0.3:
            strengths.append(f"High interest similarity with team ({avg_sim:.0%})")
            fit_score += 10
        elif avg_sim > 0.1:
            strengths.append(f"Moderate interest overlap with team ({avg_sim:.0%})")
            fit_score += 5
    
    return {"strengths": strengths, "fit_score": fit_score}


def _analyze_goals(member: Member, team_members: list[Member]) -> dict[str, Any]:
    """Analyze goal alignment with the team."""
    reasons = []
    fit_score = 0.0
    
    ambitions = [m.ambition for m in team_members] + [member.ambition]
    ambition_counts = {}
    for a in ambitions:
        ambition_counts[a] = ambition_counts.get(a, 0) + 1
    
    majority = max(ambition_counts.items(), key=lambda x: x[1])
    if member.ambition == majority[0]:
        reasons.append(f"Aligned ambition: {member.ambition} (matches team majority)")
        fit_score += 15
    else:
        reasons.append(f"Different ambition: {member.ambition} (team majority: {majority[0]})")
        fit_score += 5
    
    return {"reasons": reasons, "fit_score": fit_score}


def _analyze_tradeoffs(
    member: Member,
    team: TeamResult,
    cohort: Cohort,
) -> list[str]:
    """Analyze what the team gains/loses by having this member."""
    tradeoffs = []
    
    # Check if they're a single point of failure
    role = team.role_assignments.get(member.id, "")
    if role:
        holders = [
            mid for mid, r in team.role_assignments.items()
            if r == role and mid != member.id
        ]
        if not holders:
            tradeoffs.append(f"Sole holder of {role} role — team depends on them")
    
    # Check redundancy
    team_members = [cohort.by_id(mid) for mid in team.member_ids if mid != member.id]
    redundant_skills = []
    for s in member.skills:
        if s.strong:
            for m in team_members:
                for ms in m.skills:
                    if ms.id == s.id and ms.strong:
                        redundant_skills.append(s.id)
                        break
    
    if redundant_skills:
        tradeoffs.append(f"Overlapping skills with teammates: {', '.join(set(redundant_skills)[:3])}")
    
    return tradeoffs


def explain_member_placement_llm(
    member_id: str,
    team: TeamResult,
    cohort: Cohort,
) -> dict[str, Any]:
    """LLM-powered explanation (optional enhancement)."""
    # For now, use the deterministic explanation
    # LLM can be added later for more natural language
    return explain_member_placement(member_id, team, cohort)
