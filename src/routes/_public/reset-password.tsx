import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BeviMark } from "@/features/shared/BeviMark";
import { GlassCard, SignalLabel } from "@/features/shared/primitives";

const TITLE = "Set a new password · BEVI";
const DESCRIPTION = "Choose a new password for your BEVI account.";

export const Route = createFileRoute("/_public/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // The recovery link puts a session in place; give the client a beat to pick
    // it up from the URL before deciding the link is stale.
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        setReady(true);
        return;
      }
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) setReady(true);
      });
      setTimeout(() => sub.subscription.unsubscribe(), 8000);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message || "Could not update the password. Request a new link and try again.");
      return;
    }
    navigate({ to: "/dashboard" });
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
          <SignalLabel>Reset password</SignalLabel>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            Set a new password
          </h1>

          {!ready && (
            <p className="mt-4 text-sm text-white/60">
              Open this page from the reset link in your email. If you arrived here directly, request
              a new link from the{" "}
              <Link to="/login" className="underline">
                sign-in page
              </Link>
              .
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[var(--brand-cyan)]"
            />
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[var(--brand-cyan)]"
            />
            {error && <div className="text-sm text-[var(--signal-risk)]">{error}</div>}
            <button
              type="submit"
              disabled={loading || !ready}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-primary-foreground disabled:opacity-40"
              style={{ background: "var(--gradient-signal)" }}
            >
              {loading ? "…" : "Save new password"}
            </button>
          </form>
        </GlassCard>
      </div>
    </main>
  );
}
