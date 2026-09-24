import { api } from "./api";
import { getAccessToken } from "./auth";
import type { WorkspaceActivityResponse } from "../types/activity";

export function getWorkspaceActivity(
  workspaceId: number,
  page = 1,
  limit = 20,
) {
  const token = getAccessToken();

  return api<WorkspaceActivityResponse>(
    `/workspaces/${workspaceId}/activity?page=${page}&limit=${limit}`,
    {
      token,
    },
  );
}
