import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Boxes,
  CircleDot,
  FolderPlus,
  RefreshCw,
  X,
} from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";

import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useProjects } from "../../hooks/useProjects";
import { ApiError } from "../../lib/api";
import { createProject } from "../../lib/projects";

const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Project name must be at least 2 characters")
    .max(120, "Project name must not exceed 120 characters"),

  description: z
    .string()
    .trim()
    .max(500, "Description must not exceed 500 characters"),
});

type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

export default function ProjectsPage() {
  const queryClient = useQueryClient();

  const { activeWorkspace } = useWorkspace();

  const workspaceId = activeWorkspace?.id ?? null;
  const projectsQuery = useProjects(workspaceId);

  const data = projectsQuery.data?.data;
  const projects = data?.projects ?? [];

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (values: CreateProjectFormValues) => {
      if (!workspaceId) {
        throw new Error("Workspace ID is required");
      }

      return createProject(workspaceId, {
        name: values.name.trim(),
        ...(values.description.trim()
          ? { description: values.description.trim() }
          : {}),
      });
    },

    onSuccess: async () => {
      reset();

      await queryClient.invalidateQueries({
        queryKey: ["projects", workspaceId],
      });

      (
        document.getElementById(
          "create-project-dialog",
        ) as HTMLDialogElement | null
      )?.close();
    },

    onError: (error) => {
      if (error instanceof ApiError) {
        setError("root", {
          message: error.message,
        });

        return;
      }

      setError("root", {
        message: "Something went wrong. Please try again.",
      });
    },
  });

  useEffect(() => {
    createProjectMutation.reset();
    reset();
  }, [workspaceId]);

  function openCreateProjectDialog() {
    createProjectMutation.reset();
    reset();

    (
      document.getElementById(
        "create-project-dialog",
      ) as HTMLDialogElement | null
    )?.showModal();
  }

  function closeCreateProjectDialog() {
    if (createProjectMutation.isPending) {
      return;
    }

    createProjectMutation.reset();
    reset();

    (
      document.getElementById(
        "create-project-dialog",
      ) as HTMLDialogElement | null
    )?.close();
  }

  function onSubmit(values: CreateProjectFormValues) {
    createProjectMutation.mutate(values);
  }

  if (!activeWorkspace) {
    return null;
  }

  return (
    <>
      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium text-thread-600">
              {activeWorkspace.name}
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-zinc-950">
              Projects
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
              Organize decisions around the work your team is building.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateProjectDialog}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-thread-950 px-4 text-sm font-medium text-white transition hover:opacity-90"
          >
            <FolderPlus size={16} />
            New project
          </button>
        </div>

        {projectsQuery.isPending && (
          <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-10">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-thread-700" />

                <p className="mt-4 text-sm text-zinc-500">
                  Loading projects...
                </p>
              </div>
            </div>
          </div>
        )}

        {projectsQuery.isError && (
          <div className="mt-10 rounded-2xl border border-red-200 bg-red-50/50 p-8">
            <div className="max-w-md">
              <h2 className="text-base font-semibold text-zinc-900">
                We couldn't load your projects.
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Something interrupted the request. Try loading the projects
                again.
              </p>

              <button
                type="button"
                onClick={() => projectsQuery.refetch()}
                className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
              >
                <RefreshCw size={15} />
                Try again
              </button>
            </div>
          </div>
        )}

        {projectsQuery.isSuccess && data && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-zinc-500">
                      Total projects
                    </p>

                    <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                      {data.projectCount}
                    </p>
                  </div>

                  <div className="flex size-10 items-center justify-center rounded-xl bg-thread-100 text-thread-700">
                    <Boxes size={18} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-zinc-500">
                      Your role
                    </p>

                    <p className="mt-2 text-2xl font-semibold capitalize tracking-tight text-zinc-950">
                      {data.currentUserRole.toLowerCase()}
                    </p>
                  </div>

                  <div className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                    <CircleDot size={18} />
                  </div>
                </div>
              </div>
            </div>

            {projects.length === 0 ? (
              <div className="mt-6 flex min-h-[360px] items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white/60 px-6 py-12">
                <div className="max-w-md text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-thread-100 text-thread-700">
                    <Boxes size={21} />
                  </div>

                  <h2 className="mt-5 text-lg font-semibold text-zinc-950">
                    No projects yet
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Projects give your decisions a shared context. Your first
                    project will become the starting point for recording and
                    connecting decisions in {activeWorkspace.name}.
                  </p>

                  <button
                    type="button"
                    onClick={openCreateProjectDialog}
                    className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-thread-950 px-5 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    <FolderPlus size={16} />
                    Create first project
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="border-b border-zinc-100 px-5 py-4 sm:px-6">
                  <h2 className="text-sm font-semibold text-zinc-900">
                    Workspace projects
                  </h2>

                  <p className="mt-1 text-xs text-zinc-500">
                    {data.projectCount}{" "}
                    {data.projectCount === 1 ? "project" : "projects"} in{" "}
                    {data.workspace.name}
                  </p>
                </div>

                <div className="divide-y divide-zinc-100">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      to={`/app/projects/${project.id}`}
                      className="group flex items-center gap-4 px-5 py-5 transition hover:bg-zinc-50/80 sm:px-6"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-thread-100 text-thread-700">
                        <Boxes size={17} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-semibold text-zinc-900">
                            {project.name}
                          </h3>

                          <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                            {project.decisionCount}{" "}
                            {project.decisionCount === 1
                              ? "decision"
                              : "decisions"}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-xs text-zinc-500">
                          {project.description || "No description"}
                        </p>
                      </div>

                      <ArrowRight
                        size={16}
                        className="shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-thread-600"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <dialog
        id="create-project-dialog"
        onCancel={(event) => {
          if (createProjectMutation.isPending) {
            event.preventDefault();
          }
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-3xl bg-transparent p-0 backdrop:bg-zinc-950/40"
      >
        <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-zinc-100 px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
                Create project
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Add a project to {activeWorkspace.name}.
              </p>
            </div>

            <button
              type="button"
              onClick={closeCreateProjectDialog}
              disabled={createProjectMutation.isPending}
              aria-label="Close"
              className="flex size-9 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6">
            <div>
              <label
                htmlFor="project-name"
                className="text-sm font-medium text-zinc-800"
              >
                Project name
              </label>

              <input
                id="project-name"
                type="text"
                autoFocus
                placeholder="e.g. Checkout redesign"
                disabled={createProjectMutation.isPending}
                {...register("name")}
                className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-thread-500 focus:ring-4 focus:ring-thread-100 disabled:bg-zinc-50"
              />

              {errors.name && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="mt-5">
              <label
                htmlFor="project-description"
                className="text-sm font-medium text-zinc-800"
              >
                Description
                <span className="ml-1 font-normal text-zinc-400">optional</span>
              </label>

              <textarea
                id="project-description"
                rows={4}
                placeholder="What is this project about?"
                disabled={createProjectMutation.isPending}
                {...register("description")}
                className="mt-2 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm leading-6 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-thread-500 focus:ring-4 focus:ring-thread-100 disabled:bg-zinc-50"
              />

              {errors.description && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            {errors.root?.message && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">{errors.root.message}</p>
              </div>
            )}

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeCreateProjectDialog}
                disabled={createProjectMutation.isPending}
                className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={createProjectMutation.isPending}
                className="inline-flex h-10 min-w-32 items-center justify-center gap-2 rounded-xl bg-thread-950 px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createProjectMutation.isPending && (
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}

                {createProjectMutation.isPending
                  ? "Creating..."
                  : "Create project"}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}
