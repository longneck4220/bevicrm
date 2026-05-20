import { createFileRoute } from "@tanstack/react-router";
import { MobileCompanionPage } from "@/features/mobile/MobileCompanionPage";

export const Route = createFileRoute("/_authenticated/mobile")({
  head: () => ({
    meta: [
      { title: "Mobile Companion · BEVI" },
      { name: "description", content: "One signal, one move, in your pocket." },
    ],
  }),
  component: MobileCompanionPage,
});
