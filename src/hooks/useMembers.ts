import { useQuery } from "@tanstack/react-query";

import { getWorkspaceMembers } from "../lib/members";

export function useWorkspaceMembers(workspaceId: number | null) {
  return useQuery({
    queryKey: ["members", workspaceId],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error("Workspace ID is required");
      }

      return getWorkspaceMembers(workspaceId);
    },
    enabled: workspaceId !== null,
  });
}
