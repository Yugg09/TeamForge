import { useQueryClient } from "@tanstack/react-query";
import { apiFetch, isMockMode } from "@/api/client";
import { resetMockState } from "@/api/mock";
import { formedTeamsQueryKey } from "@/api/useFormTeams";
import { healthQueryKey } from "@/api/useHealth";
import { participantsQueryKey } from "@/api/useParticipants";

export function useResetDemo() {
  const queryClient = useQueryClient();

  return async () => {
    if (isMockMode()) {
      resetMockState();
    } else {
      // Call the backend reseed endpoint to reset the database
      try {
        await apiFetch<{ status: string }>("/api/dev/reseed", {
          method: "POST",
        });
      } catch (err) {
        // Silently ignore errors — the backend may not have DEV_MODE enabled
        console.warn("Backend reseed failed (DEV_MODE may be off):", err);
      }
    }
    queryClient.removeQueries({ queryKey: formedTeamsQueryKey });
    queryClient.removeQueries({ queryKey: participantsQueryKey });
    queryClient.invalidateQueries({ queryKey: healthQueryKey });
  };
}
