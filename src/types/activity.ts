export type ActivityActor = {
  id: number;
  name: string;
  email: string;
};

export type ActivityItem = {
  id: number;
  action: string;
  entityType: string;
  entityId: number | null;
  actor: ActivityActor | null;
  metadata: unknown;
  createdAt: string;
};

export type ActivityPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type WorkspaceActivityResponse = {
  success: boolean;
  message: string;
  data: {
    workspaceId: number;
    pagination: ActivityPagination;
    activities: ActivityItem[];
  };
};
