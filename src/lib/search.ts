import { api } from "./api";
import { getAccessToken } from "./auth";

export type SearchDecisionResult = {
  id: number;
  title: string;
  context: string;
  decision: string;
  reasoning: string | null;
  status: string;
  projectId: number;
  projectName: string;
  workspaceId: number;
  workspaceName: string;
};

type SearchResponse = {
  success: true;
  message: string;
  data: {
    query: string;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
    results: SearchDecisionResult[];
  };
};

export function searchDecisions(query: string) {
  const token = getAccessToken();

  return api<SearchResponse>(
    `/search?q=${encodeURIComponent(query)}&page=1&limit=20`,
    {
      token,
    },
  );
}
