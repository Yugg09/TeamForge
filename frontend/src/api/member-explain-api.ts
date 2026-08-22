import { apiFetch } from "@/api/client";

export interface MemberExplanation {
  member_id: string;
  team_id: string;
  assigned_role: string;
  reasons: string[];
  strengths: string[];
  tradeoffs: string[];
  fit_score: number;
}

export async function fetchMemberExplanation(
  teamId: string,
  memberId: string,
): Promise<MemberExplanation> {
  return apiFetch<MemberExplanation>(
    `/api/teams/${teamId}/members/${memberId}/explain`,
  );
}
