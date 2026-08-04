import { useState } from "react";
import { Link } from "@tanstack/react-router";

export type Billing = "monthly" | "annual";

type Tier = {
  name: string;
  price: string;
  annualPrice: string;
  detail: string;
  annualDetail: string;
  body: string;
  badge?: string;
  cta: string;
  recommended?: boolean;
};

/** Pilot pricing as published on BEVI's own pricing surface. */
export const TIERS: Tier[] = [
  {
    name: "Free Test Run",
    price: "A$0",
    annualPrice: "A$0",
    detail: "No card required",
    annualDetail: "No saved memory",
    body: "Try BEVI on a real visit note. Generate the output, copy what you need, then the call is forgotten.",
    cta: "Try a visit note",
  },
  {
    name: "Founding 50",
    price: "A$32",
    annualPrice: "A$320",
    detail: "/ user / month",
    annualDetail: "/ user / year",
    body: "Early-user pricing for the first 50 reps. Includes saved account memory, CRM-ready notes, follow-up drafts and next-move intelligence.",
    badge: "Early access",
    cta: "Start pilot",
    recommended: true,
  },
  {
    name: "Field Pro",
    price: "A$44",
    annualPrice: "A$440",
    detail: "/ user / month",
    annualDetail: "/ user / year",
    body: "For reps using BEVI regularly to keep account memory live, tighten follow-up and prepare the next call faster.",
    badge: "Month free",
    cta: "Start memory trial",
  },
  {
    name: "Team Pilot",
    price: "A$750",
    annualPrice: "A$7,500",
    detail: "/ month",
    annualDetail: "/ year",
    body: "For up to 20 seats, with workflow setup, feedback-led improvements and use-case tailoring for the sales team.",
    badge: "20 seats",
    cta: "Discuss team pilot",
  },
];

function Toggle({ billing, onChange }: { billing: Billing; onChange: (b: Billing) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        role="radiogroup"
        aria-label="Billing period"
        className="inline-flex rounded-lg border border-hairline bg-surface p-1"
      >
        {(["monthly", "annual"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={billing === option}
            onClick={() => onChange(option)}
            className={`min-h-[44px] rounded-md px-5 font-mono text-[13px] uppercase tracking-[0.06em] transition-colors ${
              billing === option
                ? "bg-surface-2 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-[12px] uppercase tracking-[0.06em] text-primary">
        2 months free
      </span>
    </div>
  );
}

export function PricingTiers() {
  const [billing, setBilling] = useState<Billing>("monthly");

  return (
    <>
      <div className="mt-10">
        <Toggle billing={billing} onChange={setBilling} />
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Annual billing shows the discounted rate, two months free on paid plans.
      </p>

      <div className="mt-12 grid gap-4 lg:grid-cols-4 lg:items-start">
        {TIERS.map((tier) => {
          const price = billing === "annual" ? tier.annualPrice : tier.price;
          const detail = billing === "annual" ? tier.annualDetail : tier.detail;
          return (
            <article
              key={tier.name}
              className={`relative flex flex-col rounded-xl border bg-surface p-6 transition-all duration-300 hover:-translate-y-0.5 md:p-8 ${
                tier.recommended
                  ? "order-first border-primary lg:order-none lg:-mt-4 lg:pb-10"
                  : "border-hairline hover:border-primary/40"
              }`}
            >
              {tier.badge && (
                <span className="absolute -top-3 left-6 rounded-full border border-primary/40 bg-background px-3 py-1 font-mono text-[12px] uppercase tracking-[0.06em] text-primary">
                  {tier.badge}
                </span>
              )}
              <p className="font-mono text-[13px] uppercase tracking-[0.06em] text-muted-foreground">
                {tier.name}
              </p>
              <p className="mt-5 flex flex-wrap items-baseline gap-x-2">
                <span
                  key={price}
                  className="font-display text-4xl tabular-nums tracking-[-0.02em] text-foreground"
                  style={{ animation: "bevi-price-in 200ms ease-out" }}
                >
                  {price}
                </span>
                <span className="text-sm text-muted-foreground">{detail}</span>
              </p>

              <p className="mt-5 flex-1 text-[15px] leading-relaxed text-muted-foreground">
                {tier.body}
              </p>

              <Link
                to="/try"
                className={`mt-8 inline-flex min-h-[44px] items-center justify-center rounded-lg px-5 text-sm font-medium transition-colors ${
                  tier.recommended
                    ? "bg-primary text-primary-foreground hover:brightness-110"
                    : "border border-hairline text-foreground hover:bg-surface-2"
                }`}
              >
                {tier.cta}
              </Link>
            </article>
          );
        })}
      </div>
    </>
  );
}
