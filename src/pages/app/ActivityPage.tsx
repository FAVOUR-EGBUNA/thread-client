import {
  Activity,
  ArrowLeft,
  ArrowRight,
  GitBranch,
  RefreshCw,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";

import { useWorkspaceActivity } from "../../hooks/useActivity";
import { getActiveWorkspaceId } from "../../lib/activeWorkspace";
import type { ActivityItem } from "../../types/activity";

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

function humanizeAction(action: string) {
  return action
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function getActivityIcon(action: string) {
  if (action.includes("MEMBER_ADDED")) {
    return <UserPlus size={16} />;
  }

  if (action.includes("MEMBER")) {
    return <Users size={16} />;
  }

  if (action.includes("RELATION") || action.includes("DECISION")) {
    return <GitBranch size={16} />;
  }

  return <Activity size={16} />;
}

function getDescription(item: ActivityItem) {
  const actor = item.actor?.name ?? "A workspace user";

  switch (item.action) {
    case "WORKSPACE_UPDATED":
      return `${actor} updated the workspace`;

    case "WORKSPACE_MEMBER_ADDED":
      return `${actor} added a workspace member`;

    case "WORKSPACE_MEMBER_ROLE_CHANGED":
      return `${actor} changed a member's role`;

    case "WORKSPACE_MEMBER_REMOVED":
      return `${actor} removed a workspace member`;

    case "PROJECT_CREATED":
      return `${actor} created a project`;

    case "PROJECT_UPDATED":
      return `${actor} updated a project`;

    case "PROJECT_DELETED":
      return `${actor} deleted a project`;

    case "DECISION_CREATED":
      return `${actor} created a decision`;

    case "DECISION_UPDATED":
      return `${actor} updated a decision`;

    case "DECISION_STATUS_CHANGED":
      return `${actor} changed a decision's status`;

    case "DECISION_RELATION_CREATED":
      return `${actor} connected two decisions`;

    case "DECISION_RELATION_DELETED":
      return `${actor} removed a decision relationship`;

    default:
      return `${actor} performed ${humanizeAction(item.action).toLowerCase()}`;
  }
}

export default function ActivityPage() {
  const activeWorkspaceId = getActiveWorkspaceId();

  const [page, setPage] = useState(1);

  const activityQuery = useWorkspaceActivity(activeWorkspaceId, page, 20);

  if (!activeWorkspaceId) {
    return (
      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
        <h1 className="text-2xl font-semibold text-zinc-950">Activity</h1>

        <p className="mt-2 text-sm text-zinc-500">
          Select a workspace to view its activity.
        </p>
      </main>
    );
  }

  if (activityQuery.isPending) {
    return (
      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
        <div className="flex min-h-[420px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-thread-700" />

            <p className="mt-4 text-sm text-zinc-500">Loading activity...</p>
          </div>
        </div>
      </main>
    );
  }

  if (activityQuery.isError) {
    return (
      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-medium text-red-800">
            We couldn't load workspace activity.
          </p>

          <button
            type="button"
            onClick={() => activityQuery.refetch()}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-red-700"
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      </main>
    );
  }

  const { activities, pagination } = activityQuery.data.data;

  return (
    <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-thread-600">
            Workspace trail
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-zinc-950">
            Activity
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            A chronological record of decisions, projects, relationships and
            workspace changes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => activityQuery.refetch()}
          disabled={activityQuery.isFetching}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={activityQuery.isFetching ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <section className="mt-8 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
          <div>
            <h2 className="font-semibold text-zinc-950">Activity trail</h2>

            <p className="mt-1 text-xs text-zinc-500">
              {pagination.total} recorded{" "}
              {pagination.total === 1 ? "event" : "events"}
            </p>
          </div>

          <div className="rounded-xl bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-500">
            Page {pagination.page}
            {pagination.totalPages > 0 ? ` of ${pagination.totalPages}` : ""}
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Activity size={28} className="mx-auto text-zinc-300" />

            <h3 className="mt-4 text-sm font-semibold text-zinc-900">
              No activity yet
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Workspace actions will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {activities.map((item) => (
              <div key={item.id} className="flex gap-4 px-6 py-5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-thread-50 text-thread-700">
                  {getActivityIcon(item.action)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-zinc-900">
                      {getDescription(item)}
                    </p>

                    <p className="shrink-0 text-xs text-zinc-400">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                      {humanizeAction(item.action)}
                    </span>

                    <span className="text-xs text-zinc-400">
                      {item.entityType}
                      {item.entityId ? ` #${item.entityId}` : ""}
                    </span>
                  </div>

                  {item.actor?.email && (
                    <p className="mt-2 text-xs text-zinc-400">
                      {item.actor.email}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-4">
            <button
              type="button"
              disabled={!pagination.hasPreviousPage}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-zinc-200 px-3 text-xs font-medium text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft size={14} />
              Previous
            </button>

            <p className="text-xs text-zinc-400">
              {pagination.total} total events
            </p>

            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((current) => current + 1)}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-zinc-200 px-3 text-xs font-medium text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
