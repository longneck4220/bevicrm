import { createFileRoute } from "@tanstack/react-router";
import { TryDemoPage } from "@/features/try/TryDemoPage";

const TITLE = "Try BEVI — Live post-visit intelligence demo";
const DESCRIPTION =
  "Enter a venue and a messy post-visit note and see BEVI rebuild it into a CRM-ready record, commercial signals, a follow-up email and the next best move. No signup, nothing saved.";
const URL = "https://bevicrm.lovable.app/try";

export const Route = createFileRoute("/try")({
  component: TryDemoPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
});
