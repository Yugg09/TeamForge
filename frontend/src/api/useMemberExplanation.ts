import { useQuery } from "@tanstack/react-query";
import {
  fetchMemberExplanation,
  type MemberExplanation,
} from "@/api/member-explain-api";

export const memberExplanationQueryKey = (teamId: string, memberId: string) =>
  ["memberExplanation", teamId, memberId] as const;

export function useMemberExplanation(
  teamId: string | undefined,
  memberId: string | undefined,
) {
  return useQuery<MemberExplanation | null>({
    queryKey: memberExplanationQueryKey(teamId ?? "", memberId ?? ""),
    queryFn: async () => {
      if (!teamId || !memberId) return null;
      return fetchMemberExplanation(teamId, memberId);
    },
    enabled: !!teamId && !!memberId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
