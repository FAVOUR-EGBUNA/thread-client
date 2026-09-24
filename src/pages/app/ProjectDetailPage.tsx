import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CircleDot,
  GitBranch,
  Network,
  RefreshCw,
  X,
} from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import { z } from "zod";

import { useProjectDecisions } from "../../hooks/useDecisions";
import { useProject } from "../../hooks/useProjects";
import { ApiError } from "../../lib/api";
import { createDecision } from "../../lib/decisions";
import type { DecisionStatus } from "../../types/decision";

const createDecisionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Decision title must be at least 3 characters")
    .max(150, "Decision title must not exceed 150 characters"),

  context: z.string().trim().min(10, "Context must be at least 10 characters"),

  decision: z.string().trim().min(5, "Decision must be at least 5 characters"),

  reasoning: z.string().trim(),
});

type CreateDecisionFormValues = z.infer<typeof createDecisionSchema>;

function getStatusStyles(status: DecisionStatus) {
  switch (status) {
    case "ACCEPTED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

    case "REJECTED":
      return "bg-red-50 text-red-700 ring-red-600/20";

    case "SUPERSEDED":
      return "bg-zinc-100 text-zinc-600 ring-zinc-500/20";

    case "PROPOSED":
    default:
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
  }
}

function formatStatus(status: DecisionStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();

  const parsedProjectId = Number(projectId);

  const validProjectId =
    Number.isInteger(parsedProjectId) && parsedProjectId > 0
      ? parsedProjectId
      : null;

  const projectQuery = useProject(validProjectId);
  const decisionsQuery = useProjectDecisions(validProjectId);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateDecisionFormValues>({
    resolver: zodResolver(createDecisionSchema),
    defaultValues: {
      title: "",
      context: "",
      decision: "",
      reasoning: "",
    },
  });

  const createDecisionMutation = useMutation({
    mutationFn: (values: CreateDecisionFormValues) => {
      if (!validProjectId) {
        throw new Error("Project ID is required");
      }

      return createDecision(validProjectId, {
        title: values.title,
        context: values.context,
        decision: values.decision,
        ...(values.reasoning
          ? {
              reasoning: values.reasoning,
            }
          : {}),
      });
    },

    onSuccess: async () => {
      reset();

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["decisions", "project", validProjectId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["project", validProjectId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["projects"],
        }),
      ]);

      const dialog = document.getElementById(
        "create-decision-dialog",
      ) as HTMLDialogElement | null;

      dialog?.close();
    },

    onError: (error) => {
      if (error instanceof ApiError) {
        setError("root", {
          message: error.message,
        });

        return;
      }

      setError("root", {
        message: "Something went wrong while creating the decision.",
      });
    },
  });

  useEffect(() => {
    reset();
  }, [validProjectId, reset]);

  function openCreateDecisionDialog() {
    reset();

    const dialog = document.getElementById(
      "create-decision-dialog",
    ) as HTMLDialogElement | null;

    dialog?.showModal();
  }

  function closeCreateDecisionDialog() {
    if (createDecisionMutation.isPending) {
      return;
    }

    reset();

    const dialog = document.getElementById(
      "create-decision-dialog",
    ) as HTMLDialogElement | null;

    dialog?.close();
  }

  function onSubmit(values: CreateDecisionFormValues) {
    createDecisionMutation.mutate(values);
  }

  if (!validProjectId) {
    return (
      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <Link
          to="/app/projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
        >
          <ArrowLeft size={16} />
          Back to projects
        </Link>

        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50/50 p-8">
          <h1 className="text-lg font-semibold text-zinc-950">
            Invalid project
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            The project ID in this URL is not valid.
          </p>
        </div>
      </main>
    );
  }

  if (projectQuery.isPending) {
    return (
      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <Link
          to="/app/projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
        >
          <ArrowLeft size={16} />
          Back to projects
        </Link>

        <div className="mt-8 flex min-h-[320px] items-center justify-center rounded-2xl border border-zinc-200 bg-white">
          <div className="text-center">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-thread-700" />

            <p className="mt-4 text-sm text-zinc-500">Loading project...</p>
          </div>
        </div>
      </main>
    );
  }

  if (projectQuery.isError) {
    return (
      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <Link
          to="/app/projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
        >
          <ArrowLeft size={16} />
          Back to projects
        </Link>

        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50/50 p-8">
          <h1 className="text-lg font-semibold text-zinc-950">
            We couldn't load this project.
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            The project may not exist, or you may not have access to it.
          </p>

          <button
            type="button"
            onClick={() => projectQuery.refetch()}
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      </main>
    );
  }

  const project = projectQuery.data.data.project;
  const decisions = decisionsQuery.data?.data.decisions ?? [];

  const decisionCount =
    decisionsQuery.data?.data.decisionCount ?? project.decisionCount;

  const canCreateDecision =
    project.currentUserRole === "OWNER" || project.currentUserRole === "ADMIN";

  return (
    <>
      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <Link
          to="/app/projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
        >
          <ArrowLeft size={16} />
          Back to projects
        </Link>

        <div className="mt-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-medium text-thread-600">Project</p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-zinc-950 sm:text-4xl">
              {project.name}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
              {project.description || "No description has been added yet."}
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateDecisionDialog}
            disabled={!canCreateDecision}
            title={
              canCreateDecision
                ? "Create a new decision"
                : "Only workspace owners and admins can create decisions."
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-thread-950 px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CircleDot size={16} />
            New decision
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-zinc-500">Decisions</p>

            <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
              {decisionCount}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-zinc-500">Your role</p>

            <p className="mt-2 text-2xl font-semibold capitalize tracking-tight text-zinc-950">
              {project.currentUserRole.toLowerCase()}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
            <p className="text-xs font-medium text-zinc-500">Project ID</p>

            <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
              #{project.id}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <section className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-thread-100 text-thread-700">
                  <GitBranch size={17} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-zinc-950">
                    Decisions
                  </h2>

                  <p className="mt-0.5 text-xs text-zinc-500">
                    Decisions recorded for this project.
                  </p>
                </div>
              </div>
            </div>

            {decisionsQuery.isPending ? (
              <div className="flex min-h-[300px] items-center justify-center px-6 py-12">
                <div className="text-center">
                  <div className="mx-auto size-7 animate-spin rounded-full border-2 border-zinc-200 border-t-thread-700" />

                  <p className="mt-4 text-sm text-zinc-500">
                    Loading decisions...
                  </p>
                </div>
              </div>
            ) : decisionsQuery.isError ? (
              <div className="flex min-h-[300px] items-center justify-center px-6 py-12">
                <div className="max-w-sm text-center">
                  <h3 className="text-base font-semibold text-zinc-950">
                    We couldn't load the decisions.
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Try the request again without leaving this project.
                  </p>

                  <button
                    type="button"
                    onClick={() => decisionsQuery.refetch()}
                    className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <RefreshCw size={15} />
                    Try again
                  </button>
                </div>
              </div>
            ) : decisions.length === 0 ? (
              <div className="flex min-h-[300px] items-center justify-center px-6 py-12">
                <div className="max-w-sm text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
                    <CircleDot size={20} />
                  </div>

                  <h3 className="mt-4 text-base font-semibold text-zinc-950">
                    No decisions yet
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Decisions you record for {project.name} will appear here and
                    become part of its decision network.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {decisions.map((decision) => (
                  <Link
                    key={decision.id}
                    to={`/app/decisions/${decision.id}`}
                    className="group flex items-start justify-between gap-5 px-6 py-5 transition hover:bg-zinc-50/70"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-zinc-950">
                          {decision.title}
                        </h3>

                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${getStatusStyles(
                            decision.status,
                          )}`}
                        >
                          {formatStatus(decision.status)}
                        </span>
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">
                        {decision.context}
                      </p>
                    </div>

                    <ArrowRight
                      size={17}
                      className="mt-1 shrink-0 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-zinc-700"
                    />
                  </Link>
                ))}
              </div>
            )}
          </section>

          <aside className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <Network size={18} />
            </div>

            <h2 className="mt-5 text-base font-semibold text-zinc-950">
              Decision network
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              As decisions are connected, THREAD will show how changes to one
              decision can affect the rest of this project.
            </p>

            <button
              type="button"
              disabled
              className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-400"
            >
              View graph
            </button>
          </aside>
        </div>
      </main>

      <dialog
        id="create-decision-dialog"
        className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-3xl border border-zinc-200 bg-white p-0 shadow-2xl backdrop:bg-zinc-950/40"
        onCancel={(event) => {
          if (createDecisionMutation.isPending) {
            event.preventDefault();
          } else {
            reset();
          }
        }}
      >
        <div className="border-b border-zinc-100 px-6 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-thread-600">
                {project.name}
              </p>

              <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-950">
                Record a decision
              </h2>

              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Capture what was decided, the context behind it, and why it
                matters.
              </p>
            </div>

            <button
              type="button"
              onClick={closeCreateDecisionDialog}
              disabled={createDecisionMutation.isPending}
              aria-label="Close create decision dialog"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-40"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-h-[75vh] overflow-y-auto px-6 py-6 sm:px-7"
        >
          <div>
            <label
              htmlFor="decision-title"
              className="text-sm font-medium text-zinc-800"
            >
              Title
            </label>

            <input
              id="decision-title"
              type="text"
              placeholder="e.g. Use PostgreSQL as the primary database"
              {...register("title")}
              className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-thread-500 focus:ring-4 focus:ring-thread-100"
            />

            {errors.title && (
              <p className="mt-1.5 text-xs text-red-600">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="mt-5">
            <label
              htmlFor="decision-context"
              className="text-sm font-medium text-zinc-800"
            >
              Context
            </label>

            <p className="mt-1 text-xs text-zinc-500">
              What situation, problem, or constraint led to this decision?
            </p>

            <textarea
              id="decision-context"
              rows={4}
              placeholder="Describe the situation that required a decision..."
              {...register("context")}
              className="mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm leading-6 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-thread-500 focus:ring-4 focus:ring-thread-100"
            />

            {errors.context && (
              <p className="mt-1.5 text-xs text-red-600">
                {errors.context.message}
              </p>
            )}
          </div>

          <div className="mt-5">
            <label
              htmlFor="decision-outcome"
              className="text-sm font-medium text-zinc-800"
            >
              Decision
            </label>

            <p className="mt-1 text-xs text-zinc-500">
              State clearly what the team decided to do.
            </p>

            <textarea
              id="decision-outcome"
              rows={3}
              placeholder="Describe the decision..."
              {...register("decision")}
              className="mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm leading-6 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-thread-500 focus:ring-4 focus:ring-thread-100"
            />

            {errors.decision && (
              <p className="mt-1.5 text-xs text-red-600">
                {errors.decision.message}
              </p>
            )}
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="decision-reasoning"
                className="text-sm font-medium text-zinc-800"
              >
                Reasoning
              </label>

              <span className="text-xs text-zinc-400">Optional</span>
            </div>

            <p className="mt-1 text-xs text-zinc-500">
              Explain why this option was chosen over the alternatives.
            </p>

            <textarea
              id="decision-reasoning"
              rows={4}
              placeholder="Why was this the right decision?"
              {...register("reasoning")}
              className="mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm leading-6 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-thread-500 focus:ring-4 focus:ring-thread-100"
            />

            {errors.reasoning && (
              <p className="mt-1.5 text-xs text-red-600">
                {errors.reasoning.message}
              </p>
            )}
          </div>

          {errors.root?.message && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errors.root.message}
            </div>
          )}

          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-zinc-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeCreateDecisionDialog}
              disabled={createDecisionMutation.isPending}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={createDecisionMutation.isPending}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-thread-950 px-5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createDecisionMutation.isPending
                ? "Recording..."
                : "Record decision"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
