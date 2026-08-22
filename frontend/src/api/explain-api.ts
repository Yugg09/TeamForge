import { apiFetch } from "@/api/client";

export interface ExplanationBullet {
  type: "strength" | "weakness" | "neutral";
  text: string;
}

export interface ExplainResponse {
  team_id: string;
  bullets: ExplanationBullet[];
  llm_backend: "openai" | "template";
}

export async function fetchTeamExplanation(teamId: string): Promise<ExplainResponse> {
  return apiFetch<ExplainResponse>(`/api/teams/${teamId}/explain`);
}
