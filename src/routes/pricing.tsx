import { createFileRoute } from "@tanstack/react-router";
import { PricingPage } from "@/features/pricing/PricingPage";

const TITLE = "Pricing — BEVI post-visit intelligence per rep";
const DESCRIPTION =
  "Pilot pricing for BEVI. Free Test Run, Founding 50, Field Pro and Team Pilot plans that turn rough visit notes into decisions for field sales teams.";
const URL = "https://bevicrm.lovable.app/pricing";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
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
