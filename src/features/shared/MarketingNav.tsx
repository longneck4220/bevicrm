import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BeviMark } from "@/features/shared/BeviMark";
import { PrimaryButton, type MarketingTo } from "@/features/shared/MarketingButtons";

const links: { label: string; to: MarketingTo }[] = [
  { label: "Product", to: "/product" },
  { label: "How it works", to: "/how-it-works" },
  { label: "Why BEVI", to: "/why-bevi" },
  { label: "Pricing", to: "/pricing" },
];

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Trap focus inside the mobile sheet while it is open and hand focus back to
  // the trigger on close, so keyboard users don't land at the top of the page.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";

    const focusables = () =>
      Array.from(
        sheetRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !sheetRef.current?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <header
        className={`sticky top-0 z-50 bg-background/85 backdrop-blur transition-all duration-300 ${
          scrolled ? "h-14 border-b border-hairline" : "h-[72px] border-b border-transparent"
        }`}
      >
        <nav className="shell grid h-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
          <Link to="/" className="flex w-fit items-center gap-2.5" aria-label="BEVI home">
            <BeviMark size={scrolled ? 24 : 28} />
            <span className="font-display text-[17px] font-medium tracking-[0.14em] text-foreground">
              BEVI
            </span>
          </Link>

          <ul className="hidden items-center gap-8 md:flex">
            {links.map((l) => (
              <li key={l.label}>
                <Link
                  to={l.to}
                  activeProps={{ className: "active text-foreground" }}
                  inactiveProps={{ className: "text-muted-foreground" }}
                  className="group relative py-1 text-sm transition-colors hover:text-foreground"
                >
                  {l.label}
                  <span className="pointer-events-none absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-primary transition-transform duration-200 group-hover:scale-x-100 [.active_&]:scale-x-100" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-end gap-3 md:gap-5">
            <Link
              to="/login"
              search={{ next: undefined }}
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              Sign in
            </Link>
            <PrimaryButton to="/try" className="hidden h-10 sm:inline-flex">
              Try a visit note →
            </PrimaryButton>

            <button
              ref={triggerRef}
              type="button"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
              className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-surface-2 md:hidden"
            >
              <span className="relative block h-3.5 w-5" aria-hidden>
                <span
                  className={`absolute left-0 block h-px w-5 bg-current transition-all duration-200 ${
                    open ? "top-1.5 rotate-45" : "top-0"
                  }`}
                />
                <span
                  className={`absolute left-0 top-1.5 block h-px w-5 bg-current transition-opacity duration-200 ${
                    open ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`absolute left-0 block h-px w-5 bg-current transition-all duration-200 ${
                    open ? "top-1.5 -rotate-45" : "top-3"
                  }`}
                />
              </span>
            </button>
          </div>
        </nav>
      </header>

      {open && (
        <div
          ref={sheetRef}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          style={{ top: 56 }}
          className="fixed inset-x-0 bottom-0 z-[60] flex flex-col overflow-y-auto bg-background md:hidden"
        >
          <ul className="shell flex flex-col divide-y divide-hairline border-t border-hairline">
            {links.map((l) => (
              <li key={l.label}>
                <Link
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[56px] items-center text-lg text-foreground"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/login"
                search={{ next: undefined }}
                onClick={() => setOpen(false)}
                className="flex min-h-[56px] items-center text-lg text-muted-foreground"
              >
                Sign in
              </Link>
            </li>
          </ul>
        </div>
      )}
    </>
  );
}
