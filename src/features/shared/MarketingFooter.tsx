import { Link } from "@tanstack/react-router";

const LINKS = [
  { label: "Product", href: "/#outputs" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Why BEVI", href: "/#why" },
  { label: "Pricing", href: "/how-it-works#pricing" },
  { label: "Privacy", href: "#privacy" },
  { label: "Contact", href: "#contact" },
];

export function MarketingFooter() {
  return (
    <footer className="border-t" style={{ borderColor: "var(--border-hairline)" }}>
      <div className="bevi-container py-12">
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="bevi-focus flex min-h-[44px] items-center rounded-md text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/login"
            search={{ next: undefined }}
            className="bevi-focus flex min-h-[44px] items-center rounded-md text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          >
            Sign in
          </Link>
        </nav>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <section id="privacy" className="scroll-mt-24">
            <span className="bevi-eyebrow">PRIVACY</span>
            <p className="mt-2 max-w-[52ch] text-sm leading-[1.55] text-[var(--text-muted)]">
              Demo notes on this site are processed to generate output and are not stored against an
              account. Full privacy terms are published with the pilot agreement.
            </p>
          </section>
          <section id="contact" className="scroll-mt-24">
            <span className="bevi-eyebrow">CONTACT</span>
            <p className="mt-2 max-w-[52ch] text-sm leading-[1.55] text-[var(--text-muted)]">
              For pilot access and territory rollouts, reach the BEVI team at{" "}
              <a
                href="mailto:hello@bevipvi.com"
                className="bevi-focus rounded text-[var(--accent-teal-text)] underline underline-offset-4"
              >
                hello@bevipvi.com
              </a>
              .
            </p>
          </section>
        </div>

        <p className="mt-10 text-xs text-[var(--text-muted)]">
          © {new Date().getFullYear()} BEVI — Between Visits Intelligence.
        </p>
      </div>
    </footer>
  );
}
