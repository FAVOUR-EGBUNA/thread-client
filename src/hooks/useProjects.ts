import { useQuery } from "@tanstack/react-query";

import { getProjectById, getWorkspaceProjects } from "../lib/projects";

export function useProjects(workspaceId: number | null) {
  return useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace ID is required");
      }

      return getWorkspaceProjects(workspaceId);
    },
    enabled: workspaceId !== null,
  });
}

export function useProject(projectId: number | null) {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: () => {
      if (!projectId) {
        throw new Error("Project ID is required");
      }

      return getProjectById(projectId);
    },
    enabled: projectId !== null,
  });
}
