import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptPartition,
  getPartitionStatus,
  lockTeam,
  moveMember,
  rejectPartition,
  type MoveMemberResponse,
  type PartitionStatusResponse,
} from "@/api/team-adjust-api";
import { formedTeamsQueryKey } from "@/api/useFormTeams";
import type { FormTeamsResponse } from "@/api/types";

export const partitionStatusQueryKey = ["partitionStatus"] as const;

export function usePartitionStatus() {
  return useQuery<PartitionStatusResponse>({
    queryKey: partitionStatusQueryKey,
    queryFn: getPartitionStatus,
    staleTime: 30_000,
  });
}

export function useLockTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, locked }: { teamId: string; locked: boolean }) =>
      lockTeam(teamId, locked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: formedTeamsQueryKey });
    },
  });
}

export function useMoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      fromTeamId,
      toTeamId,
      memberId,
    }: {
      fromTeamId: string;
      toTeamId: string;
      memberId: string;
    }) => moveMember(fromTeamId, toTeamId, memberId),
    onSuccess: (data: MoveMemberResponse) => {
      // Update the teams cache with the new team compositions
      queryClient.setQueryData<FormTeamsResponse>(
        formedTeamsQueryKey,
        (current) => {
          if (!current) return current;
          const teams = current.teams.map((team) => {
            if (team.id === data.to_team.id) {
              return data.to_team;
            }
            if (data.from_team && team.id === data.from_team.id) {
              return data.from_team;
            }
            return team;
          });
          return { ...current, teams };
        },
      );
    },
  });
}

export function useAcceptPartition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptPartition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partitionStatusQueryKey });
    },
  });
}

export function useRejectPartition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectPartition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partitionStatusQueryKey });
      queryClient.removeQueries({ queryKey: formedTeamsQueryKey });
    },
  });
}
