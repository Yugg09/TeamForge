import { apiFetch } from "@/api/client";

export interface MemberMatchDimension {
  score: number;
  detail: string;
  [key: string]: unknown;
}

export interface MemberMatch {
  member_id: string;
  assigned_role: string;
  fit_score: number;
  dimensions: {
    skill: MemberMatchDimension;
    interest: MemberMatchDimension;
    availability: MemberMatchDimension;
    goal: MemberMatchDimension;
    style: MemberMatchDimension;
  };
  explanation: string;
  strengths: string[];
  considerations: string[];
}

export interface TeamRecommendation {
  type: string;
  priority: "high" | "medium" | "low";
  message: string;
  action: string;
}

export interface TeamSummary {
  member_count: number;
  avg_fit_score: number;
  total_unique_skills: number;
  role_coverage: number;
  score: number;
}

export interface CompatibilityPair {
  member_a: string;
  member_b: string;
  similarity: number;
  level: "high" | "medium" | "low";
}

export interface TeamRecommendationResponse {
  team_id: string;
  team_summary: TeamSummary;
  member_matches: MemberMatch[];
  recommendations: TeamRecommendation[];
  compatibility_matrix: CompatibilityPair[];
}

export async function fetchTeamRecommendations(
  teamId: string,
): Promise<TeamRecommendationResponse> {
  return apiFetch<TeamRecommendationResponse>(`/api/teams/${teamId}/recommend`);
}
