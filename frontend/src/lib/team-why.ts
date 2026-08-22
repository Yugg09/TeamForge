import type {
  Participant,
  ProjectAnalyzeResponse,
  RoleId,
  Skill,
  Team,
  TeamScore,
} from "@/api/types";
import { CANONICAL_SKILLS, ROLE_OPTIONS } from "@/lib/participant-constants";
import {
  buildUncoveredRoles,
  getMemberAssignment,
  scoreToDisplay,
  TERM_LABELS,
} from "@/lib/team-display";
import { formatRiskFlag } from "@/lib/team-explain";

export type ExplanationTone = "positive" | "warning" | "neutral";

export type ExplanationLine = {
  tone: ExplanationTone;
  text: string;
  evidence?: string;
};

export type MemberWhyContext = {
  memberId: string;
  name: string;
  assignedRole?: RoleId;
  lines: ExplanationLine[];
  skills: Skill[];
  satisfiedRequirements: string[];
};

export type TeamWhyContext = {
  headline: string;
  scoreDisplay: number | null;
  teamLines: ExplanationLine[];
  members: MemberWhyContext[];
  missingItems: ExplanationLine[];
  complementarity: {
    score: number | null;
    rolesRepresented: string[];
    lines: ExplanationLine[];
  };
  projectDomain?: string;
};

function skillLabel(id: string): string {
  return CANONICAL_SKILLS.find((skill) => skill.id === id)?.label ?? id;
}

function roleLabel(role: RoleId): string {
  return ROLE_OPTIONS.find((entry) => entry.value === role)?.label ?? role;
}

function topScoreTerms(score: TeamScore): [string, number][] {
  return Object.entries(score.terms)
    .map(([key, value]) => [TERM_LABELS[key as keyof typeof TERM_LABELS], value] as [string, number])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);
}

function buildMemberLines(
  participant: Participant | undefined,
  assignedRole: RoleId | undefined,
  project: ProjectAnalyzeResponse | undefined,
): { lines: ExplanationLine[]; satisfied: string[] } {
  const lines: ExplanationLine[] = [];
  const satisfied: string[] = [];

  if (assignedRole) {
    lines.push({
      tone: "positive",
      text: `Assigned ${roleLabel(assignedRole)} on this team.`,
      evidence: "role_assignments",
    });
    if (project?.roles.includes(assignedRole)) {
      satisfied.push(`Project role: ${roleLabel(assignedRole)}`);
    }
  } else {
    lines.push({
      tone: "warning",
      text: "No role assignment in role_assignments.",
      evidence: "role_assignments",
    });
  }

  if (participant?.preferred_roles?.length) {
    const prefs = participant.preferred_roles.map(roleLabel).join(", ");
    lines.push({
      tone: "neutral",
      text: `Preferred roles: ${prefs}.`,
      evidence: "preferred_roles",
    });
    if (assignedRole && participant.preferred_roles.includes(assignedRole)) {
      lines.push({
        tone: "positive",
        text: "Assigned role matches a stated preference.",
        evidence: "preferred_roles",
      });
    }
  }

  const skills = participant?.skills ?? [];
  for (const skill of skills.slice(0, 4)) {
    lines.push({
      tone: "neutral",
      text: `Contributes ${skillLabel(skill.id)} (${skill.proficiency}/5).`,
      evidence: "skills",
    });
    if (project?.required_skills.includes(skill.id)) {
      satisfied.push(`Required skill: ${skillLabel(skill.id)}`);
    }
  }

  if (participant?.ambition) {
    lines.push({
      tone: "neutral",
      text: `Ambition: ${participant.ambition}.`,
      evidence: "ambition",
    });
  }

  return { lines, satisfied };
}

export function buildTeamWhyContext(
  team: Team,
  participants: Participant[] = [],
  project?: ProjectAnalyzeResponse,
): TeamWhyContext | null {
  const score = team.score;
  if (!score) return null;

  const participantMap = new Map(participants.map((p) => [p.id, p]));
  const scoreDisplay =
    score.total !== undefined && !Number.isNaN(score.total)
      ? scoreToDisplay(score.total)
      : null;

  const topTerms = topScoreTerms(score);
  const headline =
    scoreDisplay !== null
      ? `${team.id} scores ${scoreDisplay} — driven by ${topTerms
          .map(([label, value]) => `${label.toLowerCase()} (${Math.round(value * 100)}%)`)
          .join(" and ")}.`
      : `${team.id} — optimizer partition from POST /api/form-teams.`;

  const teamLines: ExplanationLine[] = topTerms.map(([label, value]) => ({
    tone: value >= 0.75 ? "positive" : "neutral",
    text: `${label}: ${Math.round(value * 100)}%`,
    evidence: "score.terms",
  }));

  for (const flag of score.flags ?? []) {
    teamLines.push({
      tone: flag.kind === "missing_role" ? "warning" : "neutral",
      text: formatRiskFlag(flag),
      evidence: "score.flags",
    });
  }

  const memberIds = team.member_ids ?? [];
  const members: MemberWhyContext[] = memberIds.map((memberId) => {
    const participant = participantMap.get(memberId);
    const assignedRole = getMemberAssignment(team, memberId);
    const { lines, satisfied } = buildMemberLines(
      participant,
      assignedRole,
      project,
    );
    return {
      memberId,
      name: participant?.name ?? memberId,
      assignedRole,
      lines,
      skills: participant?.skills ?? [],
      satisfiedRequirements: satisfied,
    };
  });

  const missingItems: ExplanationLine[] = [];
  for (const flag of score.flags ?? []) {
    if (flag.kind === "missing_role") {
      missingItems.push({
        tone: "warning",
        text: formatRiskFlag(flag),
        evidence: "score.flags",
      });
    }
  }

  const uncovered = buildUncoveredRoles(team);
  for (const role of uncovered) {
    missingItems.push({
      tone: "warning",
      text: `No member assigned as ${role.label}.`,
      evidence: "role_assignments",
    });
  }

  if (project) {
    const assignedRoles = new Set(Object.values(team.role_assignments ?? {}));
    for (const role of project.roles) {
      if (!assignedRoles.has(role)) {
        missingItems.push({
          tone: "warning",
          text: `Project requires ${roleLabel(role)} — not assigned on this team.`,
          evidence: "projects/analyze.roles",
        });
      }
    }

    const teamSkillIds = new Set(
      members.flatMap((member) => member.skills.map((skill) => skill.id)),
    );
    for (const skillId of project.required_skills) {
      if (!teamSkillIds.has(skillId)) {
        missingItems.push({
          tone: "warning",
          text: `Project requires ${skillLabel(skillId)} — no member lists this skill.`,
          evidence: "projects/analyze.required_skills",
        });
      }
    }
  }

  const rolesRepresented = [
    ...new Set(Object.values(team.role_assignments ?? {})),
  ].map(roleLabel);

  const complementarityScore = score.terms?.complementarity;
  const complementarityLines: ExplanationLine[] = [];

  if (complementarityScore !== undefined) {
    complementarityLines.push({
      tone: complementarityScore >= 0.75 ? "positive" : "neutral",
      text: `Complementarity term: ${Math.round(complementarityScore * 100)}%.`,
      evidence: "score.terms.complementarity",
    });
  }

  if (rolesRepresented.length > 0) {
    complementarityLines.push({
      tone: "positive",
      text: `Roles spread across: ${rolesRepresented.join(", ")}.`,
      evidence: "role_assignments",
    });
  }

  if (score.terms?.coverage !== undefined) {
    complementarityLines.push({
      tone: score.terms.coverage >= 0.75 ? "positive" : "neutral",
      text: `Coverage term: ${Math.round(score.terms.coverage * 100)}%.`,
      evidence: "score.terms.coverage",
    });
  }

  return {
    headline,
    scoreDisplay,
    teamLines,
    members,
    missingItems,
    complementarity: {
      score:
        complementarityScore !== undefined
          ? Math.round(complementarityScore * 100)
          : null,
      rolesRepresented,
      lines: complementarityLines,
    },
    projectDomain: project?.domain,
  };
}
