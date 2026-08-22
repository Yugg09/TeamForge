"""Team recommendation engine with match explanations.

Analyzes why each member fits their team and provides recommendations
for improving team composition.
"""

import logging
from typing import Any

from app.config import settings
from app.engine.types import Cohort, Member, Score, TeamResult

log = logging.getLogger(__name__)


def explain_team_match(
    team: TeamResult,
    cohort: Cohort,
) -> dict[str, Any]:
    """Generate comprehensive team recommendations with match explanations.
    
    Returns:
    - team_summary: overall team analysis
    - member_matches: detailed match for each member
    - recommendations: suggestions for improvement
    - compatibility_matrix: pairwise compatibility scores
    """
    team_members = [cohort.by_id(mid) for mid in team.member_ids]
    
    # Build member matches
    member_matches = []
    for member in team_members:
        match = _analyze_member_match(member, team, team_members, cohort)
        member_matches.append(match)
    
    # Build compatibility matrix
    compatibility_matrix = _build_compatibility_matrix(team_members, cohort)
    
    # Generate recommendations
    recommendations = _generate_recommendations(team, team_members, cohort)
    
    # Team summary
    team_summary = _build_team_summary(team, team_members, member_matches, cohort)
    
    return {
        "team_id": team.id,
        "team_summary": team_summary,
        "member_matches": member_matches,
        "recommendations": recommendations,
        "compatibility_matrix": compatibility_matrix,
    }


def _analyze_member_match(
    member: Member,
    team: TeamResult,
    team_members: list[Member],
    cohort: Cohort,
) -> dict[str, Any]:
    """Analyze why a member fits their team."""
    other_members = [m for m in team_members if m.id != member.id]
    role = team.role_assignments.get(member.id, "")
    
    # Calculate match dimensions
    skill_match = _calc_skill_match(member, other_members, cohort)
    interest_match = _calc_interest_match(member, other_members, cohort)
    availability_match = _calc_availability_match(member, other_members)
    goal_match = _calc_goal_match(member, other_members)
    style_match = _calc_style_match(member, other_members)
    
    # Overall fit score
    fit_score = (
        skill_match["score"] * 0.30 +
        interest_match["score"] * 0.20 +
        availability_match["score"] * 0.20 +
        goal_match["score"] * 0.15 +
        style_match["score"] * 0.15
    )
    
    # Generate match explanation
    explanation = _generate_match_explanation(
        member, role, skill_match, interest_match, 
        availability_match, goal_match, style_match
    )
    
    return {
        "member_id": member.id,
        "assigned_role": role,
        "fit_score": round(fit_score * 100),
        "dimensions": {
            "skill": skill_match,
            "interest": interest_match,
            "availability": availability_match,
            "goal": goal_match,
            "style": style_match,
        },
        "explanation": explanation,
        "strengths": _find_strengths(member, other_members, team, cohort),
        "considerations": _find_considerations(member, other_members, team, cohort),
    }


def _calc_skill_match(member: Member, others: list[Member], cohort: Cohort) -> dict[str, Any]:
    """Calculate skill complementarity score."""
    if not others:
        return {"score": 0.5, "detail": "Solo member"}
    
    member_skills = {s.id for s in member.skills if s.strong}
    other_skills = {s.id for m in others for s in m.skills if s.strong}
    
    # Unique skills this member brings
    unique = member_skills - other_skills
    # Shared skills (potential redundancy)
    shared = member_skills & other_skills
    
    # Complementary score: unique skills are good, too much shared is bad
    total = len(member_skills) + len(other_skills)
    if total == 0:
        score = 0.5
    else:
        unique_ratio = len(unique) / max(len(member_skills), 1)
        shared_penalty = len(shared) / max(len(member_skills), 1) * 0.3
        score = min(1.0, unique_ratio * 0.8 + 0.2 - shared_penalty)
    
    return {
        "score": round(score, 3),
        "unique_skills": list(unique)[:5],
        "shared_skills": list(shared)[:5],
        "detail": f"{len(unique)} unique, {len(shared)} shared skills",
    }


def _calc_interest_match(member: Member, others: list[Member], cohort: Cohort) -> dict[str, Any]:
    """Calculate interest alignment score."""
    if not others:
        return {"score": 0.5, "detail": "No teammates to compare"}
    
    member_interests = member.interests
    
    # Pairwise similarity
    similarities = []
    for m in others:
        sim = cohort.sim(member.id, m.id)
        similarities.append(sim)
    
    avg_sim = sum(similarities) / len(similarities) if similarities else 0
    
    # Shared interests
    other_interests = set()
    for m in others:
        other_interests.update(m.interests)
    shared = member_interests & other_interests
    
    return {
        "score": round(min(1.0, avg_sim * 2), 3),
        "shared_interests": list(shared)[:5],
        "avg_similarity": round(avg_sim, 3),
        "detail": f"{len(shared)} shared interests, {avg_sim:.0%} similarity",
    }


def _calc_availability_match(member: Member, others: list[Member]) -> dict[str, Any]:
    """Calculate availability overlap score."""
    from app.services.availability import intersect_all, total_minutes
    
    all_members = [member] + others
    overlap = total_minutes(intersect_all([list(m.intervals) for m in all_members]))
    
    # Score: 600+ min = 1.0, 120 min = 0.5, <120 = 0
    if overlap >= 600:
        score = 1.0
    elif overlap >= 300:
        score = 0.8
    elif overlap >= 120:
        score = 0.5
    else:
        score = 0.0
    
    hours = overlap / 60
    
    return {
        "score": round(score, 3),
        "overlap_minutes": overlap,
        "detail": f"{hours:.0f}h/week shared availability",
    }


def _calc_goal_match(member: Member, others: list[Member]) -> dict[str, Any]:
    """Calculate goal alignment score."""
    if not others:
        return {"score": 0.5, "detail": "No teammates to compare"}
    
    ambitions = [m.ambition for m in others] + [member.ambition]
    counts = {}
    for a in ambitions:
        counts[a] = counts.get(a, 0) + 1
    
    majority = max(counts.items(), key=lambda x: x[1])
    is_aligned = member.ambition == majority[0]
    
    score = 0.8 if is_aligned else 0.4
    
    return {
        "score": round(score, 3),
        "member_ambition": member.ambition,
        "team_majority": majority[0],
        "aligned": is_aligned,
        "detail": f"{'Aligned' if is_aligned else 'Different'} ambition ({member.ambition})",
    }


def _calc_style_match(member: Member, others: list[Member]) -> dict[str, Any]:
    """Calculate work style compatibility score."""
    if not others:
        return {"score": 0.5, "detail": "No teammates to compare"}
    
    styles = [m.work_style for m in others] + [member.work_style]
    sync_prefs = [m.sync_pref for m in others] + [member.sync_pref]
    
    style_counts = {}
    for s in styles:
        style_counts[s] = style_counts.get(s, 0) + 1
    sync_counts = {}
    for s in sync_prefs:
        sync_counts[s] = sync_counts.get(s, 0) + 1
    
    style_majority = max(style_counts.items(), key=lambda x: x[1])
    sync_majority = max(sync_counts.items(), key=lambda x: x[1])
    
    style_aligned = member.work_style == style_majority[0]
    sync_aligned = member.sync_pref == sync_majority[0]
    
    score = (0.6 if style_aligned else 0.3) + (0.4 if sync_aligned else 0.2)
    
    return {
        "score": round(score, 3),
        "work_style": member.work_style,
        "sync_pref": member.sync_pref,
        "style_aligned": style_aligned,
        "sync_aligned": sync_aligned,
        "detail": f"{'Aligned' if style_aligned else 'Different'} style, {'aligned' if sync_aligned else 'different'} sync",
    }


def _generate_match_explanation(
    member: Member,
    role: str,
    skill_match: dict,
    interest_match: dict,
    availability_match: dict,
    goal_match: dict,
    style_match: dict,
) -> str:
    """Generate a natural language explanation of the match."""
    parts = []
    
    # Role match
    if role in member.preferred_roles:
        parts.append(f"Assigned to preferred role ({role})")
    else:
        parts.append(f"Assigned to {role} based on skill coverage")
    
    # Skill contribution
    if skill_match.get("unique_skills"):
        skills = ", ".join(skill_match["unique_skills"][:3])
        parts.append(f"Brings unique skills: {skills}")
    
    # Interest alignment
    if interest_match.get("shared_interests"):
        interests = ", ".join(interest_match["shared_interests"][:2])
        parts.append(f"Shares interests: {interests}")
    
    # Availability
    if availability_match.get("overlap_minutes", 0) >= 300:
        parts.append(f"Good availability overlap ({availability_match['detail']})")
    
    # Goals
    if goal_match.get("aligned"):
        parts.append(f"Aligned ambition: {member.ambition}")
    
    return ". ".join(parts) + "."


def _find_strengths(member: Member, others: list[Member], team: TeamResult, cohort: Cohort) -> list[str]:
    """Find what strengths this member brings to the team."""
    strengths = []
    
    # Unique skills
    member_skills = {s.id for s in member.skills if s.strong}
    other_skills = {s.id for m in others for s in m.skills if s.strong}
    unique = member_skills - other_skills
    if unique:
        strengths.append(f"Unique expertise: {', '.join(list(unique)[:3])}")
    
    # High proficiency
    high_prof = [s for s in member.skills if s.proficiency >= 4]
    if high_prof:
        strengths.append(f"High proficiency in {len(high_prof)} skills")
    
    # Role coverage
    role = team.role_assignments.get(member.id, "")
    if role in member.preferred_roles:
        strengths.append(f"Fills preferred role ({role})")
    
    return strengths


def _find_considerations(member: Member, others: list[Member], team: TeamResult, cohort: Cohort) -> list[str]:
    """Find potential concerns or tradeoffs."""
    considerations = []
    
    # Shared skills (redundancy)
    member_skills = {s.id for s in member.skills if s.strong}
    other_skills = {s.id for m in others for s in m.skills if s.strong}
    shared = member_skills & other_skills
    if len(shared) >= 2:
        considerations.append(f"Overlapping skills with teammates: {', '.join(list(shared)[:3])}")
    
    # Single point of failure
    role = team.role_assignments.get(member.id, "")
    if role:
        holders = [mid for mid, r in team.role_assignments.items() if r == role and mid != member.id]
        if not holders:
            considerations.append(f"Sole holder of {role} role")
    
    # Low availability
    from app.services.availability import intersect_all, total_minutes
    all_members = [member] + others
    overlap = total_minutes(intersect_all([list(m.intervals) for m in all_members]))
    if overlap < 180:
        considerations.append(f"Limited shared availability ({overlap} min/week)")
    
    return considerations


def _build_compatibility_matrix(team_members: list[Member], cohort: Cohort) -> list[dict]:
    """Build pairwise compatibility scores."""
    matrix = []
    for i, a in enumerate(team_members):
        for b in team_members[i + 1:]:
            sim = cohort.sim(a.id, b.id)
            matrix.append({
                "member_a": a.id,
                "member_b": b.id,
                "similarity": round(sim, 3),
                "level": "high" if sim > 0.3 else "medium" if sim > 0.1 else "low",
            })
    return matrix


def _generate_recommendations(
    team: TeamResult,
    team_members: list[Member],
    cohort: Cohort,
) -> list[dict[str, Any]]:
    """Generate recommendations for improving team composition."""
    recommendations = []
    
    # Check role coverage
    missing_roles = []
    for role in cohort.config.required_roles:
        holders = [m for m in team_members if role in m.roles]
        if not holders:
            missing_roles.append(role)
    
    if missing_roles:
        recommendations.append({
            "type": "gap",
            "priority": "high",
            "message": f"Missing roles: {', '.join(missing_roles)}",
            "action": "Consider adding members with these role capabilities",
        })
    
    # Check skill redundancy
    skill_holders = {}
    for m in team_members:
        for s in m.skills:
            if s.strong:
                skill_holders[s.id] = skill_holders.get(s.id, 0) + 1
    
    redundant = {k: v for k, v in skill_holders.items() if v >= 3}
    if redundant:
        skills = ", ".join(list(redundant.keys())[:3])
        recommendations.append({
            "type": "redundancy",
            "priority": "medium",
            "message": f"High skill redundancy: {skills}",
            "action": "Consider swapping a member with overlapping skills for someone with unique expertise",
        })
    
    # Check availability
    from app.services.availability import intersect_all, total_minutes
    overlap = total_minutes(intersect_all([list(m.intervals) for m in team_members]))
    if overlap < 300:
        recommendations.append({
            "type": "availability",
            "priority": "medium",
            "message": f"Limited shared availability ({overlap} min/week)",
            "action": "Consider members with better timezone overlap",
        })
    
    # Check goal alignment
    ambitions = [m.ambition for m in team_members]
    if len(set(ambitions)) > 1:
        recommendations.append({
            "type": "goals",
            "priority": "low",
            "message": "Mixed ambition levels on the team",
            "action": "Align on whether to prioritize winning, shipping, or learning",
        })
    
    return recommendations


def _build_team_summary(
    team: TeamResult,
    team_members: list[Member],
    member_matches: list[dict],
    cohort: Cohort,
) -> dict[str, Any]:
    """Build overall team summary."""
    avg_fit = sum(m["fit_score"] for m in member_matches) / len(member_matches) if member_matches else 0
    
    # Skill coverage
    all_skills = set()
    for m in team_members:
        for s in m.skills:
            if s.strong:
                all_skills.add(s.id)
    
    # Role coverage
    covered_roles = set()
    for m in team_members:
        covered_roles.update(m.roles)
    
    coverage = len(covered_roles & set(cohort.config.required_roles)) / len(cohort.config.required_roles)
    
    return {
        "member_count": len(team_members),
        "avg_fit_score": round(avg_fit),
        "total_unique_skills": len(all_skills),
        "role_coverage": round(coverage, 2),
        "score": round(team.score.total * 100),
    }
