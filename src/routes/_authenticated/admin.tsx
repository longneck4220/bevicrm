import { createFileRoute } from "@tanstack/react-router";
import { AdminUsersPage } from "@/features/admin/AdminUsersPage";
import { RequireRole } from "@/features/shared/RequireRole";

const TITLE = "Admin · Users & Accounts · BEVI";
const DESCRIPTION = "Admin tools to manage users and clean up duplicate accounts.";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: () => (
    <RequireRole allow={["admin"]}>
      <AdminUsersPage />
    </RequireRole>
  ),
});
