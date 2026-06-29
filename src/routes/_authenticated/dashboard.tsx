import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/dashboard/DashboardPage";

const TITLE = "Sales Intelligence Dashboard · BEVI";
const DESCRIPTION =
  "Today's next moves, priority accounts, and follow-ups due — your live command center for post-visit intelligence and account momentum.";
const URL = "https://bevicrm.lovable.app/dashboard";

export const Route = createFileRoute("/_authenticated/dashboard")({
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
  component: DashboardPage,
});
