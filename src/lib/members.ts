import { api } from "./api";
import { getAccessToken } from "./auth";

import type {
  AddWorkspaceMemberInput,
  AddWorkspaceMemberResponse,
  RemoveWorkspaceMemberResponse,
  UpdateWorkspaceMemberRoleResponse,
  WorkspaceMembersResponse,
} from "../types/member";

export function getWorkspaceMembers(workspaceId: number) {
  const token = getAccessToken();

  return api<WorkspaceMembersResponse>(`/workspaces/${workspaceId}/members`, {
    token,
  });
}

export function addWorkspaceMember(
  workspaceId: number,
  input: AddWorkspaceMemberInput,
) {
  const token = getAccessToken();

  return api<AddWorkspaceMemberResponse>(`/workspaces/${workspaceId}/members`, {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });
}

export function updateWorkspaceMemberRole(
  workspaceId: number,
  memberId: number,
  role: "ADMIN" | "MEMBER",
) {
  const token = getAccessToken();

  return api<UpdateWorkspaceMemberRoleResponse>(
    `/workspaces/${workspaceId}/members/${memberId}/role`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify({ role }),
    },
  );
}

export function removeWorkspaceMember(workspaceId: number, memberId: number) {
  const token = getAccessToken();

  return api<RemoveWorkspaceMemberResponse>(
    `/workspaces/${workspaceId}/members/${memberId}`,
    {
      method: "DELETE",
      token,
    },
  );
}
