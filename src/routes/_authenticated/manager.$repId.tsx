import { createFileRoute } from "@tanstack/react-router";
import { RepDetailPage } from "@/features/manager/RepDetailPage";

export const Route = createFileRoute("/_authenticated/manager/$repId")({
  head: () => ({
    meta: [
      { title: "Rep Drill-down · BEVI" },
      { name: "description", content: "Per-rep account drill-down for managers." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: RepDetailPage,
});
