import type { RoleId, Team, TeamScore, TeamScoreTerms } from "@/api/types";
import { ROLE_OPTIONS } from "@/lib/participant-constants";

export function scoreToDisplay(total: number): number {
  return Math.round(total * 100);
}

export function getRecommendedTeam(teams: Team[]): Team | undefined {
  if (teams.length === 0) return undefined;
  return teams.reduce((best, team) =>
    team.score.total > best.score.total ? team : best,
  );
}

export type RoleCoveragePoint = {
  role: RoleId;
  label: string;
  covered: number;
  fullMark: number;
};

export function buildRoleCoverage(team: Team): RoleCoveragePoint[] {
  const assignments = team.role_assignments ?? {};
  const assignedRoles = new Set(Object.values(assignments));

  return ROLE_OPTIONS.map((role) => ({
    role: role.value,
    label: role.label,
    covered: assignedRoles.has(role.value) ? 1 : 0,
    fullMark: 1,
  }));
}

export function buildUncoveredRoles(team: Team): RoleCoveragePoint[] {
  return buildRoleCoverage(team).filter((point) => point.covered === 0);
}

export function getMemberAssignment(
  team: Team,
  memberId: string,
): RoleId | undefined {
  return team.role_assignments?.[memberId];
}

export function safeTermValue(value: number | undefined): number {
  if (value === undefined || Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export type CompositionSummary = {
  memberCount: number;
  assignedRoleCount: number;
  coverageTerm: number | undefined;
  flagCount: number;
  complementarityTerm: number | undefined;
};

export function buildCompositionSummary(team: Team): CompositionSummary {
  const score = team.score;
  return {
    memberCount: team.member_ids?.length ?? 0,
    assignedRoleCount: Object.keys(team.role_assignments ?? {}).length,
    coverageTerm: score?.terms?.coverage,
    flagCount: score?.flags?.length ?? 0,
    complementarityTerm: score?.terms?.complementarity,
  };
}

export type RoleDistributionSlice = {
  role: RoleId;
  label: string;
  count: number;
};

export function buildRoleDistribution(team: Team): RoleDistributionSlice[] {
  const counts = new Map<RoleId, number>();
  const assignments = team.role_assignments ?? {};

  for (const role of Object.values(assignments)) {
    counts.set(role, (counts.get(role) ?? 0) + 1);
  }

  return ROLE_OPTIONS.map((role) => ({
    role: role.value,
    label: role.label,
    count: counts.get(role.value) ?? 0,
  })).filter((slice) => slice.count > 0);
}

export const TERM_LABELS: Record<keyof TeamScoreTerms, string> = {
  coverage: "Coverage",
  complementarity: "Complementarity",
  availability_overlap: "Availability overlap",
  goal_alignment: "Goal alignment",
  style_fit: "Style fit",
  interest_fit: "Interest fit",
};

export const PENALTY_LABELS: Record<keyof TeamScore["penalties"], string> = {
  skill_redundancy: "Skill redundancy",
  role_gaps: "Role gaps",
  availability_starvation: "Availability starvation",
};
