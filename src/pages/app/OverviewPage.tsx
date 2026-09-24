import { useQueries } from "@tanstack/react-query";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  FolderKanban,
  GitBranch,
  Network,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router";

import { useWorkspaceActivity } from "../../hooks/useActivity";
import { useProjects } from "../../hooks/useProjects";
import { useWorkspaces } from "../../hooks/useWorkspaces";
import { getActiveWorkspaceId } from "../../lib/activeWorkspace";
import { getProjectDecisions } from "../../lib/decisions";
import type { Decision, DecisionStatus } from "../../types/decision";

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatActivityTime(value: string) {
  const date = new Date(value);
  const now = new Date();

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const difference = now.getTime() - date.getTime();
  const minutes = Math.floor(difference / 60000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return formatDate(value);
}

function humanizeAction(action: string) {
  return action
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function statusLabel(status: DecisionStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function StatusBadge({ status }: { status: DecisionStatus }) {
  const styles: Record<DecisionStatus, string> = {
    ACCEPTED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    PROPOSED: "border-amber-200 bg-amber-50 text-amber-700",
    REJECTED: "border-red-200 bg-red-50 text-red-700",
    SUPERSEDED: "border-zinc-200 bg-zinc-100 text-zinc-600",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {statusLabel(status)}
    </span>
  );
}

export default function OverviewPage() {
  const activeWorkspaceId = getActiveWorkspaceId();

  const workspacesQuery = useWorkspaces();

  const projectsQuery = useProjects(activeWorkspaceId);

  const activityQuery = useWorkspaceActivity(activeWorkspaceId, 1, 5);

  const workspaces = workspacesQuery.data?.data.workspaces ?? [];

  const activeWorkspace = workspaces.find(
    (workspace) => workspace.id === activeWorkspaceId,
  );

  const projects = projectsQuery.data?.data.projects ?? [];

  const decisionQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: ["decisions", "project", project.id],
      queryFn: () => getProjectDecisions(project.id),
      enabled: Boolean(activeWorkspaceId),
    })),
  });

  const decisions = decisionQueries
    .flatMap((query) => query.data?.data.decisions ?? [])
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

  const recentDecisions = decisions.slice(0, 4);

  const activities = activityQuery.data?.data.activities ?? [];

  const acceptedCount = decisions.filter(
    (decision) => decision.status === "ACCEPTED",
  ).length;

  const proposedCount = decisions.filter(
    (decision) => decision.status === "PROPOSED",
  ).length;

  const decisionsLoading = decisionQueries.some((query) => query.isPending);

  const isLoading =
    workspacesQuery.isPending || projectsQuery.isPending || decisionsLoading;

  const hasError =
    workspacesQuery.isError ||
    projectsQuery.isError ||
    decisionQueries.some((query) => query.isError);

  if (!activeWorkspaceId) {
    return (
      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
        <h1 className="text-2xl font-semibold text-zinc-950">
          Workspace overview
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Select a workspace to view its decision intelligence.
        </p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
        <div className="flex min-h-[420px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-thread-700" />

            <p className="mt-4 text-sm text-zinc-500">
              Loading workspace intelligence...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (hasError) {
    return (
      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-medium text-red-800">
            We couldn't load the workspace overview.
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-red-700"
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-thread-600">
            <span className="size-1.5 rounded-full bg-thread-500" />
            {activeWorkspace?.name ?? "Workspace overview"}
          </div>

          <h1 className="text-3xl font-semibold tracking-[-0.035em] text-zinc-950">
            Decisions don't happen in isolation.
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            See what your team decided, why it decided it, and what could change
            next.
          </p>
        </div>

        <Link
          to="/app/projects"
          className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-thread-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-thread-900 sm:self-auto"
        >
          <Plus size={16} />
          New decision
        </Link>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500">Projects</p>
            <FolderKanban size={16} className="text-zinc-400" />
          </div>

          <p className="mt-3 text-3xl font-semibold text-zinc-950">
            {projects.length}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500">Decisions</p>
            <GitBranch size={16} className="text-zinc-400" />
          </div>

          <p className="mt-3 text-3xl font-semibold text-zinc-950">
            {decisions.length}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500">Accepted</p>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>

          <p className="mt-3 text-3xl font-semibold text-zinc-950">
            {acceptedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500">Proposed</p>
            <Network size={16} className="text-amber-500" />
          </div>

          <p className="mt-3 text-3xl font-semibold text-zinc-950">
            {proposedCount}
          </p>
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">
                Recent decisions
              </h2>

              <p className="mt-1 text-xs text-zinc-400">
                The latest thinking across your projects.
              </p>
            </div>

            <Link
              to="/app/decisions"
              className="flex items-center gap-1 text-xs font-medium text-thread-600"
            >
              View all
              <ArrowUpRight size={13} />
            </Link>
          </div>

          {recentDecisions.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <GitBranch size={25} className="mx-auto text-zinc-300" />

              <p className="mt-3 text-sm font-medium text-zinc-800">
                No decisions yet
              </p>

              <p className="mt-1 text-xs text-zinc-400">
                Create a decision inside one of your projects.
              </p>
            </div>
          ) : (
            recentDecisions.map((decision: Decision) => {
              const project = projects.find(
                (item) => item.id === decision.projectId,
              );

              return (
                <Link
                  key={decision.id}
                  to={`/app/decisions/${decision.id}`}
                  className="grid grid-cols-[1fr_auto] gap-4 border-b border-zinc-100 px-6 py-4 transition last:border-b-0 hover:bg-zinc-50/70 sm:grid-cols-[1fr_130px_80px]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        D-{decision.id}
                      </span>

                      <span className="size-1 rounded-full bg-zinc-300" />

                      <span className="truncate text-[11px] text-zinc-400">
                        {project?.name ?? "Project"}
                      </span>
                    </div>

                    <p className="mt-1.5 truncate text-sm font-medium text-zinc-800">
                      {decision.title}
                    </p>
                  </div>

                  <div className="hidden items-center sm:flex">
                    <StatusBadge status={decision.status} />
                  </div>

                  <div className="flex items-center justify-end text-xs text-zinc-400">
                    {formatDate(decision.updatedAt)}
                  </div>
                </Link>
              );
            })
          )}
        </div>

        <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">
                Activity trail
              </h2>

              <p className="mt-1 text-xs text-zinc-400">
                What changed recently.
              </p>
            </div>

            <Activity size={16} className="text-zinc-400" />
          </div>

          <div className="mt-6 space-y-5">
            {activityQuery.isPending ? (
              <p className="text-xs text-zinc-400">Loading activity...</p>
            ) : activities.length === 0 ? (
              <p className="text-xs text-zinc-400">
                No activity has been recorded yet.
              </p>
            ) : (
              activities.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-[10px] font-semibold text-zinc-600">
                    {item.actor?.name
                      ?.split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() ?? "TH"}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs leading-5 text-zinc-500">
                      <span className="font-medium text-zinc-800">
                        {item.actor?.name ?? "Workspace user"}
                      </span>{" "}
                      {humanizeAction(item.action).toLowerCase()}
                    </p>

                    <p className="mt-1 text-[10px] text-zinc-400">
                      {formatActivityTime(item.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <Link
            to="/app/activity"
            className="mt-6 block w-full rounded-xl border border-zinc-200 py-2.5 text-center text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
          >
            View activity
          </Link>
        </div>
      </section>

      <section className="mt-5 rounded-3xl bg-thread-950 p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium text-violet-300">
              Decision intelligence
            </p>

            <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-white">
              Trace what changes before changing a decision.
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Open the decision graph to explore relationships, then use Impact
              Mode on a decision to follow its dependency chain.
            </p>
          </div>

          <Link
            to="/app/graph"
            style={{ color: "#171528" }}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold transition hover:bg-zinc-100"
          >
            <span style={{ color: "#171528" }}>Open graph</span>

            <ArrowUpRight size={14} color="#171528" />
          </Link>
        </div>
      </section>
    </main>
  );
}
