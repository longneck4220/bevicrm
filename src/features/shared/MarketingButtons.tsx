import { Link } from "@tanstack/react-router";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Public routes a marketing CTA may point at. Kept as an explicit union so the
 * router's typed `to` stays satisfied — widen it when a public route is added.
 */
export type MarketingTo = "/" | "/product" | "/how-it-works" | "/why-bevi" | "/pricing" | "/try";

const base =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium transition-[background-color,filter,transform,border-color] duration-[120ms] active:scale-[0.98]";

const primaryLook =
  "bg-primary text-primary-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.22),inset_0_-1px_0_0_rgba(0,0,0,0.18)] hover:brightness-110";

const secondaryLook =
  "border border-hairline bg-transparent text-foreground hover:border-primary/40 hover:bg-surface-2";

/** Router link styled as the primary call to action. */
export function PrimaryButton({
  children,
  to,
  className = "",
}: {
  children: ReactNode;
  to: MarketingTo;
  className?: string;
}) {
  return (
    <Link to={to} className={`${base} ${primaryLook} ${className}`}>
      {children}
    </Link>
  );
}

/** Plain anchor for in-page hashes and external destinations. */
export function SecondaryButton({
  children,
  href,
  className = "",
}: {
  children: ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <a href={href} className={`${base} ${secondaryLook} ${className}`}>
      {children}
    </a>
  );
}

/** Real <button> variants for interactive UI (the demo page, forms). */
export function PrimaryAction({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`${base} ${primaryLook} disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryAction({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`${base} ${secondaryLook} ${className}`}>
      {children}
    </button>
  );
}
