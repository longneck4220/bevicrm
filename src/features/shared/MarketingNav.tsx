import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const NAV_LINKS = [
  { label: "Product", href: "/#outputs" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Why BEVI", href: "/#why" },
  { label: "Pricing", href: "/how-it-works#pricing" },
];

export function BeviWordmark() {
  return (
    <Link
      to="/"
      className="bevi-focus inline-flex items-center rounded-md px-1 font-display text-[22px] font-medium tracking-[-0.02em] text-[var(--text-primary)]"
      aria-label="BEVI home"
    >
      B<span className="text-[var(--accent-teal)]">.</span>
    </Link>
  );
}

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-200"
        style={{
          background: "rgba(10,16,32,0.8)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${scrolled ? "rgba(255,255,255,0.08)" : "transparent"}`,
        }}
      >
        <div
          className="mx-auto flex max-w-[1200px] items-center justify-between px-6 transition-[height] duration-200"
          style={{ height: scrolled ? 56 : 72 }}
        >
          <BeviWordmark />

          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="bevi-focus rounded-lg px-3 py-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/login"
              search={{ next: undefined }}
              className="bevi-focus rounded-lg px-3 py-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            >
              Sign in
            </Link>
            <Link to="/try" className="bevi-btn-primary">
              Try a visit note
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="bevi-focus grid h-11 w-11 place-items-center rounded-lg md:hidden"
          >
            <span className="relative block h-[10px] w-5">
              <span className="absolute inset-x-0 top-0 h-px bg-[var(--text-primary)]" />
              <span className="absolute inset-x-0 bottom-0 h-px bg-[var(--text-primary)]" />
            </span>
          </button>
        </div>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex flex-col bg-[var(--bg-base)] px-6 py-5 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="flex items-center justify-between">
            <BeviWordmark />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="bevi-focus grid h-11 w-11 place-items-center rounded-lg text-[var(--text-primary)]"
            >
              ✕
            </button>
          </div>
          <nav aria-label="Mobile" className="mt-10 flex flex-col gap-2">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="bevi-focus flex min-h-[44px] items-center rounded-lg font-display text-2xl text-[var(--text-primary)]"
              >
                {l.label}
              </a>
            ))}
            <Link
              to="/login"
              search={{ next: undefined }}
              onClick={() => setOpen(false)}
              className="bevi-focus flex min-h-[44px] items-center rounded-lg font-display text-2xl text-[var(--text-muted)]"
            >
              Sign in
            </Link>
          </nav>
        </div>
      )}

      {/* persistent mobile CTA bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-[55] border-t px-4 py-3 md:hidden"
        style={{
          background: "rgba(10,16,32,0.9)",
          backdropFilter: "blur(12px)",
          borderColor: "var(--border-hairline)",
        }}
      >
        <Link to="/try" className="bevi-btn-primary w-full">
          Try a visit note
        </Link>
      </div>
    </>
  );
}
