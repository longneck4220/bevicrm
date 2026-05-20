import { createFileRoute } from "@tanstack/react-router";
import { TrialPage } from "@/features/trial/TrialPage";

export const Route = createFileRoute("/_authenticated/trial")({
  component: TrialPage,
  head: () => ({
    meta: [
      { title: "BEVI Trial — Post-visit intelligence" },
      {
        name: "description",
        content:
          "Turn one messy post-visit note into a CRM-ready record, a rep follow-up email, and the next best move.",
      },
    ],
  }),
});
