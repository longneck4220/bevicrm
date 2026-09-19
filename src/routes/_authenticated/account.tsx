import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "@/features/account/AccountPage";

const TITLE = "Account settings · BEVI";
const DESCRIPTION = "Update your BEVI profile details and change your password.";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "robots", content: "noindex,nofollow" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountPage,
});
