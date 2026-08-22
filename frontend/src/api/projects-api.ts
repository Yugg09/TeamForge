import { apiFetch } from "@/api/client";
import type {
  ProjectAnalyzeRequest,
  ProjectAnalyzeResponse,
} from "@/api/types";

export async function analyzeProject(
  body: ProjectAnalyzeRequest,
): Promise<ProjectAnalyzeResponse> {
  return apiFetch<ProjectAnalyzeResponse>("/api/projects/analyze", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
