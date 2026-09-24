export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";

export type Workspace = {
  id: number;
  name: string;
  slug: string;
  role: WorkspaceRole;
  memberCount: number;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkspacesResponse = {
  success: boolean;
  message: string;
  data: {
    workspaceCount: number;
    workspaces: Workspace[];
  };
};

export type CreateWorkspaceResponse = {
  success: boolean;
  message: string;
  data: {
    workspace: {
      id: number;
      name: string;
      slug: string;
      createdAt: string;
      updatedAt: string;
    };
  };
};

export type UpdateWorkspaceInput = {
  name: string;
};

export type UpdateWorkspaceResponse = {
  success: boolean;
  message: string;
  data: {
    workspace: {
      id: number;
      name: string;
      slug: string;
      createdAt: string;
      updatedAt: string;
    };
  };
};
