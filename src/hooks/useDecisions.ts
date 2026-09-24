import { useQuery } from "@tanstack/react-query";

import {
  getDecisionById,
  getDecisionHistory,
  getDecisionImpact,
  getProjectDecisions,
} from "../lib/decisions";

export function useProjectDecisions(projectId: number | null) {
  return useQuery({
    queryKey: ["decisions", "project", projectId],
    queryFn: () => {
      if (!projectId) {
        throw new Error("Project ID is required");
      }

      return getProjectDecisions(projectId);
    },
    enabled: projectId !== null,
  });
}

export function useDecision(decisionId: number | null) {
  return useQuery({
    queryKey: ["decision", decisionId],
    queryFn: () => {
      if (!decisionId) {
        throw new Error("Decision ID is required");
      }

      return getDecisionById(decisionId);
    },
    enabled: decisionId !== null,
  });
}

export function useDecisionHistory(decisionId: number | null) {
  return useQuery({
    queryKey: ["decision", decisionId, "history"],
    queryFn: () => {
      if (!decisionId) {
        throw new Error("Decision ID is required");
      }

      return getDecisionHistory(decisionId);
    },
    enabled: decisionId !== null,
  });
}

export function useDecisionImpact(decisionId: number | null, enabled = true) {
  return useQuery({
    queryKey: ["decision", decisionId, "impact"],
    queryFn: () => {
      if (!decisionId) {
        throw new Error("Decision ID is required");
      }

      return getDecisionImpact(decisionId);
    },
    enabled: decisionId !== null && enabled,
  });
}
