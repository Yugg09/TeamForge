import { apiFetch } from "@/api/client";
import type { FormTeamsRequest, FormTeamsResponse } from "@/api/types";

export async function formTeams(
  body: FormTeamsRequest = {},
): Promise<FormTeamsResponse> {
  return apiFetch<FormTeamsResponse>("/api/form-teams", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
