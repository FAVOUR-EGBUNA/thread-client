import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Crown,
  Mail,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { useWorkspaceMembers } from "../../hooks/useMembers";
import { getActiveWorkspaceId } from "../../lib/activeWorkspace";
import { ApiError } from "../../lib/api";
import {
  addWorkspaceMember,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
} from "../../lib/members";
import type { WorkspaceMember, WorkspaceRole } from "../../types/member";

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

function roleStyles(role: WorkspaceRole) {
  switch (role) {
    case "OWNER":
      return "bg-violet-50 text-violet-700 ring-violet-600/20";

    case "ADMIN":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";

    default:
      return "bg-zinc-100 text-zinc-600 ring-zinc-500/20";
  }
}

function RoleIcon({ role }: { role: WorkspaceRole }) {
  if (role === "OWNER") {
    return <Crown size={13} />;
  }

  if (role === "ADMIN") {
    return <Shield size={13} />;
  }

  return <UserRound size={13} />;
}

export default function MembersPage() {
  const activeWorkspaceId = getActiveWorkspaceId();
  const queryClient = useQueryClient();

  const membersQuery = useWorkspaceMembers(activeWorkspaceId);

  const [showAddMember, setShowAddMember] = useState(false);

  const [email, setEmail] = useState("");

  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");

  const [actionError, setActionError] = useState<string | null>(null);

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  async function refreshMembers() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["members", activeWorkspaceId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["workspaces"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["activity", activeWorkspaceId],
      }),
    ]);
  }

  const addMutation = useMutation({
    mutationFn: () => {
      if (!activeWorkspaceId) {
        throw new Error("Workspace ID is required");
      }

      return addWorkspaceMember(activeWorkspaceId, {
        email: email.trim().toLowerCase(),
        role,
      });
    },

    onSuccess: async (response) => {
      setActionError(null);
      setActionSuccess(response.message);
      setEmail("");
      setRole("MEMBER");
      setShowAddMember(false);

      await refreshMembers();
    },

    onError: (error) => {
      setActionSuccess(null);

      setActionError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Something went wrong while adding the member.",
      );
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({
      memberId,
      newRole,
    }: {
      memberId: number;
      newRole: "ADMIN" | "MEMBER";
    }) => {
      if (!activeWorkspaceId) {
        throw new Error("Workspace ID is required");
      }

      return updateWorkspaceMemberRole(activeWorkspaceId, memberId, newRole);
    },

    onSuccess: async (response) => {
      setActionError(null);
      setActionSuccess(response.message);

      await refreshMembers();
    },

    onError: (error) => {
      setActionSuccess(null);

      setActionError(
        error instanceof ApiError
          ? error.message
          : "Something went wrong while changing the member role.",
      );
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: number) => {
      if (!activeWorkspaceId) {
        throw new Error("Workspace ID is required");
      }

      return removeWorkspaceMember(activeWorkspaceId, memberId);
    },

    onSuccess: async (response) => {
      setActionError(null);
      setActionSuccess(response.message);

      await refreshMembers();
    },

    onError: (error) => {
      setActionSuccess(null);

      setActionError(
        error instanceof ApiError
          ? error.message
          : "Something went wrong while removing the member.",
      );
    },
  });

  if (!activeWorkspaceId) {
    return (
      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
        <h1 className="text-2xl font-semibold text-zinc-950">Members</h1>

        <p className="mt-2 text-sm text-zinc-500">
          Select a workspace to manage its members.
        </p>
      </main>
    );
  }

  if (membersQuery.isPending) {
    return (
      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
        <div className="flex min-h-[420px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-thread-700" />

            <p className="mt-4 text-sm text-zinc-500">Loading members...</p>
          </div>
        </div>
      </main>
    );
  }

  if (membersQuery.isError) {
    return (
      <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-medium text-red-800">
            We couldn't load workspace members.
          </p>

          <button
            type="button"
            onClick={() => membersQuery.refetch()}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-red-700"
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      </main>
    );
  }

  const data = membersQuery.data.data;

  const canAddMembers =
    data.currentUserRole === "OWNER" || data.currentUserRole === "ADMIN";

  const canChangeRoles = data.currentUserRole === "OWNER";

  function canRemoveMember(member: WorkspaceMember) {
    if (member.role === "OWNER") {
      return false;
    }

    if (data.currentUserRole === "OWNER") {
      return true;
    }

    if (data.currentUserRole === "ADMIN" && member.role === "MEMBER") {
      return true;
    }

    return false;
  }

  return (
    <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-thread-600">
            {data.workspace.name}
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-zinc-950">
            Members
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Manage who can access this workspace and what they can change.
          </p>
        </div>

        {canAddMembers && (
          <button
            type="button"
            onClick={() => {
              setActionError(null);
              setActionSuccess(null);
              setShowAddMember((current) => !current);
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-thread-950 px-4 text-sm font-medium text-white"
          >
            {showAddMember ? <X size={15} /> : <Plus size={15} />}

            {showAddMember ? "Cancel" : "Add member"}
          </button>
        )}
      </div>

      {actionError && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {actionSuccess && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {actionSuccess}
        </div>
      )}

      {showAddMember && canAddMembers && (
        <section className="mt-7 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-zinc-950">Add workspace member</h2>

          <p className="mt-1 text-sm text-zinc-500">
            The person must already have a THREAD account.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_180px_auto] md:items-end">
            <div>
              <label className="text-xs font-medium text-zinc-700">
                Email address
              </label>

              <div className="relative mt-2">
                <Mail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  className="h-11 w-full rounded-xl border border-zinc-200 pl-9 pr-3 text-sm outline-none focus:border-thread-500 focus:ring-4 focus:ring-thread-100"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700">Role</label>

              <select
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as "ADMIN" | "MEMBER")
                }
                className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none"
              >
                <option value="MEMBER">Member</option>

                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <button
              type="button"
              disabled={!email.trim() || addMutation.isPending}
              onClick={() => addMutation.mutate()}
              className="h-11 rounded-xl bg-thread-950 px-5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {addMutation.isPending ? "Adding..." : "Add member"}
            </button>
          </div>
        </section>
      )}

      <section className="mt-8 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-thread-50 text-thread-700">
              <Users size={18} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-zinc-950">
                Workspace members
              </h2>

              <p className="mt-0.5 text-xs text-zinc-500">
                {data.memberCount}{" "}
                {data.memberCount === 1 ? "member" : "members"}
              </p>
            </div>
          </div>

          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${roleStyles(
              data.currentUserRole,
            )}`}
          >
            Your role: {data.currentUserRole}
          </span>
        </div>

        <div className="divide-y divide-zinc-100">
          {data.members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700">
                  {member.user.name.trim().charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      {member.user.name}
                    </p>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ring-1 ring-inset ${roleStyles(
                        member.role,
                      )}`}
                    >
                      <RoleIcon role={member.role} />
                      {member.role}
                    </span>
                  </div>

                  <p className="mt-1 truncate text-xs text-zinc-500">
                    {member.user.email}
                  </p>

                  <p className="mt-1 text-[11px] text-zinc-400">
                    Joined {formatDate(member.joinedAt)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {canChangeRoles && member.role !== "OWNER" && (
                  <select
                    value={member.role}
                    disabled={roleMutation.isPending}
                    onChange={(event) => {
                      const newRole = event.target.value as "ADMIN" | "MEMBER";

                      if (newRole === member.role) {
                        return;
                      }

                      roleMutation.mutate({
                        memberId: member.id,
                        newRole,
                      });
                    }}
                    className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 outline-none disabled:opacity-50"
                  >
                    <option value="MEMBER">Member</option>

                    <option value="ADMIN">Admin</option>
                  </select>
                )}

                {canRemoveMember(member) && (
                  <button
                    type="button"
                    disabled={removeMutation.isPending}
                    onClick={() => {
                      const confirmed = window.confirm(
                        `Remove ${member.user.name} from this workspace?`,
                      );

                      if (confirmed) {
                        removeMutation.mutate(member.id);
                      }
                    }}
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-200 px-3 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
