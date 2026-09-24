import { GitBranch, Network, RefreshCw } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import DecisionGraph, {
  type GraphDecisionEdge,
  type GraphDecisionNode,
} from "../../components/decisions/DecisionGraph";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useProjects } from "../../hooks/useProjects";
import { api } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";

type ProjectGraphResponse = {
  success: boolean;
  message: string;
  data: {
    project: {
      id: number;
      name: string;
      description: string | null;
    };
    nodeCount: number;
    edgeCount: number;
    nodes: GraphDecisionNode[];
    edges: GraphDecisionEdge[];
  };
};

function getProjectGraph(projectId: number) {
  const token = getAccessToken();

  return api<ProjectGraphResponse>(`/projects/${projectId}/graph`, {
    token,
  });
}

export default function GraphPage() {
  const { activeWorkspaceId } = useWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();

  const projectsQuery = useProjects(activeWorkspaceId);

  const projects = projectsQuery.data?.data.projects ?? [];

  const projectIdFromUrl = Number(searchParams.get("project"));

  const hasValidProjectInUrl =
    Number.isInteger(projectIdFromUrl) &&
    projectIdFromUrl > 0 &&
    projects.some((project) => project.id === projectIdFromUrl);

  const selectedProjectId = hasValidProjectInUrl
    ? projectIdFromUrl
    : (projects.at(-1)?.id ?? null);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId),
    [projects, selectedProjectId],
  );

  useEffect(() => {
    if (
      projectsQuery.isSuccess &&
      selectedProjectId !== null &&
      !hasValidProjectInUrl
    ) {
      setSearchParams(
        {
          project: String(selectedProjectId),
        },
        {
          replace: true,
        },
      );
    }
  }, [
    projectsQuery.isSuccess,
    selectedProjectId,
    hasValidProjectInUrl,
    setSearchParams,
  ]);

  const graphQuery = useQuery({
    queryKey: ["project", selectedProjectId, "graph"],
    queryFn: () => {
      if (!selectedProjectId) {
        throw new Error("Project ID is required");
      }

      return getProjectGraph(selectedProjectId);
    },
    enabled: selectedProjectId !== null,
  });

  return (
    <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Network size={15} className="text-thread-600" />

            <p className="text-xs font-medium text-thread-600">
              Decision intelligence
            </p>
          </div>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-zinc-950">
            Decision graph
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Explore how decisions in a project connect to and depend on one
            another.
          </p>
        </div>

        {projects.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="graph-project"
              className="text-xs font-medium text-zinc-500"
            >
              Project
            </label>

            <select
              id="graph-project"
              value={selectedProjectId ?? ""}
              onChange={(event) => {
                setSearchParams({
                  project: event.target.value,
                });
              }}
              className="h-11 min-w-[260px] rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 outline-none transition focus:border-thread-400 focus:ring-4 focus:ring-thread-100"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {projectsQuery.isPending ? (
        <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-8 text-sm text-zinc-500">
          Loading projects...
        </div>
      ) : projectsQuery.isError ? (
        <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-7">
          <p className="font-medium text-zinc-900">
            We couldn't load your projects.
          </p>

          <button
            type="button"
            onClick={() => projectsQuery.refetch()}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-thread-700"
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-zinc-200 bg-white p-10 text-center">
          <GitBranch className="mx-auto text-zinc-300" size={28} />

          <h2 className="mt-4 font-semibold text-zinc-900">No projects yet</h2>

          <p className="mt-2 text-sm text-zinc-500">
            Create a project before opening the decision graph.
          </p>

          <Link
            to="/app/projects"
            className="mt-5 inline-flex text-sm font-medium text-thread-700"
          >
            Go to projects
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                {selectedProject?.name}
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                {graphQuery.data?.data.nodeCount ?? 0} decisions {"\u00B7"}{" "}
                {graphQuery.data?.data.edgeCount ?? 0} relationships
              </p>
            </div>

            <button
              type="button"
              disabled={graphQuery.isFetching}
              onClick={() => graphQuery.refetch()}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={graphQuery.isFetching ? "animate-spin" : ""}
              />
              Refresh graph
            </button>
          </div>

          <div className="mt-5">
            {graphQuery.isPending ? (
              <div className="flex h-[520px] items-center justify-center rounded-3xl border border-zinc-200 bg-white">
                <div className="text-center">
                  <div className="mx-auto size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-thread-700" />

                  <p className="mt-4 text-sm text-zinc-500">
                    Building decision graph...
                  </p>
                </div>
              </div>
            ) : graphQuery.isError ? (
              <div className="flex h-[520px] items-center justify-center rounded-3xl border border-red-200 bg-red-50">
                <div className="text-center">
                  <p className="font-medium text-zinc-900">
                    We couldn't load the graph.
                  </p>

                  <button
                    type="button"
                    onClick={() => graphQuery.refetch()}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-thread-700"
                  >
                    <RefreshCw size={15} />
                    Try again
                  </button>
                </div>
              </div>
            ) : (
              <DecisionGraph
                nodes={graphQuery.data.data.nodes}
                edges={graphQuery.data.data.edges}
              />
            )}
          </div>
        </>
      )}
    </main>
  );
}
