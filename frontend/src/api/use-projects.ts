import { useMutation } from "@tanstack/react-query";
import { analyzeProject } from "@/api/projects-api";
import type { ProjectAnalyzeRequest } from "@/api/types";

export function useAnalyzeProject() {
  return useMutation({
    mutationFn: (body: ProjectAnalyzeRequest) => analyzeProject(body),
  });
}
