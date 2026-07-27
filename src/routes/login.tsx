import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BeviMark } from "@/features/shared/BeviMark";
import { GlassCard, SignalLabel } from "@/features/shared/primitives";

const TITLE = "Sign in · BEVI";
const DESCRIPTION =
  "Sign in to BEVI to review post-visit intelligence, follow-ups, and the next best move for every account in your territory.";
const URL = "https://bevicrm.lovable.app/login";

function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: URL },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const redirectTo = safeNext(next);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${redirectTo ?? "/dashboard"}`,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (!data.session) {
          // Email confirmation is required — there's no session yet, so
          // navigating to /dashboard would just bounce straight back to
          // /login with no explanation. Tell the user what's happening instead.
          setNotice("Check your email to confirm your account, then sign in.");
          setMode("signin");
          setLoading(false);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      if (redirectTo) {
        window.location.href = redirectTo;
        return;
      }
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-16">
      <div className="absolute inset-0 grid-overlay pointer-events-none" aria-hidden />
      <div className="relative w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <BeviMark size={36} />
          <span className="text-[18px] font-semibold tracking-[0.18em] text-white">BEVI</span>
        </Link>

        <GlassCard tone="strong" className="p-6">
          <SignalLabel>{mode === "signin" ? "Sign in" : "Create account"}</SignalLabel>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            {mode === "signin" ? "Welcome back" : "Get started"}
          </h1>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            {mode === "signup" && (
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name"
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[var(--brand-cyan)]"
              />
            )}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[var(--brand-cyan)]"
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[var(--brand-cyan)]"
            />
            {notice && <div className="text-sm text-[var(--signal-positive)]">{notice}</div>}
            {error && <div className="text-sm text-[var(--signal-risk)]">{error}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-primary-foreground disabled:opacity-40"
              style={{ background: "var(--gradient-signal)" }}
            >
              {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setNotice(null);
            }}
            className="mt-5 w-full text-xs text-white/60 hover:text-white"
          >
            {mode === "signin"
              ? "No account yet? Create one →"
              : "Already have an account? Sign in →"}
          </button>
        </GlassCard>
      </div>
    </main>
  );
}
