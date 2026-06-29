import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/features/landing/LandingPage";

const TITLE = "BEVI — Sales Intelligence for Field Reps";
const DESCRIPTION =
  "BEVI turns post-visit thinking into your next commercial move — CRM-ready notes, follow-up emails, and the one next step that matters, in under 60 seconds.";
const URL = "https://bevicrm.lovable.app/";
const OG_IMAGE = "https://bevicrm.lovable.app/og-image.jpg";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: URL },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "BEVI",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description: DESCRIPTION,
          url: URL,
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }),
      },
    ],
  }),
});
