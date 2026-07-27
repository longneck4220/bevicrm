import { createFileRoute, Outlet, Navigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  // Capture the protected path on first render. Reading it later can yield
  // "/login" mid-redirect, which would send the user back to the sign-in page
  // after a successful sign-in.
  const [pathname] = useState(currentPath);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-white/50">Loading…</div>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" search={{ next: pathname }} />;
  }

  return <Outlet />;
}
