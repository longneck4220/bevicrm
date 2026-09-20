import { Link } from "@tanstack/react-router";
import { BeviLogo } from "@/features/shared/TopNav";
import { useAuth } from "@/hooks/use-auth";
import { displayNameFor } from "@/lib/roles";
import { SignOutLink } from "./SignOutLink";

/**
 * Shared header for the manager section. The global TopNav is hidden here
 * (see routes/_authenticated.tsx / TopNav's own /manager check) because this
 * section owns its own sticky bar — but it still needs the real BEVI logo
 * (as a way back to the rest of the app) and the actual signed-in manager's
 * name, not a placeholder.
 */
export function ManagerHeader({ subtitle }: { subtitle?: string }) {
  const { user } = useAuth();
  const displayName = displayNameFor(user, "Manager");

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="relative mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
        <BeviLogo compact />
        {subtitle && (
          <span className="absolute left-1/2 hidden -translate-x-1/2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground sm:block">
            {subtitle}
          </span>
        )}
        <span className="flex items-center gap-3">
          <Link
            to="/account"
            className="text-sm font-medium text-foreground transition-colors duration-200 hover:text-muted-foreground"
            title="Account settings"
          >
            {displayName}
          </Link>
          <SignOutLink />
        </span>
      </div>
    </header>
  );
}
