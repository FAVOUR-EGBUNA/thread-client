import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, LockKeyhole, Save, Settings } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useWorkspaces } from "../../hooks/useWorkspaces";
import { ApiError } from "../../lib/api";
import { getActiveWorkspaceId } from "../../lib/activeWorkspace";
import { updateWorkspace } from "../../lib/workspaces";

export default function SettingsPage() {
  const activeWorkspaceId = getActiveWorkspaceId();

  const queryClient = useQueryClient();

  const workspacesQuery = useWorkspaces();

  const workspaces = workspacesQuery.data?.data.workspaces ?? [];

  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId),
    [workspaces, activeWorkspaceId],
  );

  const [name, setName] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (activeWorkspace) {
      setName(activeWorkspace.name);
    }
  }, [activeWorkspace]);

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!activeWorkspaceId) {
        throw new Error("Workspace ID is required");
      }

      return updateWorkspace(activeWorkspaceId, {
        name: name.trim(),
      });
    },

    onSuccess: async (response) => {
      setErrorMessage(null);
      setSuccessMessage(response.message);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["workspaces"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["activity", activeWorkspaceId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["members", activeWorkspaceId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["projects", activeWorkspaceId],
        }),
      ]);
    },

    onError: (error) => {
      setSuccessMessage(null);

      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Workspace could not be updated.",
      );
    },
  });

  if (!activeWorkspaceId) {
    return (
      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
        <h1 className="text-2xl font-semibold text-zinc-950">Settings</h1>

        <p className="mt-2 text-sm text-zinc-500">
          Select a workspace to manage its settings.
        </p>
      </main>
    );
  }

  if (workspacesQuery.isPending) {
    return (
      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
        <div className="flex min-h-[420px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-thread-700" />

            <p className="mt-4 text-sm text-zinc-500">Loading settings...</p>
          </div>
        </div>
      </main>
    );
  }

  if (workspacesQuery.isError || !activeWorkspace) {
    return (
      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Workspace settings could not be loaded.
        </div>
      </main>
    );
  }

  const isOwner = activeWorkspace.role === "OWNER";

  const trimmedName = name.trim();

  const nameChanged = trimmedName !== activeWorkspace.name;

  const validName = trimmedName.length >= 2 && trimmedName.length <= 100;

  const canSave =
    isOwner && nameChanged && validName && !updateMutation.isPending;

  return (
    <main className="mx-auto max-w-[1100px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-thread-600">
          <Settings size={14} />
          Workspace
        </div>

        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-zinc-950">
          Settings
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Manage your workspace configuration and access information.
        </p>
      </div>

      {successMessage && (
        <div className="mt-7 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={16} />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mt-7 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <section className="mt-8 rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-950">General</h2>

          <p className="mt-1 text-xs text-zinc-500">
            Basic information about this workspace.
          </p>
        </div>

        <div className="p-6">
          <div className="max-w-xl">
            <label
              htmlFor="workspace-name"
              className="text-xs font-medium text-zinc-700"
            >
              Workspace name
            </label>

            <input
              id="workspace-name"
              type="text"
              value={name}
              disabled={!isOwner}
              maxLength={100}
              onChange={(event) => {
                setName(event.target.value);
                setSuccessMessage(null);
                setErrorMessage(null);
              }}
              className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-thread-500 focus:ring-4 focus:ring-thread-100 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500"
            />

            <div className="mt-2 flex items-center justify-between gap-4">
              <p className="text-xs text-zinc-400">2–100 characters.</p>

              <p className="text-xs text-zinc-400">{trimmedName.length}/100</p>
            </div>

            {!isOwner && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-zinc-50 p-3 text-xs leading-5 text-zinc-500">
                <LockKeyhole size={14} className="mt-0.5 shrink-0" />
                Only the workspace owner can rename this workspace.
              </div>
            )}

            <button
              type="button"
              disabled={!canSave}
              onClick={() => updateMutation.mutate()}
              className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-thread-950 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Save size={15} />

              {updateMutation.isPending ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-5">
          <h2 className="text-sm font-semibold text-zinc-950">
            Workspace details
          </h2>

          <p className="mt-1 text-xs text-zinc-500">
            System information for this workspace.
          </p>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-zinc-400">Workspace ID</p>

            <p className="mt-1 text-sm font-medium text-zinc-800">
              {activeWorkspace.id}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-400">Slug</p>

            <p className="mt-1 break-all text-sm font-medium text-zinc-800">
              {activeWorkspace.slug}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-400">Your role</p>

            <p className="mt-1 text-sm font-medium text-zinc-800">
              {activeWorkspace.role}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-400">Projects</p>

            <p className="mt-1 text-sm font-medium text-zinc-800">
              {activeWorkspace.projectCount}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-400">Members</p>

            <p className="mt-1 text-sm font-medium text-zinc-800">
              {activeWorkspace.memberCount}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-400">Created</p>

            <p className="mt-1 text-sm font-medium text-zinc-800">
              {new Intl.DateTimeFormat("en", {
                dateStyle: "medium",
              }).format(new Date(activeWorkspace.createdAt))}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
        <div className="flex items-start gap-3">
          <LockKeyhole size={17} className="mt-0.5 text-zinc-400" />

          <div>
            <h2 className="text-sm font-semibold text-zinc-800">
              Destructive actions
            </h2>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-500">
              THREAD does not currently support permanent workspace deletion.
              This protects the decision history and relationships stored in the
              workspace.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
