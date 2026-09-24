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
  Menu,
  Moon,
  Network,
  Search,
  Settings,
  Sun,
  Users,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import { useWorkspace } from "../contexts/WorkspaceContext";
import { api } from "../lib/api";
import { getWorkspaceActivity } from "../lib/activity";
import { getAccessToken } from "../lib/auth";
import { searchDecisions } from "../lib/search";
import {
  getStoredTheme,
  saveTheme,
  type Theme,
} from "../lib/theme";
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

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatAction(action: string) {
  return action
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatRelativeTime(value: string | Date) {
  const date = new Date(value);
  const difference = Date.now() - date.getTime();

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const seconds = Math.floor(difference / 1000);

  if (seconds < 60) {
    return "Just now";
  }

  const minutes = Math.floor(seconds / 60);

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

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function AppLayout() {
  const navigate = useNavigate();
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());

  const workspaceMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const normalizedSearchQuery = searchQuery.trim();

  const {
    data: searchData,
    isLoading: searchLoading,
    isError: searchError,
  } = useQuery({
    queryKey: ["global-search", normalizedSearchQuery],
    queryFn: () => searchDecisions(normalizedSearchQuery),
    enabled: searchOpen && normalizedSearchQuery.length >= 2,
    staleTime: 30_000,
  });

  const {
    data: activityData,
    isLoading: activityLoading,
    isError: activityError,
    refetch: refetchActivity,
  } = useQuery({
    queryKey: [
      "workspace-activity",
      activeWorkspace?.id,
      "notifications",
    ],
    queryFn: () =>
      getWorkspaceActivity(activeWorkspace!.id, 1, 8),
    enabled: Boolean(activeWorkspace?.id) && notificationsOpen,
    staleTime: 30_000,
  });

  const searchResults = searchData?.data.results ?? [];
  const activities = activityData?.data.activities ?? [];

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;

      if (
        workspaceMenuRef.current &&
        !workspaceMenuRef.current.contains(target)
      ) {
        setWorkspaceMenuOpen(false);
      }

      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(target)
      ) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen && !searchOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen, searchOpen]);

  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      const isSearchShortcut =
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k";

      if (isSearchShortcut) {
        event.preventDefault();
        setNotificationsOpen(false);
        setMobileMenuOpen(false);
        setSearchOpen(true);
        return;
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyboard);

    return () => {
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, []);

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchOpen]);

  const toggleTheme = () => {
    const nextTheme: Theme =
      theme === "light" ? "dark" : "light";

    setTheme(nextTheme);
    saveTheme(nextTheme);
  };

  const openSearch = () => {
    setNotificationsOpen(false);
    setMobileMenuOpen(false);
    setSearchOpen(true);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  const toggleNotifications = () => {
    setSearchOpen(false);
    setNotificationsOpen((current) => !current);
  };

  const handleWorkspaceSelect = (workspaceId: number) => {
    selectWorkspace(workspaceId);
    setWorkspaceMenuOpen(false);
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
  };

  const openDecision = (decisionId: number) => {
    closeSearch();
    navigate(`/app/decisions/${decisionId}`);
  };

  if (workspacesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7fa] dark:bg-[#0f0e18]">
        <div className="text-center">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-thread-700 dark:border-white/10 dark:border-t-thread-400" />

          <p className="mt-4 text-sm text-zinc-500">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  if (workspacesError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7fa] px-5 dark:bg-[#0f0e18]">
        <div className="max-w-md text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
            !
          </div>

          <h1 className="mt-5 text-xl font-semibold text-zinc-950 dark:text-white">
            We couldn't load your workspace.
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Check your connection and try again.
          </p>

          <button
            type="button"
            onClick={() => refetchWorkspaces()}
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
      <div className="min-h-screen bg-[#f7f7fa] text-zinc-950 dark:bg-[#0f0e18] dark:text-white">
        <header className="flex h-20 items-center justify-between border-b border-zinc-200/70 bg-white/70 px-5 backdrop-blur-xl dark:border-white/10 dark:bg-[#171528]/90 sm:px-8 lg:px-10">
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
            <button
              type="button"
              aria-label={`Switch to ${
                theme === "light" ? "dark" : "light"
              } mode`}
              onClick={toggleTheme}
              className="flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:text-white"
            >
              {theme === "light" ? (
                <Moon size={17} />
              ) : (
                <Sun size={17} />
              )}
            </button>

            <div className="flex size-8 items-center justify-center rounded-lg bg-thread-100 text-xs font-semibold text-thread-700">
              {user ? getInitials(user.name) : "?"}
            </div>

            <div className="hidden min-w-0 text-left sm:block">
              <p className="max-w-40 truncate text-xs font-semibold text-zinc-800 dark:text-zinc-100">
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
    <div className="min-h-screen bg-[#f7f7fa] text-zinc-950 transition-colors dark:bg-[#0f0e18] dark:text-zinc-100">
      {/* Desktop sidebar */}
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

        <div
          ref={workspaceMenuRef}
          className="relative px-4 pt-3"
        >
          <button
            type="button"
            onClick={() =>
              setWorkspaceMenuOpen((current) => !current)
            }
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
                  const isActive =
                    workspace.id === activeWorkspace.id;

                  return (
                    <button
                      key={workspace.id}
                      type="button"
                      onClick={() =>
                        handleWorkspaceSelect(workspace.id)
                      }
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
                        <Check
                          size={14}
                          className="shrink-0 text-violet-300"
                        />
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
                className={({ isActive }) =>
                  navigationClass(isActive)
                }
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
                  className={({ isActive }) =>
                    navigationClass(isActive)
                  }
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

      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(86vw,320px)] flex-col bg-[#171528] text-white shadow-2xl transition-transform duration-300 lg:hidden ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <ThreadMark />

            <div>
              <p className="text-[15px] font-semibold tracking-[0.18em]">
                THREAD
              </p>

              <p className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-violet-300/70">
                Decision intelligence
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
            className="flex size-9 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-white/10 p-4">
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
            Workspace
          </p>

          <div className="space-y-1">
            {workspaces.map((workspace) => {
              const isActive =
                workspace.id === activeWorkspace.id;

              return (
                <button
                  key={workspace.id}
                  type="button"
                  onClick={() =>
                    handleWorkspaceSelect(workspace.id)
                  }
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition ${
                    isActive
                      ? "bg-white/10"
                      : "hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-[10px] font-semibold text-violet-200">
                    {getInitials(workspace.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-white">
                      {workspace.name}
                    </p>

                    <p className="mt-0.5 text-[9px] text-zinc-500">
                      {formatRole(workspace.role)}
                    </p>
                  </div>

                  {isActive && (
                    <Check
                      size={14}
                      className="shrink-0 text-violet-300"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <nav className="space-y-1">
            {primaryNavigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    navigationClass(isActive)
                  }
                >
                  <Icon size={17} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="mx-1 mt-6 border-t border-white/10 pt-5">
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
                    onClick={() =>
                      setMobileMenuOpen(false)
                    }
                    className={({ isActive }) =>
                      navigationClass(isActive)
                    }
                  >
                    <Icon size={17} />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-xs font-semibold text-violet-200">
              {user ? getInitials(user.name) : "?"}
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-zinc-200">
                {user?.name ?? "Loading..."}
              </p>

              <p className="mt-0.5 truncate text-[10px] text-zinc-500">
                {user?.email ?? ""}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[244px]">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-20 items-center border-b border-zinc-200/70 bg-[#f7f7fa]/90 px-4 backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-[#0f0e18]/90 sm:px-8 lg:px-10">
          {/* Mobile menu */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              aria-label="Open navigation"
              aria-expanded={mobileMenuOpen}
              onClick={() => {
                setNotificationsOpen(false);
                setMobileMenuOpen(true);
              }}
              className="flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              <Menu size={19} />
            </button>

            <div className="hidden items-center gap-3 sm:flex">
              <ThreadMark />

              <span className="text-sm font-semibold tracking-[0.15em]">
                THREAD
              </span>
            </div>
          </div>

          {/* Desktop search */}
          <button
            type="button"
            onClick={openSearch}
            className="hidden items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-zinc-300 lg:flex lg:w-72 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
          >
            <Search
              size={16}
              className="shrink-0 text-zinc-400"
            />

            <span className="truncate text-sm text-zinc-400">
              Search decisions...
            </span>

            <span className="ml-auto flex shrink-0 items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] text-zinc-400 dark:border-white/10 dark:bg-white/5">
              <Command size={10} />
              K
            </span>
          </button>

          {/* Header actions */}
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {/* Mobile search */}
            <button
              type="button"
              aria-label="Search decisions"
              onClick={openSearch}
              className="flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:text-white lg:hidden"
            >
              <Search size={17} />
            </button>

            {/* Theme */}
            <button
              type="button"
              aria-label={`Switch to ${
                theme === "light" ? "dark" : "light"
              } mode`}
              title={`Switch to ${
                theme === "light" ? "dark" : "light"
              } mode`}
              onClick={toggleTheme}
              className="flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:text-white"
            >
              {theme === "light" ? (
                <Moon size={17} />
              ) : (
                <Sun size={17} />
              )}
            </button>

            {/* Notifications */}
            <div
              ref={notificationsRef}
              className="relative"
            >
              <button
                type="button"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={toggleNotifications}
                className="relative flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:text-zinc-900 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:text-white"
              >
                <Bell size={17} />

                {activities.length > 0 && (
                  <span className="absolute right-2 top-2 size-1.5 rounded-full bg-thread-500" />
                )}
              </button>

              {notificationsOpen && (
                <div className="fixed left-4 right-4 top-[88px] z-50 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#1a1827] sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+10px)] sm:w-[380px]">
                  <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3.5 dark:border-white/10">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                        Activity
                      </p>

                      <p className="mt-0.5 text-[11px] text-zinc-400">
                        Latest workspace changes
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => refetchActivity()}
                      className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-thread-700 transition hover:bg-thread-50 dark:text-thread-300 dark:hover:bg-white/5"
                    >
                      Refresh
                    </button>
                  </div>

                  <div className="max-h-[420px] overflow-y-auto">
                    {activityLoading ? (
                      <div className="px-5 py-10 text-center">
                        <div className="mx-auto size-6 animate-spin rounded-full border-2 border-zinc-200 border-t-thread-600 dark:border-white/10 dark:border-t-thread-400" />

                        <p className="mt-3 text-xs text-zinc-400">
                          Loading activity...
                        </p>
                      </div>
                    ) : activityError ? (
                      <div className="px-5 py-10 text-center">
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                          Couldn't load activity.
                        </p>

                        <button
                          type="button"
                          onClick={() => refetchActivity()}
                          className="mt-3 text-xs font-medium text-thread-700 dark:text-thread-300"
                        >
                          Try again
                        </button>
                      </div>
                    ) : activities.length === 0 ? (
                      <div className="px-5 py-10 text-center">
                        <Activity
                          size={24}
                          className="mx-auto text-zinc-300 dark:text-zinc-600"
                        />

                        <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                          No activity yet
                        </p>

                        <p className="mt-1 text-xs text-zinc-400">
                          Workspace changes will appear here.
                        </p>
                      </div>
                    ) : (
                      activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="border-b border-zinc-100 px-4 py-3.5 last:border-b-0 dark:border-white/[0.06]"
                        >
                          <div className="flex gap-3">
                            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-thread-50 text-thread-700 dark:bg-thread-500/10 dark:text-thread-300">
                              <Activity size={14} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-100">
                                {formatAction(activity.action)}
                              </p>

                              <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                                {activity.actor?.name ??
                                  "THREAD"}
                                {activity.entityType
                                  ? ` · ${formatAction(
                                      activity.entityType,
                                    )}`
                                  : ""}
                              </p>

                              <p className="mt-1 text-[10px] text-zinc-400">
                                {formatRelativeTime(
                                  activity.createdAt,
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen(false);
                      navigate("/app/activity");
                    }}
                    className="flex w-full items-center justify-center border-t border-zinc-100 px-4 py-3 text-xs font-semibold text-thread-700 transition hover:bg-zinc-50 dark:border-white/10 dark:text-thread-300 dark:hover:bg-white/5"
                  >
                    View all activity
                  </button>
                </div>
              )}
            </div>

            {/* User */}
            <div className="ml-0.5 flex items-center gap-2 rounded-xl p-1.5 sm:pr-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-thread-100 text-xs font-semibold text-thread-700">
                {user ? getInitials(user.name) : "?"}
              </div>

              <div className="hidden min-w-0 text-left md:block">
                <p className="max-w-36 truncate text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                  {user?.name ?? "Loading..."}
                </p>

                <p className="max-w-36 truncate text-[10px] text-zinc-400">
                  {user?.email ?? ""}
                </p>
              </div>
            </div>
          </div>
        </header>

        <Outlet />
      </div>

      {/* Global search modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center bg-black/45 px-4 pt-[10vh] backdrop-blur-[2px] sm:pt-[14vh]"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              closeSearch();
            }
          }}
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#1a1827]">
            <div className="flex items-center gap-3 border-b border-zinc-100 px-4 dark:border-white/10 sm:px-5">
              <Search
                size={19}
                className="shrink-0 text-zinc-400"
              />

              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Search decisions, projects or workspaces..."
                className="h-16 min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-white"
              />

              <button
                type="button"
                aria-label="Close search"
                onClick={closeSearch}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X size={17} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {normalizedSearchQuery.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Search
                    size={28}
                    className="mx-auto text-zinc-300 dark:text-zinc-600"
                  />

                  <p className="mt-4 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Search THREAD
                  </p>

                  <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-zinc-400">
                    Find decisions using their title, context,
                    reasoning, status, project or workspace.
                  </p>
                </div>
              ) : normalizedSearchQuery.length < 2 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Type at least 2 characters to search.
                  </p>
                </div>
              ) : searchLoading ? (
                <div className="px-6 py-12 text-center">
                  <div className="mx-auto size-7 animate-spin rounded-full border-2 border-zinc-200 border-t-thread-600 dark:border-white/10 dark:border-t-thread-400" />

                  <p className="mt-3 text-xs text-zinc-400">
                    Searching THREAD...
                  </p>
                </div>
              ) : searchError ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    Search couldn't be completed.
                  </p>

                  <p className="mt-1 text-xs text-zinc-400">
                    Check your connection and try again.
                  </p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    No matching decisions
                  </p>

                  <p className="mt-1 text-xs text-zinc-400">
                    Try another search term.
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  <div className="px-3 pb-2 pt-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                      {searchData?.data.pagination.total ?? 0}{" "}
                      result
                      {(searchData?.data.pagination.total ??
                        0) === 1
                        ? ""
                        : "s"}
                    </p>
                  </div>

                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() =>
                        openDecision(result.id)
                      }
                      className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-zinc-50 dark:hover:bg-white/[0.05]"
                    >
                      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-thread-50 text-thread-700 dark:bg-thread-500/10 dark:text-thread-300">
                        <CircleDot size={16} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900 dark:text-white">
                            {result.title}
                          </p>

                          <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-1 text-[9px] font-semibold text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                            {formatStatus(result.status)}
                          </span>
                        </div>

                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                          {result.context}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-400">
                          <span>{result.projectName}</span>
                          <span>·</span>
                          <span>{result.workspaceName}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-2.5 text-[10px] text-zinc-400 dark:border-white/10">
              <span>Search across your accessible workspaces</span>

              <span className="hidden sm:inline">
                Esc to close
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}