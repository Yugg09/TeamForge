import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rebalance } from "@/api/rebalance-api";
import { formedTeamsQueryKey } from "@/api/useFormTeams";
import type { FormTeamsResponse, RebalanceRequest } from "@/api/types";

export function useRebalanceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: RebalanceRequest) => rebalance(body),
    onSuccess: (data) => {
      queryClient.setQueryData<FormTeamsResponse | null>(
        formedTeamsQueryKey,
        (current) => {
          if (!current) return current;
          return {
            ...current,
            teams: current.teams.map((team) =>
              team.id === data.team.id ? data.team : team,
            ),
          };
        },
      );
    },
  });
}
