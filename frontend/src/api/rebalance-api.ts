import { apiFetch } from "@/api/client";
import type { RebalanceRequest, RebalanceResponse } from "@/api/types";

export async function rebalance(
  body: RebalanceRequest,
): Promise<RebalanceResponse> {
  return apiFetch<RebalanceResponse>("/api/rebalance", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
