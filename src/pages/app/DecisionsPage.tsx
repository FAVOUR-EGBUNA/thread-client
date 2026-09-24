import { useQueries } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  FileText,
  Filter,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useProjects } from "../../hooks/useProjects";
import { getProjectDecisions } from "../../lib/decisions";
import type { Decision, DecisionStatus } from "../../types/decision";

type WorkspaceDecision = Decision & {
  projectName: string;
};

type StatusFilter = "ALL" | DecisionStatus;

function formatStatus(status: DecisionStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
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
  }).format(date);
}

export default function DecisionsPage() {
  const { activeWorkspaceId } = useWorkspace();

  const projectsQuery = useProjects(activeWorkspaceId);

  const projects = useMemo(
    () => projectsQuery.data?.data.projects ?? [],
    [projectsQuery.data],
  );

  const decisionQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: ["decisions", "project", project.id],
      queryFn: () => getProjectDecisions(project.id),
      enabled: Boolean(activeWorkspaceId),
    })),
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [projectFilter, setProjectFilter] = useState<number | "ALL">("ALL");

  const decisions = useMemo<WorkspaceDecision[]>(() => {
    const combined: WorkspaceDecision[] = [];

    decisionQueries.forEach((query, index) => {
      const project = projects[index];

      if (!project || !query.data) {
        return;
      }

      query.data.data.decisions.forEach((decision) => {
        combined.push({
          ...decision,
          projectName: project.name,
        });
      });
    });

    return combined.sort((a, b) => {
      const aTime = new Date(a.updatedAt).getTime();
      const bTime = new Date(b.updatedAt).getTime();

      return bTime - aTime;
    });
  }, [decisionQueries, projects]);

  const filteredDecisions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return decisions.filter((decision) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        decision.title.toLowerCase().includes(normalizedSearch) ||
        decision.context.toLowerCase().includes(normalizedSearch) ||
        decision.decision.toLowerCase().includes(normalizedSearch) ||
        decision.projectName.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" || decision.status === statusFilter;

      const matchesProject =
        projectFilter === "ALL" || decision.projectId === projectFilter;

      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [decisions, projectFilter, search, statusFilter]);

  const counts = useMemo(
    () => ({
      total: decisions.length,
      proposed: decisions.filter((decision) => decision.status === "PROPOSED")
        .length,
      accepted: decisions.filter((decision) => decision.status === "ACCEPTED")
        .length,
      rejected: decisions.filter((decision) => decision.status === "REJECTED")
        .length,
      superseded: decisions.filter(
        (decision) => decision.status === "SUPERSEDED",
      ).length,
    }),
    [decisions],
  );

  const decisionsPending =
    projects.length > 0 && decisionQueries.some((query) => query.isPending);

  const decisionsError = decisionQueries.some((query) => query.isError);

  const isLoading = projectsQuery.isPending || decisionsPending;

  const hasFilters =
    search.trim().length > 0 ||
    statusFilter !== "ALL" ||
    projectFilter !== "ALL";

  async function refreshAll() {
    await projectsQuery.refetch();

    await Promise.all(decisionQueries.map((query) => query.refetch()));
  }

  if (isLoading) {
    return (
      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="flex min-h-[450px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-thread-700" />

            <p className="mt-4 text-sm text-zinc-500">
              Loading workspace decisions...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (projectsQuery.isError) {
    return (
      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8">
          <h1 className="font-semibold text-zinc-950">
            We couldn't load your workspace projects.
          </h1>

          <button
            type="button"
            onClick={() => projectsQuery.refetch()}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-thread-700"
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
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium text-thread-600">
            Decision intelligence
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-zinc-950">
            Decisions
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Review the decisions, reasoning and status changes across your
            workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refreshAll()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500">Total</p>

            <FileText size={16} className="text-zinc-400" />
          </div>

          <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
            {counts.total}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500">Proposed</p>

            <CircleDot size={16} className="text-amber-500" />
          </div>

          <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
            {counts.proposed}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500">Accepted</p>

            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>

          <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
            {counts.accepted}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500">Rejected</p>

            <XCircle size={16} className="text-red-500" />
          </div>

          <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
            {counts.rejected}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500">Superseded</p>

            <RefreshCw size={16} className="text-zinc-400" />
          </div>

          <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
            {counts.superseded}
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 p-5">
          <div className="flex flex-col gap-3 xl:flex-row">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search decisions..."
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm outline-none placeholder:text-zinc-400 focus:border-thread-500 focus:ring-4 focus:ring-thread-100"
              />
            </div>

            <div className="relative">
              <Filter
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="h-11 min-w-[170px] rounded-xl border border-zinc-200 bg-white pl-9 pr-8 text-sm text-zinc-700 outline-none"
              >
                <option value="ALL">All statuses</option>
                <option value="PROPOSED">Proposed</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
                <option value="SUPERSEDED">Superseded</option>
              </select>
            </div>

            <select
              value={projectFilter}
              onChange={(event) => {
                const value = event.target.value;

                setProjectFilter(value === "ALL" ? "ALL" : Number(value));
              }}
              className="h-11 min-w-[210px] rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none"
            >
              <option value="ALL">All projects</option>

              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {decisionsError && (
          <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">
            Some project decisions could not be loaded. Refresh to try again.
          </div>
        )}

        {decisions.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-thread-50 text-thread-700">
              <FileText size={21} />
            </div>

            <h2 className="mt-4 font-semibold text-zinc-900">
              No decisions yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
              Decisions recorded inside your workspace projects will appear
              here.
            </p>

            <Link
              to="/app/projects"
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-thread-700"
            >
              View projects
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : filteredDecisions.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Search size={24} className="mx-auto text-zinc-300" />

            <h2 className="mt-4 font-semibold text-zinc-900">
              No matching decisions
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              Try changing your search or filters.
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                  setProjectFilter("ALL");
                }}
                className="mt-5 text-sm font-medium text-thread-700"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {filteredDecisions.map((decision) => (
              <Link
                key={decision.id}
                to={`/app/decisions/${decision.id}`}
                className="group grid gap-4 px-5 py-5 transition hover:bg-zinc-50/80 lg:grid-cols-[minmax(0,1fr)_180px_130px_110px] lg:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-sm font-semibold text-zinc-900 group-hover:text-thread-700">
                      {decision.title}
                    </h2>

                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ring-inset lg:hidden ${statusStyles(
                        decision.status,
                      )}`}
                    >
                      {formatStatus(decision.status)}
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-2 max-w-3xl text-xs leading-5 text-zinc-500">
                    {decision.decision}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400 lg:hidden">
                    Project
                  </p>

                  <p className="mt-1 truncate text-xs font-medium text-zinc-600 lg:mt-0">
                    {decision.projectName}
                  </p>
                </div>

                <div className="hidden lg:block">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ring-inset ${statusStyles(
                      decision.status,
                    )}`}
                  >
                    {formatStatus(decision.status)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 lg:justify-end">
                  <span className="text-xs text-zinc-400">
                    {formatDate(decision.updatedAt)}
                  </span>

                  <ArrowRight
                    size={15}
                    className="text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-thread-600"
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {decisions.length > 0 && (
        <p className="mt-4 text-xs text-zinc-400">
          Showing {filteredDecisions.length} of {decisions.length} decisions
        </p>
      )}
    </main>
  );
}
