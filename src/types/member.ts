export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";

export type WorkspaceMemberUser = {
  id: number;
  name: string;
  email: string;
};

export type WorkspaceMember = {
  id: number;
  role: WorkspaceRole;
  joinedAt: string;
  user: WorkspaceMemberUser;
};

export type WorkspaceMembersResponse = {
  success: boolean;
  message: string;
  data: {
    workspace: {
      id: number;
      name: string;
      slug: string;
    };
    currentUserRole: WorkspaceRole;
    memberCount: number;
    members: WorkspaceMember[];
  };
};

export type AddWorkspaceMemberInput = {
  email: string;
  role: "ADMIN" | "MEMBER";
};

export type AddWorkspaceMemberResponse = {
  success: boolean;
  message: string;
  data: {
    member: WorkspaceMember;
  };
};

export type UpdateWorkspaceMemberRoleResponse = {
  success: boolean;
  message: string;
  data: {
    member: WorkspaceMember & {
      previousRole: WorkspaceRole;
    };
  };
};

export type RemoveWorkspaceMemberResponse = {
  success: boolean;
  message: string;
  data: {
    member: {
      id: number;
      previousRole: WorkspaceRole;
      user: WorkspaceMemberUser;
    };
  };
};
