import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/dashboard/DashboardPage";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Command Center · BEVI" },
      { name: "description", content: "Live conversation signals, deal momentum, and next moves." },
    ],
  }),
  component: DashboardPage,
});
