import { createFileRoute, Outlet, Navigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();
  // Captured once on mount rather than subscribed reactively: once <Navigate>
  // below starts the transition to /login, the router's location changes to
  // /login *before this component unmounts*, so a reactive read here would
  // otherwise pick up "/login" itself as the redirect target on the next render.
  const [entryPathname] = useState(() => router.state.location.pathname);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-white/50">Loading…</div>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" search={{ next: entryPathname }} />;
  }

  // The ambient gradient canvas belongs to the signed-in app only; the
  // marketing surface keeps the flat midnight ground.
  return (
    <div className="app-ambient">
      <Outlet />
    </div>
  );
}
