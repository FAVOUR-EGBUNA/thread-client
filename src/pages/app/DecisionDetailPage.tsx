import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Clock3,
  GitBranch,
  Network,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { z } from "zod";

import {
  useDecision,
  useDecisionHistory,
  useDecisionImpact,
  useProjectDecisions,
} from "../../hooks/useDecisions";
import { ApiError } from "../../lib/api";
import {
  createDecisionRelation,
  deleteDecisionRelation,
  updateDecision,
  updateDecisionStatus,
} from "../../lib/decisions";
import type {
  Decision,
  DecisionRelationType,
  DecisionStatus,
} from "../../types/decision";

const editDecisionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Decision title must be at least 3 characters")
    .max(150, "Decision title must not exceed 150 characters"),
  context: z.string().trim().min(10, "Context must be at least 10 characters"),
  decision: z.string().trim().min(5, "Decision must be at least 5 characters"),
  reasoning: z.string().trim(),
});

type EditDecisionValues = z.infer<typeof editDecisionSchema>;

const statuses: DecisionStatus[] = [
  "PROPOSED",
  "ACCEPTED",
  "REJECTED",
  "SUPERSEDED",
];

const relationTypes: DecisionRelationType[] = [
  "DEPENDS_ON",
  "AFFECTS",
  "SUPPORTS",
  "CONFLICTS_WITH",
  "SUPERSEDES",
  "RELATED_TO",
];

function formatStatus(status: DecisionStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatRelationType(type: DecisionRelationType) {
  return type
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function statusStyles(status: DecisionStatus) {
  switch (status) {
    case "ACCEPTED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

    case "REJECTED":
      return "bg-red-50 text-red-700 ring-red-600/20";

    case "SUPERSEDED":
      return "bg-zinc-100 text-zinc-600 ring-zinc-500/20";

    default:
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
  }
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function DecisionDetailPage() {
  const { decisionId } = useParams();
  const queryClient = useQueryClient();

  const parsedDecisionId = Number(decisionId);

  const validDecisionId =
    Number.isInteger(parsedDecisionId) && parsedDecisionId > 0
      ? parsedDecisionId
      : null;

  const decisionQuery = useDecision(validDecisionId);
  const historyQuery = useDecisionHistory(validDecisionId);

  const decision = decisionQuery.data?.data.decision;

  const projectId = decision?.projectId ?? null;

  const projectDecisionsQuery = useProjectDecisions(projectId);

  const [isEditing, setIsEditing] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);

  const [showRelationshipForm, setShowRelationshipForm] = useState(false);

  const [targetDecisionId, setTargetDecisionId] = useState("");

  const [relationType, setRelationType] =
    useState<DecisionRelationType>("DEPENDS_ON");

  const [impactMode, setImpactMode] = useState(false);

  const impactQuery = useDecisionImpact(validDecisionId, impactMode);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditDecisionValues>({
    resolver: zodResolver(editDecisionSchema),
    defaultValues: {
      title: "",
      context: "",
      decision: "",
      reasoning: "",
    },
  });

  useEffect(() => {
    if (!decision) {
      return;
    }

    reset({
      title: decision.title,
      context: decision.context,
      decision: decision.decision,
      reasoning: decision.reasoning ?? "",
    });
  }, [decision, reset]);

  const projectDecisions = projectDecisionsQuery.data?.data.decisions ?? [];

  const otherDecisions = useMemo(
    () => projectDecisions.filter((item) => item.id !== validDecisionId),
    [projectDecisions, validDecisionId],
  );

  const decisionMap = useMemo(
    () => new Map(projectDecisions.map((item) => [item.id, item])),
    [projectDecisions],
  );

  async function refreshDecisionData(currentDecision: Decision) {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["decision", currentDecision.id],
      }),
      queryClient.invalidateQueries({
        queryKey: ["decision", currentDecision.id, "history"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["decision", currentDecision.id, "impact"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["decisions", "project", currentDecision.projectId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["project", currentDecision.projectId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["project", currentDecision.projectId, "graph"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["projects"],
      }),
    ]);
  }

  const editMutation = useMutation({
    mutationFn: (values: EditDecisionValues) => {
      if (!validDecisionId) {
        throw new Error("Decision ID is required");
      }

      return updateDecision(validDecisionId, {
        title: values.title,
        context: values.context,
        decision: values.decision,
        reasoning: values.reasoning,
      });
    },

    onSuccess: async (response) => {
      setActionError(null);
      setIsEditing(false);

      await refreshDecisionData(response.data.decision);
    },

    onError: (error) => {
      setActionError(
        error instanceof ApiError
          ? error.message
          : "Something went wrong while updating the decision.",
      );
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: DecisionStatus) => {
      if (!validDecisionId) {
        throw new Error("Decision ID is required");
      }

      return updateDecisionStatus(validDecisionId, status);
    },

    onSuccess: async (response) => {
      setActionError(null);

      await refreshDecisionData(response.data.decision);
    },

    onError: (error) => {
      setActionError(
        error instanceof ApiError
          ? error.message
          : "Something went wrong while changing the status.",
      );
    },
  });

  const relationshipMutation = useMutation({
    mutationFn: () => {
      if (!validDecisionId) {
        throw new Error("Decision ID is required");
      }

      const targetId = Number(targetDecisionId);

      if (!Number.isInteger(targetId) || targetId <= 0) {
        throw new Error("Choose a target decision.");
      }

      return createDecisionRelation(validDecisionId, {
        targetDecisionId: targetId,
        type: relationType,
      });
    },

    onSuccess: async () => {
      setActionError(null);
      setShowRelationshipForm(false);
      setTargetDecisionId("");
      setRelationType("DEPENDS_ON");

      if (decision) {
        await refreshDecisionData(decision);
      }
    },

    onError: (error) => {
      setActionError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Something went wrong while creating the relationship.",
      );
    },
  });

  const deleteRelationshipMutation = useMutation({
    mutationFn: (relationId: number) => deleteDecisionRelation(relationId),

    onSuccess: async () => {
      setActionError(null);

      if (decision) {
        await refreshDecisionData(decision);
      }
    },

    onError: (error) => {
      setActionError(
        error instanceof ApiError
          ? error.message
          : "Something went wrong while deleting the relationship.",
      );
    },
  });

  if (!validDecisionId) {
    return (
      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
        <h1 className="text-xl font-semibold text-zinc-950">
          Invalid decision
        </h1>
      </main>
    );
  }

  if (decisionQuery.isPending) {
    return (
      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-thread-700" />

            <p className="mt-4 text-sm text-zinc-500">Loading decision...</p>
          </div>
        </div>
      </main>
    );
  }

  if (decisionQuery.isError || !decision) {
    return (
      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-7">
          <h1 className="font-semibold text-zinc-950">
            We couldn't load this decision.
          </h1>

          <button
            type="button"
            onClick={() => decisionQuery.refetch()}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium"
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      </main>
    );
  }

  const relationships = decisionQuery.data.data.relationships;

  const impactData = impactQuery.data?.data;

  return (
    <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <Link
        to={`/app/projects/${decision.projectId}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft size={16} />
        Back to project
      </Link>

      <div className="mt-7 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-medium text-thread-600">
              Decision #{decision.id}
            </p>

            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${statusStyles(
                decision.status,
              )}`}
            >
              {formatStatus(decision.status)}
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-zinc-950 sm:text-4xl">
            {decision.title}
          </h1>

          <p className="mt-3 text-xs text-zinc-400">
            Updated {formatDate(decision.updatedAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setActionError(null);
              setImpactMode((current) => !current);
            }}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium shadow-sm ${
              impactMode
                ? "border-thread-300 bg-thread-50 text-thread-700"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            <Zap size={15} />
            {impactMode ? "Exit Impact Mode" : "Impact Mode"}
          </button>

          <button
            type="button"
            onClick={() => {
              setActionError(null);
              setIsEditing((current) => !current);
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
          >
            {isEditing ? <X size={15} /> : <Pencil size={15} />}

            {isEditing ? "Cancel edit" : "Edit decision"}
          </button>
        </div>
      </div>

      {actionError && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {impactMode && (
        <section className="mt-8 overflow-hidden rounded-3xl border border-thread-200 bg-thread-50/40">
          <div className="border-b border-thread-100 px-6 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Zap size={17} className="text-thread-700" />

                  <h2 className="font-semibold text-zinc-950">Impact Mode</h2>
                </div>

                <p className="mt-1 text-sm text-zinc-500">
                  See which decisions depend on this decision.
                </p>
              </div>

              {impactData && (
                <div className="flex gap-3">
                  <div className="rounded-xl bg-white px-4 py-2 text-center shadow-sm">
                    <p className="text-lg font-semibold text-zinc-950">
                      {impactData.impactCount}
                    </p>

                    <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                      Impacted
                    </p>
                  </div>

                  <div className="rounded-xl bg-white px-4 py-2 text-center shadow-sm">
                    <p className="text-lg font-semibold text-zinc-950">
                      {impactData.maxDepth}
                    </p>

                    <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                      Max depth
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {impactQuery.isPending ? (
              <p className="text-sm text-zinc-500">Calculating impact...</p>
            ) : impactQuery.isError ? (
              <div>
                <p className="text-sm text-red-700">
                  Unable to calculate impact.
                </p>

                <button
                  type="button"
                  onClick={() => impactQuery.refetch()}
                  className="mt-3 text-sm font-medium text-thread-700"
                >
                  Try again
                </button>
              </div>
            ) : !impactData || impactData.impactCount === 0 ? (
              <div className="py-4 text-center">
                <Network size={24} className="mx-auto text-zinc-300" />

                <p className="mt-3 text-sm font-medium text-zinc-800">
                  No downstream impact
                </p>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  No decisions currently depend on this decision.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {impactData.impactedDecisions.map((item) => (
                  <Link
                    key={`${item.relationId}-${item.decision.id}`}
                    to={`/app/decisions/${item.decision.id}`}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-thread-100 bg-white p-4 transition hover:border-thread-300"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-zinc-900">
                          {item.decision.title}
                        </p>

                        <span className="rounded-full bg-thread-50 px-2 py-1 text-[10px] font-medium text-thread-700">
                          Depth {item.depth}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-zinc-500">
                        {formatRelationType(item.relationship)}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium ring-1 ring-inset ${statusStyles(
                        item.decision.status,
                      )}`}
                    >
                      {formatStatus(item.decision.status)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {isEditing ? (
        <form
          onSubmit={handleSubmit((values) => editMutation.mutate(values))}
          className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="text-sm font-medium text-zinc-800">Title</label>

            <input
              {...register("title")}
              className="mt-2 h-11 w-full rounded-xl border border-zinc-200 px-3.5 text-sm outline-none focus:border-thread-500 focus:ring-4 focus:ring-thread-100"
            />

            {errors.title && (
              <p className="mt-1 text-xs text-red-600">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="mt-5">
            <label className="text-sm font-medium text-zinc-800">Context</label>

            <textarea
              rows={4}
              {...register("context")}
              className="mt-2 w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm outline-none focus:border-thread-500 focus:ring-4 focus:ring-thread-100"
            />

            {errors.context && (
              <p className="mt-1 text-xs text-red-600">
                {errors.context.message}
              </p>
            )}
          </div>

          <div className="mt-5">
            <label className="text-sm font-medium text-zinc-800">
              Decision
            </label>

            <textarea
              rows={3}
              {...register("decision")}
              className="mt-2 w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm outline-none focus:border-thread-500 focus:ring-4 focus:ring-thread-100"
            />

            {errors.decision && (
              <p className="mt-1 text-xs text-red-600">
                {errors.decision.message}
              </p>
            )}
          </div>

          <div className="mt-5">
            <label className="text-sm font-medium text-zinc-800">
              Reasoning
            </label>

            <textarea
              rows={4}
              {...register("reasoning")}
              className="mt-2 w-full rounded-xl border border-zinc-200 px-3.5 py-3 text-sm outline-none focus:border-thread-500 focus:ring-4 focus:ring-thread-100"
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={editMutation.isPending}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-thread-950 px-5 text-sm font-medium text-white disabled:opacity-50"
            >
              <Check size={16} />

              {editMutation.isPending ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_380px]">
          <div className="space-y-5">
            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Context
              </p>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-700">
                {decision.context}
              </p>
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Decision
              </p>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-700">
                {decision.decision}
              </p>
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Reasoning
              </p>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-700">
                {decision.reasoning || "No reasoning was recorded."}
              </p>
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <GitBranch size={17} className="text-thread-600" />

                    <h2 className="text-sm font-semibold text-zinc-950">
                      Decision relationships
                    </h2>
                  </div>

                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Connect this decision to other decisions in the same
                    project.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActionError(null);
                    setShowRelationshipForm((current) => !current);
                  }}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-thread-950 px-3.5 text-xs font-medium text-white"
                >
                  {showRelationshipForm ? <X size={14} /> : <Plus size={14} />}

                  {showRelationshipForm ? "Cancel" : "Add relationship"}
                </button>
              </div>

              {showRelationshipForm && (
                <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  {projectDecisionsQuery.isPending ? (
                    <p className="text-sm text-zinc-500">
                      Loading project decisions...
                    </p>
                  ) : projectDecisionsQuery.isError ? (
                    <p className="text-sm text-red-600">
                      Unable to load project decisions.
                    </p>
                  ) : otherDecisions.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                      There are no other decisions in this project yet.
                    </p>
                  ) : (
                    <>
                      <label className="text-xs font-medium text-zinc-700">
                        This decision
                      </label>

                      <div className="mt-2 rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm font-medium text-zinc-800">
                        {decision.title}
                      </div>

                      <label className="mt-4 block text-xs font-medium text-zinc-700">
                        Relationship
                      </label>

                      <select
                        value={relationType}
                        onChange={(event) =>
                          setRelationType(
                            event.target.value as DecisionRelationType,
                          )
                        }
                        className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none"
                      >
                        {relationTypes.map((type) => (
                          <option key={type} value={type}>
                            {formatRelationType(type)}
                          </option>
                        ))}
                      </select>

                      <label className="mt-4 block text-xs font-medium text-zinc-700">
                        Target decision
                      </label>

                      <select
                        value={targetDecisionId}
                        onChange={(event) =>
                          setTargetDecisionId(event.target.value)
                        }
                        className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none"
                      >
                        <option value="">Choose a decision</option>

                        {otherDecisions.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.title}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        disabled={
                          !targetDecisionId || relationshipMutation.isPending
                        }
                        onClick={() => relationshipMutation.mutate()}
                        className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-thread-950 px-4 text-sm font-medium text-white disabled:opacity-50"
                      >
                        <GitBranch size={15} />

                        {relationshipMutation.isPending
                          ? "Connecting..."
                          : "Create relationship"}
                      </button>
                    </>
                  )}
                </div>
              )}

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                    Outgoing ({relationships.outgoing.length})
                  </p>

                  {relationships.outgoing.length === 0 ? (
                    <p className="mt-3 text-sm text-zinc-400">
                      No outgoing relationships.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {relationships.outgoing.map((relation) => {
                        const target = decisionMap.get(
                          relation.targetDecisionId,
                        );

                        return (
                          <div
                            key={relation.id}
                            className="flex items-start justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3"
                          >
                            <div className="min-w-0">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-thread-600">
                                {formatRelationType(relation.type)}
                              </p>

                              <Link
                                to={`/app/decisions/${relation.targetDecisionId}`}
                                className="mt-1 block truncate text-xs font-medium text-zinc-800 hover:text-thread-700"
                              >
                                {target?.title ??
                                  `Decision #${relation.targetDecisionId}`}
                              </Link>
                            </div>

                            <button
                              type="button"
                              title="Delete relationship"
                              disabled={deleteRelationshipMutation.isPending}
                              onClick={() =>
                                deleteRelationshipMutation.mutate(relation.id)
                              }
                              className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                    Incoming ({relationships.incoming.length})
                  </p>

                  {relationships.incoming.length === 0 ? (
                    <p className="mt-3 text-sm text-zinc-400">
                      No incoming relationships.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {relationships.incoming.map((relation) => {
                        const source = decisionMap.get(
                          relation.sourceDecisionId,
                        );

                        return (
                          <div
                            key={relation.id}
                            className="rounded-xl border border-zinc-100 bg-zinc-50 p-3"
                          >
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-thread-600">
                              {formatRelationType(relation.type)}
                            </p>

                            <Link
                              to={`/app/decisions/${relation.sourceDecisionId}`}
                              className="mt-1 block truncate text-xs font-medium text-zinc-800 hover:text-thread-700"
                            >
                              {source?.title ??
                                `Decision #${relation.sourceDecisionId}`}
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-5">
            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-zinc-950">Status</h2>

              <div className="mt-4 grid gap-2">
                {statuses.map((status) => {
                  const active = status === decision.status;

                  return (
                    <button
                      key={status}
                      type="button"
                      disabled={active || statusMutation.isPending}
                      onClick={() => statusMutation.mutate(status)}
                      className={`flex h-10 items-center justify-between rounded-xl border px-3 text-sm font-medium transition ${
                        active
                          ? "border-thread-200 bg-thread-50 text-thread-700"
                          : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                      } disabled:cursor-not-allowed`}
                    >
                      {formatStatus(status)}

                      {active && <Check size={14} />}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <Clock3 size={16} className="text-zinc-400" />

                <h2 className="text-sm font-semibold text-zinc-950">
                  Status history
                </h2>
              </div>

              {historyQuery.isPending ? (
                <p className="mt-4 text-sm text-zinc-500">Loading history...</p>
              ) : historyQuery.isError ? (
                <button
                  type="button"
                  onClick={() => historyQuery.refetch()}
                  className="mt-4 text-sm font-medium text-thread-700"
                >
                  Retry history
                </button>
              ) : historyQuery.data.data.history.length === 0 ? (
                <p className="mt-4 text-sm leading-6 text-zinc-500">
                  No status changes yet.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {[...historyQuery.data.data.history]
                    .reverse()
                    .map((entry) => (
                      <div
                        key={entry.id}
                        className="border-l-2 border-zinc-200 pl-3"
                      >
                        <p className="text-xs font-medium text-zinc-700">
                          {formatStatus(entry.previousStatus)} →{" "}
                          {formatStatus(entry.newStatus)}
                        </p>

                        <p className="mt-1 text-[11px] text-zinc-400">
                          {formatDate(entry.createdAt)}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <GitBranch size={16} className="text-zinc-400" />

                <h2 className="text-sm font-semibold text-zinc-950">
                  Relationships
                </h2>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-zinc-50 p-3">
                  <p className="text-xs text-zinc-500">Outgoing</p>

                  <p className="mt-1 text-lg font-semibold text-zinc-950">
                    {relationships.outgoing.length}
                  </p>
                </div>

                <div className="rounded-xl bg-zinc-50 p-3">
                  <p className="text-xs text-zinc-500">Incoming</p>

                  <p className="mt-1 text-lg font-semibold text-zinc-950">
                    {relationships.incoming.length}
                  </p>
                </div>
              </div>

              <Link
                to={`/app/graph?project=${decision.projectId}`}
                className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-thread-700"
              >
                <Network size={14} />
                Open decision graph
              </Link>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}
