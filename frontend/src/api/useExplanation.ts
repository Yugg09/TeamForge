import { useQuery } from "@tanstack/react-query";
import { fetchTeamExplanation, type ExplainResponse } from "@/api/explain-api";

export const explanationQueryKey = (teamId: string) => ["explanation", teamId] as const;

export function useTeamExplanation(teamId: string | undefined) {
  return useQuery<ExplainResponse | null>({
    queryKey: explanationQueryKey(teamId ?? ""),
    queryFn: async () => {
      if (!teamId) return null;
      return fetchTeamExplanation(teamId);
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
