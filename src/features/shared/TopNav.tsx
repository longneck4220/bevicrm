import { useEffect, useState } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { BeviMark } from "./BeviMark";
import { GetBeviDialog } from "./GetBeviDialog";
import { useAuth } from "@/hooks/use-auth";

export function BeviLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <BeviMark size={30} />
      {!compact && (
        <div className="leading-none">
          <div className="text-[16px] font-semibold tracking-[0.18em] text-white">BEVI</div>
          <div
            className="signal-label font-sans font-bold !text-[9px] mt-1"
            style={{ color: "var(--brand-cyan)" }}
          >
            Win the next call
          </div>
        </div>
      )}
    </Link>
  );
}

type NavItem = { to: "/" | "/how-it-works" | "/try" | "/dashboard" | "/mobile" | "/admin"; label: string };

const publicLinks: NavItem[] = [
  { to: "/", label: "Home" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/try", label: "Try a visit note" },
];
const appLinks: NavItem[] = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/mobile", label: "Mobile" },
];
const adminLink: NavItem = { to: "/admin", label: "Admin" };

export function TopNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [getBevi, setGetBevi] = useState(false);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  const items: NavItem[] = [
    ...publicLinks,
    ...(user ? appLinks : []),
    ...(isAdmin ? [adminLink] : []),
  ];

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 border-b bg-[#0A1020]/80 backdrop-blur-xl transition-[height,border-color] duration-200 ease-out ${
          compact ? "h-14 border-white/10" : "h-[72px] border-transparent"
        }`}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-5 sm:px-6">
          <BeviLogo />

          <div className="flex min-w-0 items-center gap-2">
            {user ? (
              <>
                <span
                  className="max-w-[38vw] truncate rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white sm:max-w-[220px]"
                  title={displayName}
                >
                  {displayName}
                </span>
                <button
                  onClick={async () => {
                    await signOut();
                    navigate({ to: "/" });
                  }}
                  className="inline-flex min-h-[40px] shrink-0 items-center rounded-full border border-white/15 px-4 text-sm font-medium text-white/85 hover:bg-white/5"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setGetBevi(true)}
                  className="inline-flex min-h-[40px] shrink-0 items-center rounded-full px-4 text-sm font-semibold text-primary-foreground"
                  style={{ background: "var(--gradient-signal)" }}
                >
                  Get a BEVI
                </button>
                <Link
                  to="/login"
                  search={{ next: undefined }}
                  className="inline-flex min-h-[40px] shrink-0 items-center rounded-full border border-white/15 px-4 text-sm font-medium text-white/85 hover:bg-white/5"
                >
                  Sign in
                </Link>
              </>
            )}


            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
              aria-expanded={menuOpen}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white/85 hover:bg-white/5"
            >
              <span className="flex w-5 flex-col gap-[5px]">
                <span className="block h-[2px] w-full rounded bg-current" />
                <span className="block h-[2px] w-full rounded bg-current" />
                <span className="block h-[2px] w-full rounded bg-current" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <>
          <button
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/50"
          />
          <nav className="fixed right-4 left-4 sm:left-auto sm:w-80 top-[76px] z-50 overflow-hidden rounded-2xl border border-white/10 bg-[#121A2E] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
            {items.map((l) => {
              const active = l.to === "/" ? path === "/" : path.startsWith(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMenuOpen(false)}
                  className={`block rounded-xl px-4 py-3 text-sm transition-colors ${
                    active ? "bg-white/5 text-white" : "text-white/75 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            <div className="my-2 h-px bg-white/8" />
            {user ? (
              <button
                onClick={async () => {
                  setMenuOpen(false);
                  await signOut();
                  navigate({ to: "/" });
                }}
                className="block w-full rounded-xl px-4 py-3 text-left text-sm text-white/75 hover:bg-white/5 hover:text-white"
              >
                Sign out
              </button>
            ) : (
              <Link
                to="/login"
                search={{ next: undefined }}
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm text-white/75 hover:bg-white/5 hover:text-white"
              >
                Sign in
              </Link>
            )}
          </nav>
        </>
      )}

      <GetBeviDialog open={getBevi} onClose={() => setGetBevi(false)} />
    </>
  );
}
