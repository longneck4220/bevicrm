import { createFileRoute } from "@tanstack/react-router";
import { HowItWorksPage } from "@/features/how/HowItWorksPage";

const TITLE = "How BEVI Works - Post-visit intelligence";
const DESCRIPTION =
  "See how BEVI turns messy field visit notes into CRM-ready records, follow-up, account memory and the next best commercial move.";
const URL = "https://bevicrm.lovable.app/how-it-works";

export const Route = createFileRoute("/_authenticated/how-it-works")({
  component: HowItWorksPage,
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
