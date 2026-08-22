import { apiFetch } from "@/api/client";
import type { CandidatesSearchResponse } from "@/api/types";

export async function searchCandidates(
  query: string,
): Promise<CandidatesSearchResponse> {
  const params = new URLSearchParams({ q: query });
  return apiFetch<CandidatesSearchResponse>(
    `/api/candidates/search?${params.toString()}`,
  );
}
