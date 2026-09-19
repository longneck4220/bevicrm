import { createFileRoute } from "@tanstack/react-router";
import { RepListPage } from "@/features/manager/RepListPage";

export const Route = createFileRoute("/_authenticated/manager/")({
  head: () => ({
    meta: [
      { title: "Manager Dashboard · BEVI" },
      { name: "description", content: "Team overview for field sales managers." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: RepListPage,
});
