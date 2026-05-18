import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";

export function BeviLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className="relative w-8 h-8">
        <div
          className="absolute inset-0 rounded-lg blur-md opacity-70 group-hover:opacity-100 transition-opacity"
          style={{ background: "var(--gradient-signal)" }}
        />
        <div
          className="relative w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "var(--gradient-signal)" }}
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-white"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          />
        </div>
      </div>
      {!compact && (
        <div className="leading-none">
          <div className="text-[15px] font-semibold tracking-tight text-white">BEVI</div>
          <div className="signal-label !text-[9px] mt-0.5">Sales Intelligence</div>
        </div>
      )}
    </Link>
  );
}

const links: { to: "/" | "/dashboard" | "/mobile"; label: string }[] = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/mobile", label: "Mobile" },
];

export function TopNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="glass-strong rounded-2xl px-4 py-3 flex items-center justify-between ambient-glow">
          <BeviLogo />
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => {
              const active = path === l.to || (l.to !== "/" && path.startsWith(l.to));
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
            <Link
              to="/dashboard"
              className="hidden sm:inline-flex text-xs signal-label !text-white/80 px-3 py-2 rounded-lg hover:bg-white/5"
            >
              Sign in
            </Link>
            <Link
              to="/dashboard"
              className="relative inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-primary-foreground"
              style={{ background: "var(--gradient-signal)" }}
            >
              Open Command Center
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
