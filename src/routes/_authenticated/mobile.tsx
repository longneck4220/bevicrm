import { createFileRoute } from "@tanstack/react-router";
import { MobileCompanionPage } from "@/features/mobile/MobileCompanionPage";

const TITLE = "Mobile Companion · BEVI";
const DESCRIPTION =
  "Record visits one-handed and turn call notes into actionable next steps — faster follow-up and better engagements, straight from the carpark.";
const URL = "https://bevicrm.lovable.app/mobile";

export const Route = createFileRoute("/_authenticated/mobile")({
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
  component: MobileCompanionPage,
});
