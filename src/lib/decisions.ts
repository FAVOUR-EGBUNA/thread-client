import { api } from "./api";
import { getAccessToken } from "./auth";
import type {
  CreateDecisionInput,
  CreateDecisionRelationInput,
  CreateDecisionRelationResponse,
  CreateDecisionResponse,
  DecisionDetailResponse,
  DecisionHistoryResponse,
  DecisionImpactResponse,
  DecisionStatus,
  DeleteDecisionRelationResponse,
  ProjectDecisionsResponse,
  UpdateDecisionInput,
  UpdateDecisionResponse,
  UpdateDecisionStatusResponse,
} from "../types/decision";

export function getProjectDecisions(projectId: number) {
  const token = getAccessToken();

  return api<ProjectDecisionsResponse>(`/projects/${projectId}/decisions`, {
    token,
  });
}

export function createDecision(projectId: number, input: CreateDecisionInput) {
  const token = getAccessToken();

  return api<CreateDecisionResponse>(`/projects/${projectId}/decisions`, {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });
}

export function getDecisionById(decisionId: number) {
  const token = getAccessToken();

  return api<DecisionDetailResponse>(`/decisions/${decisionId}`, { token });
}

export function updateDecision(decisionId: number, input: UpdateDecisionInput) {
  const token = getAccessToken();

  return api<UpdateDecisionResponse>(`/decisions/${decisionId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(input),
  });
}

export function updateDecisionStatus(
  decisionId: number,
  status: DecisionStatus,
) {
  const token = getAccessToken();

  return api<UpdateDecisionStatusResponse>(`/decisions/${decisionId}/status`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ status }),
  });
}

export function getDecisionHistory(decisionId: number) {
  const token = getAccessToken();

  return api<DecisionHistoryResponse>(`/decisions/${decisionId}/history`, {
    token,
  });
}

export function createDecisionRelation(
  decisionId: number,
  input: CreateDecisionRelationInput,
) {
  const token = getAccessToken();

  return api<CreateDecisionRelationResponse>(
    `/decisions/${decisionId}/relations`,
    {
      method: "POST",
      token,
      body: JSON.stringify(input),
    },
  );
}

export function deleteDecisionRelation(relationId: number) {
  const token = getAccessToken();

  return api<DeleteDecisionRelationResponse>(
    `/decision-relations/${relationId}`,
    {
      method: "DELETE",
      token,
    },
  );
}

export function getDecisionImpact(decisionId: number) {
  const token = getAccessToken();

  return api<DecisionImpactResponse>(`/decisions/${decisionId}/impact`, {
    token,
  });
}
