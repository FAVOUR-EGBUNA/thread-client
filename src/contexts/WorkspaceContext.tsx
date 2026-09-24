import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useWorkspaces } from "../hooks/useWorkspaces";
import {
  getActiveWorkspaceId,
  setActiveWorkspaceId,
} from "../lib/activeWorkspace";
import type { Workspace } from "../types/workspace";

type WorkspaceContextValue = {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  activeWorkspaceId: number | null;
  selectWorkspace: (workspaceId: number) => void;
  isLoading: boolean;
  isError: boolean;
  refetchWorkspaces: () => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

type WorkspaceProviderProps = {
  children: ReactNode;
};

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const workspacesQuery = useWorkspaces();

  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<
    number | null
  >(() => getActiveWorkspaceId());

  const workspaces = useMemo(
    () => workspacesQuery.data?.data.workspaces ?? [],
    [workspacesQuery.data],
  );

  const activeWorkspace =
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) ??
    workspaces[0] ??
    null;

  useEffect(() => {
    if (!activeWorkspace) {
      return;
    }

    if (activeWorkspaceId !== activeWorkspace.id) {
      setActiveWorkspaceId(activeWorkspace.id);
      setActiveWorkspaceIdState(activeWorkspace.id);
    }
  }, [activeWorkspace, activeWorkspaceId]);

  function selectWorkspace(workspaceId: number) {
    const workspaceExists = workspaces.some(
      (workspace) => workspace.id === workspaceId,
    );

    if (!workspaceExists) {
      return;
    }

    setActiveWorkspaceId(workspaceId);
    setActiveWorkspaceIdState(workspaceId);
  }

  function refetchWorkspaces() {
    void workspacesQuery.refetch();
  }

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaces,
      activeWorkspace,
      activeWorkspaceId: activeWorkspace?.id ?? null,
      selectWorkspace,
      isLoading: workspacesQuery.isPending,
      isError: workspacesQuery.isError,
      refetchWorkspaces,
    }),
    [
      workspaces,
      activeWorkspace,
      workspacesQuery.isPending,
      workspacesQuery.isError,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }

  return context;
}
