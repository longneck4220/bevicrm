import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { homeForRole, type AppRole } from "@/lib/roles";

/**
 * Sits inside the _authenticated layout (session already guaranteed) and keeps
 * each area to the roles that belong there. Anyone else is sent to their own
 * home view rather than a dead end.
 */
export function RequireRole({ allow, children }: { allow: AppRole[]; children: ReactNode }) {
  const { user, role, roleLoading } = useAuth();

  // Dev-only open access to /manager (see routes/_authenticated.tsx) leaves no
  // user; don't bounce that case.
  if (!user) return <>{children}</>;

  if (roleLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-white/50">Loading…</div>
      </main>
    );
  }

  const effective: AppRole = role ?? "rep";
  if (!allow.includes(effective)) {
    return <Navigate to={homeForRole(effective)} replace />;
  }

  return <>{children}</>;
}
