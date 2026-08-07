import { createFileRoute } from "@tanstack/react-router";
import { ProductPage } from "@/features/product/ProductPage";

const TITLE = "Product — five outputs from one rough note | BEVI";
const DESCRIPTION =
  "See what BEVI returns after every venue visit: Next Best Move, CRM Note, Follow-Up Email, Missed Opportunity and Account Signals.";
const URL = "https://bevicrm.lovable.app/product";

export const Route = createFileRoute("/product")({
  component: ProductPage,
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
