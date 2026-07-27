import { createFileRoute, Outlet, Navigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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
