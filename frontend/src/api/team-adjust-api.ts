import { apiFetch } from "@/api/client";
import type { Team } from "@/api/types";

export interface LockTeamResponse {
  team_id: string;
  locked: boolean;
}

export interface MoveMemberResponse {
  moved: string;
  from_team: Team | null;
  to_team: Team;
}

export interface PartitionStatusResponse {
  status: "pending" | "accepted" | "rejected";
  locked_teams: string[];
}

export async function lockTeam(
  teamId: string,
  locked: boolean,
): Promise<LockTeamResponse> {
  return apiFetch<LockTeamResponse>(`/api/teams/${teamId}/lock`, {
    method: "POST",
    body: JSON.stringify({ locked }),
  });
}

export async function moveMember(
  fromTeamId: string,
  toTeamId: string,
  memberId: string,
): Promise<MoveMemberResponse> {
  return apiFetch<MoveMemberResponse>("/api/teams/move-member", {
    method: "POST",
    body: JSON.stringify({
      from_team_id: fromTeamId,
      to_team_id: toTeamId,
      member_id: memberId,
    }),
  });
}

export async function acceptPartition(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>("/api/teams/accept", {
    method: "POST",
  });
}

export async function rejectPartition(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>("/api/teams/reject", {
    method: "POST",
  });
}

export async function getPartitionStatus(): Promise<PartitionStatusResponse> {
  return apiFetch<PartitionStatusResponse>("/api/teams/status");
}
