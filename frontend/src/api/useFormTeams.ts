import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formTeams } from "@/api/form-teams-api";
import type { FormTeamsRequest, FormTeamsResponse } from "@/api/types";

export const formedTeamsQueryKey = ["teams", "formed"] as const;

export function useFormTeamsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: FormTeamsRequest = {}) => formTeams(body),
    onSuccess: (data: FormTeamsResponse) => {
      queryClient.setQueryData(formedTeamsQueryKey, data);
    },
  });
}

export function useFormedTeams() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: formedTeamsQueryKey,
    queryFn: async () => {
      return (
        queryClient.getQueryData<FormTeamsResponse>(formedTeamsQueryKey) ?? null
      );
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
