import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { BeviMark } from "@/features/shared/BeviMark";
import { GlassCard, SignalLabel } from "@/features/shared/primitives";
import { fetchRoleForUser, homeForRole } from "@/lib/roles";

const TITLE = "Sign in · BEVI";
const DESCRIPTION =
  "Sign in to BEVI to review post-visit intelligence, follow-ups, and the next best move for every account in your territory.";
const URL = "https://bevicrm.lovable.app/login";

function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export const Route = createFileRoute("/_public/login")({
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
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | null>(null);

  async function handleSocial(provider: "google" | "apple") {
    setError(null);
    setNotice(null);
    setSocialLoading(provider);
    try {
      // redirect_uri must be a public same-origin URL; the intended
      // destination is restored below once the session is confirmed.
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) return; // full-page flow — browser goes to the provider
      const session = await supabase.auth.getSession();
      if (!session.data.session) throw new Error("Sign-in did not complete");
      if (redirectTo) {
        window.location.href = redirectTo;
        return;
      }
      const role = await fetchRoleForUser(session.data.session.user.id);
      navigate({ to: homeForRole(role) });
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? `${provider === "google" ? "Google" : "Apple"} sign-in failed: ${err.message}`
          : `${provider === "google" ? "Google" : "Apple"} sign-in failed`,
      );
    } finally {
      setSocialLoading(null);
    }
  }

  async function handleForgotPassword() {
    setError(null);
    setNotice(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Enter your email address first, then request the reset link.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message || "Could not send the reset email. Try again in a moment.");
      return;
    }
    setNotice("Reset link sent. Check your email and follow the link to set a new password.");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
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
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) throw error;
      }
      if (redirectTo) {
        window.location.href = redirectTo;
        return;
      }
      const { data: current } = await supabase.auth.getUser();
      const role = current.user ? await fetchRoleForUser(current.user.id) : null;
      navigate({ to: homeForRole(role) });
    } catch (err) {
      const message =
        err instanceof Error && err.message.toLowerCase().includes("invalid login credentials")
          ? "Those sign-in details were not accepted. Please check your email and password, or create a new account if you do not have one yet."
          : err instanceof Error
            ? err.message
            : "Authentication failed";
      setError(message);
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
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="email"
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

          <div className="mt-5 flex items-center gap-3" aria-hidden>
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] uppercase tracking-[0.14em] text-white/40">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={socialLoading !== null}
              onClick={() => handleSocial("google")}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white transition-colors hover:bg-white/10 disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.17 3.57-8.81Z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24Z" />
                <path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.29a12 12 0 0 0 0 10.76l3.98-3.1Z" />
                <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.44-3.44A11.98 11.98 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.1C6.22 6.88 8.87 4.77 12 4.77Z" />
              </svg>
              {socialLoading === "google" ? "…" : "Google"}
            </button>
            <button
              type="button"
              disabled={socialLoading !== null}
              onClick={() => handleSocial("apple")}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white transition-colors hover:bg-white/10 disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden>
                <path d="M17.05 12.54c-.03-2.89 2.36-4.27 2.47-4.34-1.35-1.97-3.44-2.24-4.18-2.27-1.78-.18-3.47 1.05-4.37 1.05-.9 0-2.29-1.02-3.77-1-1.94.03-3.73 1.13-4.72 2.86-2.01 3.49-.51 8.66 1.45 11.49.96 1.39 2.1 2.94 3.6 2.88 1.45-.06 2-.93 3.75-.93s2.25.93 3.78.9c1.56-.03 2.55-1.41 3.5-2.8 1.1-1.61 1.55-3.17 1.58-3.25-.04-.02-3.03-1.16-3.09-4.59ZM14.16 4.05c.79-.96 1.33-2.3 1.18-3.63-1.14.05-2.53.76-3.35 1.72-.74.85-1.38 2.21-1.21 3.52 1.28.1 2.58-.65 3.38-1.61Z" />
              </svg>
              {socialLoading === "apple" ? "…" : "Apple"}
            </button>
          </div>

          {mode === "signin" && (
            <button
              type="button"
              disabled={loading}
              onClick={handleForgotPassword}
              className="mt-5 w-full text-xs text-white/60 hover:text-white disabled:opacity-40"
            >
              Forgot your password? Email me a reset link →
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setNotice(null);
            }}
            className="mt-3 w-full text-xs text-white/60 hover:text-white"
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
