import { useQuery } from "@tanstack/react-query";
import {
  fetchTeamRecommendations,
  type TeamRecommendationResponse,
} from "@/api/recommend-api";

export const recommendationsQueryKey = (teamId: string) =>
  ["recommendations", teamId] as const;

export function useTeamRecommendations(teamId: string | undefined) {
  return useQuery<TeamRecommendationResponse | null>({
    queryKey: recommendationsQueryKey(teamId ?? ""),
    queryFn: async () => {
      if (!teamId) return null;
      return fetchTeamRecommendations(teamId);
    },
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000,
  });
}
