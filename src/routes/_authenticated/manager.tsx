import { Outlet, createFileRoute } from "@tanstack/react-router";
import { RequireRole } from "@/features/shared/RequireRole";

export const Route = createFileRoute("/_authenticated/manager")({
  head: () => ({
    meta: [
      { title: "Manager Dashboard · BEVI" },
      { name: "description", content: "Team overview for field sales managers." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: () => (
    <RequireRole allow={["manager", "admin"]}>
      <Outlet />
    </RequireRole>
  ),
});
