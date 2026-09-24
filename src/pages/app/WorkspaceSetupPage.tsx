import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, GitBranch, Network, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ApiError } from "../../lib/api";
import { createWorkspace } from "../../lib/workspaces";

const workspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Workspace name must be at least 2 characters")
    .max(100, "Workspace name must not exceed 100 characters"),
});

type WorkspaceFormValues = z.infer<typeof workspaceSchema>;

export default function WorkspaceSetupPage() {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
    },
  });

  const createWorkspaceMutation = useMutation({
    mutationFn: (values: WorkspaceFormValues) => createWorkspace(values.name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["workspaces"],
      });
    },
  });

  const onSubmit = (values: WorkspaceFormValues) => {
    createWorkspaceMutation.mutate(values);
  };

  const serverError =
    createWorkspaceMutation.error instanceof ApiError
      ? createWorkspaceMutation.error.message
      : createWorkspaceMutation.error
        ? "Something went wrong. Please try again."
        : null;

  return (
    <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-5 py-12 sm:px-8 lg:px-10">
      <div className="w-full max-w-2xl">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-thread-100 text-thread-700">
            <GitBranch size={22} />
          </div>

          <p className="mt-6 text-xs font-medium text-thread-600">
            Your first workspace
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-4xl">
            Give your decisions a home.
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-zinc-500">
            A workspace brings your projects, decisions, relationships and team
            activity together in one place.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label
                htmlFor="workspace-name"
                className="mb-2 block text-xs font-medium text-zinc-700"
              >
                Workspace name
              </label>

              <input
                id="workspace-name"
                type="text"
                autoComplete="organization"
                placeholder="e.g. Acme Engineering"
                {...register("name")}
                className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-300 focus:border-thread-400 focus:ring-4 focus:ring-thread-100"
              />

              {errors.name && (
                <p className="mt-1.5 text-xs text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            {serverError && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={createWorkspaceMutation.isPending}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-thread-950 px-4 text-sm font-medium text-white transition hover:bg-thread-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createWorkspaceMutation.isPending
                ? "Creating workspace..."
                : "Create workspace"}

              {!createWorkspaceMutation.isPending && <ArrowRight size={16} />}
            </button>
          </form>
        </div>

        <div className="mx-auto mt-8 grid max-w-lg gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-4">
            <GitBranch size={16} className="text-thread-600" />
            <p className="mt-3 text-xs font-medium text-zinc-800">Decisions</p>
            <p className="mt-1 text-[11px] leading-5 text-zinc-500">
              Preserve what was decided and why.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-4">
            <Network size={16} className="text-thread-600" />
            <p className="mt-3 text-xs font-medium text-zinc-800">
              Dependencies
            </p>
            <p className="mt-1 text-[11px] leading-5 text-zinc-500">
              See what each decision affects.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-4">
            <Users size={16} className="text-thread-600" />
            <p className="mt-3 text-xs font-medium text-zinc-800">
              Team context
            </p>
            <p className="mt-1 text-[11px] leading-5 text-zinc-500">
              Keep reasoning visible to everyone.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
