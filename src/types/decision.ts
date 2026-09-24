export type DecisionStatus =
  | "PROPOSED"
  | "ACCEPTED"
  | "REJECTED"
  | "SUPERSEDED";

export type DecisionRelationType =
  | "DEPENDS_ON"
  | "AFFECTS"
  | "SUPPORTS"
  | "CONFLICTS_WITH"
  | "SUPERSEDES"
  | "RELATED_TO";

export type Decision = {
  id: number;
  title: string;
  context: string;
  decision: string;
  reasoning: string | null;
  status: DecisionStatus;
  projectId: number;
  createdAt: string;
  updatedAt: string;
};

export type DecisionRelation = {
  id: number;
  sourceDecisionId: number;
  targetDecisionId: number;
  type: DecisionRelationType;
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectDecisionsResponse = {
  success: boolean;
  message: string;
  data: {
    project: {
      id: number;
      name: string;
      description: string | null;
    };
    decisionCount: number;
    decisions: Decision[];
  };
};

export type CreateDecisionInput = {
  title: string;
  context: string;
  decision: string;
  reasoning?: string;
  status?: DecisionStatus;
};

export type CreateDecisionResponse = {
  success: boolean;
  message: string;
  data: {
    decision: Decision;
  };
};

export type DecisionDetailResponse = {
  success: boolean;
  message: string;
  data: {
    decision: Decision;
    relationships: {
      outgoing: DecisionRelation[];
      incoming: DecisionRelation[];
    };
  };
};

export type UpdateDecisionInput = {
  title?: string;
  context?: string;
  decision?: string;
  reasoning?: string;
};

export type UpdateDecisionResponse = {
  success: boolean;
  message: string;
  data: {
    decision: Decision;
  };
};

export type DecisionStatusHistory = {
  id: number;
  previousStatus: DecisionStatus;
  newStatus: DecisionStatus;
  decisionId: number;
  changedById: number;
  createdAt: string;
};

export type UpdateDecisionStatusResponse = {
  success: boolean;
  message: string;
  data: {
    previousStatus: DecisionStatus;
    currentStatus: DecisionStatus;
    decision: Decision;
    history: DecisionStatusHistory;
    activity: unknown;
  };
};

export type DecisionHistoryResponse = {
  success: boolean;
  message: string;
  data: {
    decision: {
      id: number;
      title: string;
      status: DecisionStatus;
    };
    historyCount: number;
    history: DecisionStatusHistory[];
  };
};

export type CreateDecisionRelationInput = {
  targetDecisionId: number;
  type: DecisionRelationType;
};

export type CreateDecisionRelationResponse = {
  success: boolean;
  message: string;
  data: {
    relation: DecisionRelation;
  };
};

export type DeleteDecisionRelationResponse = {
  success: boolean;
  message: string;
  data: {
    relation: {
      id: number;
      type: DecisionRelationType;
      sourceDecisionId: number;
      targetDecisionId: number;
    };
  };
};

export type ImpactedDecision = {
  relationId: number;
  relationship: DecisionRelationType;
  depth: number;
  decision: Decision;
};

export type DecisionImpactResponse = {
  success: boolean;
  message: string;
  data: {
    rootDecision: Decision;
    impactCount: number;
    maxDepth: number;
    impactedDecisions: ImpactedDecision[];
  };
};
