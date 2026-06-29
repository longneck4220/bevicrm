import { createFileRoute } from "@tanstack/react-router";
import { TrialPage } from "@/features/trial/TrialPage";

const TITLE = "BEVI Trial — Post-visit intelligence";
const DESCRIPTION =
  "Turn one messy post-visit note into a CRM-ready record, a follow-up email, and the next best move — in under 60 seconds.";
const URL = "https://bevicrm.lovable.app/trial";

export const Route = createFileRoute("/_authenticated/trial")({
  component: TrialPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: URL },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
});
