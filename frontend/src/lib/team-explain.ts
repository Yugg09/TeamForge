import type { RiskFlag, TeamScore } from "@/api/types";
import { ROLE_OPTIONS } from "@/lib/participant-constants";
import { PENALTY_LABELS, TERM_LABELS } from "@/lib/team-display";

function roleLabel(role: string): string {
  return ROLE_OPTIONS.find((entry) => entry.value === role)?.label ?? role;
}

export function formatRiskFlag(flag: RiskFlag): string {
  switch (flag.kind) {
    case "missing_role":
      return `Missing role: ${roleLabel(flag.payload.role)}`;
    case "single_point_of_failure":
      return `Single point of failure: ${flag.payload.skill} (${flag.payload.member_id})`;
    case "availability_gap":
      return `Low availability overlap (${flag.payload.overlap_minutes} min/week shared)`;
    case "goal_mismatch":
      return `Goal mismatch: outlier ${flag.payload.outlier_id}`;
    default:
      return "Risk flagged";
  }
}

export type TeamInsights = {
  strengths: string[];
  weaknesses: string[];
  explanations: string[];
};

/** Deterministic display templates from the score object — no scoring logic. */
export function buildTeamInsights(score: TeamScore): TeamInsights {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const explanations: string[] = [];

  const termEntries = Object.entries(score.terms) as [
    keyof TeamScore["terms"],
    number,
  ][];

  for (const [key, value] of termEntries) {
    const label = TERM_LABELS[key];
    if (value >= 0.8) {
      strengths.push(`Strong ${label.toLowerCase()} (${Math.round(value * 100)}%)`);
    } else if (value < 0.55) {
      weaknesses.push(`Low ${label.toLowerCase()} (${Math.round(value * 100)}%)`);
    }
    explanations.push(`${label}: ${Math.round(value * 100)}%`);
  }

  const penaltyEntries = Object.entries(score.penalties) as [
    keyof TeamScore["penalties"],
    number,
  ][];

  for (const [key, value] of penaltyEntries) {
    if (value > 0.1) {
      const label = PENALTY_LABELS[key];
      weaknesses.push(
        `${label} penalty (${Math.round(value * 100)}% deduction mass)`,
      );
    }
  }

  for (const flag of score.flags) {
    const message = formatRiskFlag(flag);
    explanations.push(message);
    if (flag.kind === "missing_role" || flag.kind === "availability_gap") {
      weaknesses.push(message);
    }
  }

  if (strengths.length === 0 && score.total >= 0.7) {
    strengths.push("Balanced overall team score from the optimizer.");
  }

  return { strengths, weaknesses, explanations };
}
