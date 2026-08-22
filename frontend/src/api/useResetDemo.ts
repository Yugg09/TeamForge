import { useQueryClient } from "@tanstack/react-query";
import { isMockMode } from "@/api/client";
import { resetMockState } from "@/api/mock";
import { formedTeamsQueryKey } from "@/api/useFormTeams";
import { healthQueryKey } from "@/api/useHealth";
import { participantsQueryKey } from "@/api/useParticipants";

export function useResetDemo() {
  const queryClient = useQueryClient();

  return () => {
    if (isMockMode()) {
      resetMockState();
    }
    queryClient.removeQueries({ queryKey: formedTeamsQueryKey });
    queryClient.removeQueries({ queryKey: participantsQueryKey });
    queryClient.invalidateQueries({ queryKey: healthQueryKey });
  };
}
