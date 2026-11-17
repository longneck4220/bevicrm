import { createFileRoute } from "@tanstack/react-router";
import { CustomersPage } from "@/features/customers/CustomersPage";
import { RequireRole } from "@/features/shared/RequireRole";

const TITLE = "Customer accounts · BEVI";
const DESCRIPTION =
  "Search, add and edit your customer accounts and contact details.";

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: () => (
    <RequireRole allow={["rep", "admin"]}>
      <CustomersPage />
    </RequireRole>
  ),
});
