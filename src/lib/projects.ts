import { api } from "./api";
import { getAccessToken } from "./auth";
import type {
  CreateProjectInput,
  CreateProjectResponse,
  ProjectDetailResponse,
  WorkspaceProjectsResponse,
} from "../types/project";

export function getWorkspaceProjects(workspaceId: number) {
  const token = getAccessToken();

  return api<WorkspaceProjectsResponse>(`/workspaces/${workspaceId}/projects`, {
    token,
  });
}

export function createProject(workspaceId: number, input: CreateProjectInput) {
  const token = getAccessToken();

  return api<CreateProjectResponse>(`/workspaces/${workspaceId}/projects`, {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });
}

export function getProjectById(projectId: number) {
  const token = getAccessToken();

  return api<ProjectDetailResponse>(`/projects/${projectId}`, {
    token,
  });
}
