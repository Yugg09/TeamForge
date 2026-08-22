import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { analyzeProject } from "@/api/projects-api";
import type { ProjectAnalyzeRequest, ProjectAnalyzeResponse } from "@/api/types";

export const projectAnalyzeQueryKey = ["projects", "analyze", "latest"] as const;

export function useAnalyzeProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ProjectAnalyzeRequest) => analyzeProject(body),
    onSuccess: (data: ProjectAnalyzeResponse) => {
      queryClient.setQueryData(projectAnalyzeQueryKey, data);
    },
  });
}

export function useProjectRequirements() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: projectAnalyzeQueryKey,
    queryFn: async () =>
      queryClient.getQueryData<ProjectAnalyzeResponse>(projectAnalyzeQueryKey) ??
      null,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
