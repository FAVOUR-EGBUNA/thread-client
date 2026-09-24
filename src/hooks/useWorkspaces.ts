import { useQuery } from "@tanstack/react-query";

import { getWorkspaces } from "../lib/workspaces";

export function useWorkspaces() {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: getWorkspaces,
  });
}
