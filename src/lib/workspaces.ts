import { api } from "./api";
import { getAccessToken } from "./auth";

import type {
  CreateWorkspaceResponse,
  UpdateWorkspaceInput,
  UpdateWorkspaceResponse,
  WorkspacesResponse,
} from "../types/workspace";

export function getWorkspaces() {
  const token = getAccessToken();

  return api<WorkspacesResponse>("/workspaces", {
    token,
  });
}

export function createWorkspace(name: string) {
  const token = getAccessToken();

  return api<CreateWorkspaceResponse>("/workspaces", {
    method: "POST",
    token,
    body: JSON.stringify({
      name,
    }),
  });
}

export function updateWorkspace(
  workspaceId: number,
  input: UpdateWorkspaceInput,
) {
  const token = getAccessToken();

  return api<UpdateWorkspaceResponse>(`/workspaces/${workspaceId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(input),
  });
}
