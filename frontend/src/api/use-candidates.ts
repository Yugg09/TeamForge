import { useQuery } from "@tanstack/react-query";
import { searchCandidates } from "@/api/candidates-api";

export const candidateSearchQueryKey = (query: string) =>
  ["candidates", "search", query] as const;

export function useCandidateSearch(query: string | null) {
  const trimmed = query?.trim() ?? "";

  return useQuery({
    queryKey: candidateSearchQueryKey(trimmed),
    queryFn: async () => {
      const response = await searchCandidates(trimmed);
      return response.candidates;
    },
    enabled: trimmed.length >= 2,
  });
}
