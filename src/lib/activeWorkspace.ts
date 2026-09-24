const ACTIVE_WORKSPACE_KEY = "thread_active_workspace_id";

export function getActiveWorkspaceId() {
  const storedValue = localStorage.getItem(ACTIVE_WORKSPACE_KEY);

  if (!storedValue) {
    return null;
  }

  const workspaceId = Number(storedValue);

  if (!Number.isInteger(workspaceId) || workspaceId <= 0) {
    localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
    return null;
  }

  return workspaceId;
}

export function setActiveWorkspaceId(workspaceId: number) {
  localStorage.setItem(ACTIVE_WORKSPACE_KEY, String(workspaceId));
}

export function removeActiveWorkspaceId() {
  localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
}
