import { Link } from "@tanstack/react-router";
import { BeviMark } from "@/features/shared/BeviMark";
import type { MarketingTo } from "@/features/shared/MarketingButtons";

const links: { label: string; to: MarketingTo }[] = [
  { label: "Product", to: "/product" },
  { label: "How it works", to: "/how-it-works" },
  { label: "Why BEVI", to: "/why-bevi" },
  { label: "Pricing", to: "/pricing" },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-hairline py-12">
      <div className="shell">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <BeviMark size={26} />
              <span className="font-display text-base font-medium tracking-[0.14em] text-foreground">
                BEVI
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Between Visits Intelligence.</p>
          </div>
          <nav
            aria-label="Footer"
            className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground sm:justify-end"
          >
            {links.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                className="flex min-h-[44px] items-center transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/login"
              search={{ next: undefined }}
              className="flex min-h-[44px] items-center transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
          </nav>
        </div>

        <div className="mt-8 grid gap-8 border-t border-hairline pt-8 md:grid-cols-2">
          <section id="privacy" className="scroll-mt-24">
            <p className="eyebrow">Privacy</p>
            <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
              Demo notes on this site are processed to generate output and are not stored against an
              account. Full privacy terms are published with the pilot agreement.
            </p>
          </section>
          <section id="contact" className="scroll-mt-24">
            <p className="eyebrow">Contact</p>
            <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
              For pilot access and territory rollouts, reach the BEVI team at{" "}
              <a
                href="mailto:hello@bevipvi.com"
                className="rounded text-primary underline underline-offset-4 transition-colors hover:text-foreground"
              >
                hello@bevipvi.com
              </a>
              .
            </p>
          </section>
        </div>

        <p className="mt-10 text-[13px] text-muted-foreground/70">
          © {new Date().getFullYear()} BEVI — Between Visits Intelligence.
        </p>
      </div>
    </footer>
  );
}
