import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Bell,
  Boxes,
  Check,
  ChevronDown,
  CircleDot,
  Command,
  GitBranch,
  LayoutDashboard,
  Network,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

import { useWorkspace } from "../contexts/WorkspaceContext";
import { api } from "../lib/api";
import { getAccessToken } from "../lib/auth";
import WorkspaceSetupPage from "../pages/app/WorkspaceSetupPage";
import type { MeResponse } from "../types/auth";

function ThreadMark() {
  return (
    <div className="relative flex size-9 items-center justify-center rounded-xl bg-thread-950 text-sm font-semibold text-white shadow-sm">
      T
      <span className="absolute -right-1 -top-1 size-2.5 rounded-full border-2 border-white bg-thread-500" />
    </div>
  );
}

const primaryNavigation = [
  {
    label: "Overview",
    to: "/app/overview",
    icon: LayoutDashboard,
  },
  {
    label: "Projects",
    to: "/app/projects",
    icon: Boxes,
  },
  {
    label: "Decisions",
    to: "/app/decisions",
    icon: CircleDot,
  },
  {
    label: "Decision graph",
    to: "/app/graph",
    icon: Network,
  },
  {
    label: "Activity",
    to: "/app/activity",
    icon: Activity,
  },
];

const workspaceNavigation = [
  {
    label: "Members",
    to: "/app/members",
    icon: Users,
  },
  {
    label: "Settings",
    to: "/app/settings",
    icon: Settings,
  },
];

function navigationClass(isActive: boolean) {
  return [
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
    isActive
      ? "bg-white/10 font-medium text-white"
      : "text-zinc-400 hover:bg-white/[0.06] hover:text-white",
  ].join(" ");
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatRole(role: string) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

export default function AppLayout() {
  const token = getAccessToken();

  const {
    workspaces,
    activeWorkspace,
    selectWorkspace,
    isLoading: workspacesLoading,
    isError: workspacesError,
    refetchWorkspaces,
  } = useWorkspace();

  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () =>
      api<MeResponse>("/auth/me", {
        token,
      }),
    enabled: Boolean(token),
    retry: false,
  });

  const user = data?.data.user;

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        workspaceMenuRef.current &&
        !workspaceMenuRef.current.contains(event.target as Node)
      ) {
        setWorkspaceMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  if (workspacesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7fa]">
        <div className="text-center">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-thread-700" />
          <p className="mt-4 text-sm text-zinc-500">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  if (workspacesError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7fa] px-5">
        <div className="max-w-md text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            !
          </div>

          <h1 className="mt-5 text-xl font-semibold text-zinc-950">
            We couldn't load your workspace.
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Check your connection and try again.
          </p>

          <button
            type="button"
            onClick={refetchWorkspaces}
            className="mt-6 rounded-xl bg-thread-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-thread-900"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!activeWorkspace) {
    return (
      <div className="min-h-screen bg-[#f7f7fa] text-zinc-950">
        <header className="flex h-20 items-center justify-between border-b border-zinc-200/70 bg-white/70 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <ThreadMark />

            <div>
              <p className="text-[15px] font-semibold tracking-[0.18em]">
                THREAD
              </p>
              <p className="mt-0.5 hidden text-[10px] uppercase tracking-[0.14em] text-zinc-400 sm:block">
                Decision intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-thread-100 text-xs font-semibold text-thread-700">
              {user ? getInitials(user.name) : "?"}
            </div>

            <div className="hidden min-w-0 text-left sm:block">
              <p className="max-w-40 truncate text-xs font-semibold text-zinc-800">
                {user?.name ?? "Loading..."}
              </p>
              <p className="max-w-40 truncate text-[10px] text-zinc-400">
                {user?.email ?? ""}
              </p>
            </div>
          </div>
        </header>

        <WorkspaceSetupPage />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7fa] text-zinc-950">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[244px] border-r border-white/10 bg-[#171528] text-white lg:flex lg:flex-col">
        <div className="flex h-20 items-center gap-3 px-6">
          <ThreadMark />

          <div>
            <p className="text-[15px] font-semibold tracking-[0.18em]">
              THREAD
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-violet-300/70">
              Decision intelligence
            </p>
          </div>
        </div>

        <div ref={workspaceMenuRef} className="relative px-4 pt-3">
          <button
            type="button"
            onClick={() => setWorkspaceMenuOpen((current) => !current)}
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-left transition hover:bg-white/[0.09]"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-xs font-semibold text-violet-200">
                {getInitials(activeWorkspace.name)}
              </div>

              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-white">
                  {activeWorkspace.name}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {formatRole(activeWorkspace.role)}
                </p>
              </div>
            </div>

            <ChevronDown
              size={14}
              className={`shrink-0 text-zinc-500 transition ${
                workspaceMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {workspaceMenuOpen && (
            <div className="absolute left-4 right-4 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-white/10 bg-[#211f35] p-1.5 shadow-2xl">
              <p className="px-2.5 pb-1.5 pt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Your workspaces
              </p>

              <div className="max-h-60 overflow-y-auto">
                {workspaces.map((workspace) => {
                  const isActive = workspace.id === activeWorkspace.id;

                  return (
                    <button
                      key={workspace.id}
                      type="button"
                      onClick={() => {
                        selectWorkspace(workspace.id);
                        setWorkspaceMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-white/[0.06]"
                    >
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-[10px] font-semibold text-violet-200">
                        {getInitials(workspace.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-zinc-200">
                          {workspace.name}
                        </p>
                        <p className="mt-0.5 text-[9px] text-zinc-500">
                          {formatRole(workspace.role)}
                        </p>
                      </div>

                      {isActive && (
                        <Check size={14} className="shrink-0 text-violet-300" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <nav className="mt-7 space-y-1 px-3">
          {primaryNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => navigationClass(isActive)}
              >
                <Icon size={17} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="mx-4 mt-7 border-t border-white/10 pt-6">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
            Workspace
          </p>

          <nav className="mt-3 space-y-1">
            {workspaceNavigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => navigationClass(isActive)}
                >
                  <Icon size={17} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-violet-400/10 bg-violet-400/[0.06] p-4">
            <div className="mb-3 flex size-8 items-center justify-center rounded-lg bg-violet-400/10 text-violet-300">
              <GitBranch size={16} />
            </div>

            <p className="text-xs font-medium text-zinc-200">
              Every decision leaves a trail.
            </p>

            <p className="mt-1.5 text-[11px] leading-5 text-zinc-500">
              THREAD keeps the reasoning and impact connected.
            </p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[244px]">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-zinc-200/70 bg-[#f7f7fa]/90 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
          <div className="flex items-center gap-3 lg:hidden">
            <ThreadMark />
            <span className="text-sm font-semibold tracking-[0.15em]">
              THREAD
            </span>
          </div>

          <div className="hidden items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 shadow-sm sm:flex sm:w-72">
            <Search size={16} className="text-zinc-400" />
            <span className="text-sm text-zinc-400">Search decisions...</span>

            <span className="ml-auto flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] text-zinc-400">
              <Command size={10} />K
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:text-zinc-900"
            >
              <Bell size={17} />
            </button>

            <button
              type="button"
              className="ml-1 flex items-center gap-2 rounded-xl p-1.5 pr-2 transition hover:bg-zinc-100"
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-thread-100 text-xs font-semibold text-thread-700">
                {user ? getInitials(user.name) : "?"}
              </div>

              <div className="hidden min-w-0 text-left sm:block">
                <p className="max-w-36 truncate text-xs font-semibold text-zinc-800">
                  {user?.name ?? "Loading..."}
                </p>
                <p className="max-w-36 truncate text-[10px] text-zinc-400">
                  {user?.email ?? ""}
                </p>
              </div>

              <ChevronDown
                size={13}
                className="hidden text-zinc-400 sm:block"
              />
            </button>
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  );
}
