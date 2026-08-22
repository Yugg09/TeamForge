import { apiFetch } from "@/api/client";
import type { HealthResponse } from "@/api/types";

export async function fetchHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/api/health");
}
