import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BeviMark } from "@/features/shared/BeviMark";
import { GlassCard, SignalLabel } from "@/features/shared/primitives";

type OAuthResult = {
  data?: { client?: { name?: string }; redirect_url?: string; redirect_to?: string } | null;
  error?: { message: string } | null;
};
type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthNamespace }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/login", search: { next: location.pathname + location.searchStr } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="min-h-screen flex items-center justify-center px-4 text-sm text-white/70">
      Could not load this authorization request: {String((error as Error)?.message ?? error)}
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "an app";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-16">
      <div className="absolute inset-0 grid-overlay pointer-events-none" aria-hidden />
      <div className="relative w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <BeviMark size={36} />
          <span className="text-[18px] font-semibold tracking-[0.18em] text-white">BEVI</span>
        </div>
        <GlassCard tone="strong" className="p-6">
          <SignalLabel>Authorize access</SignalLabel>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            Connect {clientName} to BEVI
          </h1>
          <p className="mt-3 text-sm text-white/60">
            {clientName} will be able to read and add your accounts and visit notes, acting as you.
            Only approve clients you trust.
          </p>
          {error && <div className="mt-4 text-sm text-[var(--signal-risk)]">{error}</div>}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => decide(true)}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-primary-foreground disabled:opacity-40"
              style={{ background: "var(--gradient-signal)" }}
            >
              Approve
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => decide(false)}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 border border-white/15 disabled:opacity-40"
            >
              Deny
            </button>
          </div>
        </GlassCard>
      </div>
    </main>
  );
}
