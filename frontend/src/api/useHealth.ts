import { useQuery } from "@tanstack/react-query";
import { fetchHealth } from "@/api/health-api";

export const healthQueryKey = ["health"] as const;

export function useHealth() {
  return useQuery({
    queryKey: healthQueryKey,
    queryFn: fetchHealth,
    staleTime: 60_000,
  });
}
