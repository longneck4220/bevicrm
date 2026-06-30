import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { BeviMark } from "./BeviMark";
import { useAuth } from "@/hooks/use-auth";

export function BeviLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <BeviMark size={32} />
      {!compact && (
        <div className="leading-none">
          <div className="text-[16px] font-semibold tracking-[0.18em] text-white">BEVI</div>
          <div className="signal-label font-sans font-bold text-lg !text-[9px] mt-1" style={{ color: "var(--brand-cyan)" }}>
            Win the next call
          </div>
        </div>
      )}
    </Link>
  );
}

const baseLinks: { to: "/trial" | "/dashboard" | "/mobile"; label: string }[] = [
  { to: "/trial", label: "Trial" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/mobile", label: "Mobile" },
];
const adminLink = { to: "/admin" as const, label: "Admin" };

export function TopNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="glass-strong rounded-2xl px-4 py-3 flex items-center justify-between ambient-glow">
          <BeviLogo />
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => {
              const active = path === l.to || path.startsWith(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`px-3.5 py-1.5 rounded-lg text-sm transition-colors ${
                    active ? "text-white bg-white/5" : "text-muted-foreground hover:text-white"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 min-w-0">
                  <span className="text-xs text-white/60 truncate max-w-[180px]">
                    {(() => {
                      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
                      const name =
                        (meta.full_name as string) ||
                        (meta.name as string) ||
                        (meta.first_name as string) ||
                        (user.email ? user.email.split("@")[0] : "there");
                      const first = String(name).split(" ")[0];
                      const pretty = first.charAt(0).toUpperCase() + first.slice(1);
                      return `Hi ${pretty}`;
                    })()}
                  </span>
                  {isAdmin && (
                    <span
                      className="shrink-0 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider"
                      style={{ background: "var(--brand-cyan)", color: "#000" }}
                    >
                      Admin
                    </span>
                  )}
                </div>
                <button
                  onClick={async () => {
                    await signOut();
                    navigate({ to: "/" });
                  }}
                  className="text-xs px-3 py-2 rounded-lg text-white/80 hover:bg-white/5"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex text-xs signal-label font-sans font-bold text-lg !text-white/80 px-3 py-2 rounded-lg hover:bg-white/5"
                >
                  Sign in
                </Link>
                <Link
                  to="/login"
                  className="relative inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground"
                  style={{ background: "var(--gradient-signal)" }}
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
