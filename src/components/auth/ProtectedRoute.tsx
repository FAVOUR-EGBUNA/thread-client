import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet } from "react-router-dom";

import { api } from "../../lib/api";
import { getAccessToken, removeAccessToken } from "../../lib/auth";
import type { MeResponse } from "../../types/auth";

export default function ProtectedRoute() {
  const token = getAccessToken();

  const { isPending, isError } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () =>
      api<MeResponse>("/auth/me", {
        token,
      }),
    enabled: Boolean(token),
    retry: false,
  });

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7fa]">
        <div className="text-center">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-zinc-200 border-t-thread-700" />
          <p className="mt-4 text-sm text-zinc-500">Loading THREAD...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    removeAccessToken();

    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
