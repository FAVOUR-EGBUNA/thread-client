import { useQuery } from "@tanstack/react-query";

import { getWorkspaceActivity } from "../lib/activity";

export function useWorkspaceActivity(
  workspaceId: number | null,
  page: number,
  limit = 20,
) {
  return useQuery({
    queryKey: ["activity", workspaceId, page, limit],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace ID is required");
      }

      return getWorkspaceActivity(workspaceId, page, limit);
    },
    enabled: workspaceId !== null,
  });
}
