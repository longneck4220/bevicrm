import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { homeForRole } from "@/lib/roles";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

function PublicLayout() {
  const { user, loading, role, roleLoading } = useAuth();

  // Unlike _authenticated's inverse guard, this must not block rendering on
  // `loading`: these are the SSR'd marketing/demo pages (SEO meta, OG tags,
  // JSON-LD), and `loading` is always true during SSR (auth only resolves in
  // a client-only effect). Gating on it would replace that server-rendered
  // content with a bare spinner for every visitor, not just signed-in ones.
  // Redirect only once we positively know the user is signed in — a brief
  // flash of the public page before the client-side bounce is the fine
  // trade-off here, the reverse of blocking SSR content for everyone.
  if (!loading && user && !roleLoading) {
    return <Navigate to={homeForRole(role)} />;
  }

  return <Outlet />;
}
