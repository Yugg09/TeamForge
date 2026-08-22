import { useQueryClient } from "@tanstack/react-query";
import type { Team } from "@/api/types";
import {
  formedTeamsQueryKey,
  useFormedTeams,
} from "@/api/useFormTeams";

export function useFormedTeam(teamId: string | undefined) {
  const queryClient = useQueryClient();
  const { data: response } = useFormedTeams();
  const cached = queryClient.getQueryData(
    formedTeamsQueryKey,
  ) as typeof response;

  const teams = cached?.teams ?? response?.teams ?? [];
  const team: Team | undefined = teamId
    ? teams.find((entry) => entry.id === teamId)
    : undefined;

  return {
    team,
    teams,
    fairnessOk: cached?.fairness_ok ?? response?.fairness_ok,
    hasFormedData: teams.length > 0,
  };
}
