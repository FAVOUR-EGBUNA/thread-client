import type { WorkspaceRole } from "./workspace";

export type Project = {
  id: number;
  name: string;
  description: string | null;
  workspaceId: number;
  decisionCount: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceProjectsResponse = {
  success: boolean;
  message: string;
  data: {
    workspace: {
      id: number;
      name: string;
      slug: string;
    };
    currentUserRole: WorkspaceRole;
    projectCount: number;
    projects: Project[];
  };
};

export type CreateProjectInput = {
  name: string;
  description?: string;
};

export type CreatedProject = {
  id: number;
  name: string;
  description: string | null;
  workspaceId: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectResponse = {
  success: boolean;
  message: string;
  data: {
    project: CreatedProject;
  };
};

export type ProjectDetail = {
  id: number;
  name: string;
  description: string | null;
  workspaceId: number;
  currentUserRole: WorkspaceRole;
  decisionCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectDetailResponse = {
  success: boolean;
  message: string;
  data: {
    project: ProjectDetail;
  };
};
