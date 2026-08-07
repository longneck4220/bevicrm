import { createFileRoute } from "@tanstack/react-router";
import { WhyBeviPage } from "@/features/why/WhyBeviPage";

const TITLE = "Why BEVI — interpretation, not transcription";
const DESCRIPTION =
  "BEVI sits above your CRM and transcriber. It reads the venue call and decides the next move for field sales reps in the liquor trade.";
const URL = "https://bevicrm.lovable.app/why-bevi";

export const Route = createFileRoute("/why-bevi")({
  component: WhyBeviPage,
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
