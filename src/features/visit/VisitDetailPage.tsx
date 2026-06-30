import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { GlassCard, SignalLabel, SignalChip } from "@/features/shared/primitives";
import { BeviMark } from "@/features/shared/BeviMark";
import { getVisit } from "@/lib/trial.functions";

export function VisitDetailPage({ id }: { id: string }) {
  const fetchVisit = useServerFn(getVisit);
  const { data, isLoading, error } = useQuery({
    queryKey: ["visit", id],
    queryFn: () => fetchVisit({ data: { id } }),
  });
  const [copied, setCopied] = useState<"note" | "email" | null>(null);

  if (isLoading) {
    return (
      <main className="pt-28 pb-24 max-w-3xl mx-auto px-6 text-sm text-white/50">Loading visit…</main>
    );
  }
  if (error || !data) {
    return (
      <main className="pt-28 pb-24 max-w-3xl mx-auto px-6">
        <p className="text-sm text-[var(--signal-risk)]">Visit not found.</p>
        <Link to="/dashboard" className="text-xs text-white/70 hover:text-white mt-4 inline-block">
          ← Back to dashboard
        </Link>
      </main>
    );
  }

  const ai = data.ai_output;
  const created = new Date(data.created_at).toLocaleString();

  async function copy(text: string, which: "note" | "email") {
    await navigator.clipboard.writeText(normalizeCopyText(text));
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <main className="relative pt-28 pb-24">
      <div className="mx-auto max-w-3xl px-6">
        <Link to="/dashboard" className="text-xs text-white/60 hover:text-white">← Back to dashboard</Link>

        <header className="mt-4 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <BeviMark size={28} animated={false} />
            <div>
              <SignalLabel>Visit intelligence</SignalLabel>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">{data.account_name}</h1>
              <p className="text-xs text-white/50 mt-1">
                {data.account_contact ? `${data.account_contact} · ` : ""}{created}
              </p>
            </div>
          </div>
          <Link
            to="/trial"
            className="rounded-xl px-4 py-2 text-sm font-medium text-primary-foreground"
            style={{ background: "var(--gradient-signal)" }}
          >
            Open in recorder →
          </Link>
        </header>

        {!ai && (
          <GlassCard className="mt-8 p-6 text-sm text-white/60">
            This visit has no AI intelligence saved.
          </GlassCard>
        )}

        {ai && (
          <>
            {/* Next best move */}
            <GlassCard tone="strong" className="mt-8 p-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <SignalLabel as="h2">Next best move</SignalLabel>
                <span className="text-[10px] font-mono text-white/50">
                  {ai.next_best_move.commercial_posture} · {ai.next_best_move.confidence} confidence
                </span>
              </div>
              <div className="mt-3 text-lg text-white leading-snug font-medium">
                {ai.next_best_move.recommendation}
              </div>
              {ai.next_best_move.reason && (
                <p className="mt-2 text-sm text-white/70">{ai.next_best_move.reason}</p>
              )}
              {ai.next_best_move.specific_ask && (
                <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">Specific ask</div>
                  <div className="mt-1 text-sm text-white">{ai.next_best_move.specific_ask}</div>
                </div>
              )}
            </GlassCard>

            {/* Commercial signals */}
            <GlassCard className="mt-6 p-6">
              <SignalLabel as="h2">Commercial signals</SignalLabel>
              <dl className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">Buying style</dt>
                  <dd className="mt-1 text-white/90">{ai.commercial_signals.buying_style || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">Margin pressure</dt>
                  <dd className="mt-1 text-white/90">{ai.commercial_signals.margin_pressure || "—"}</dd>
                </div>
              </dl>
              {ai.commercial_signals.risk_flags?.length > 0 && (
                <div className="mt-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40 mb-2">Risk flags</div>
                  <div className="flex flex-wrap gap-2">
                    {ai.commercial_signals.risk_flags.map((r, i) => (
                      <SignalChip key={i} kind="risk" label={r} />
                    ))}
                  </div>
                </div>
              )}
              {ai.commercial_signals.opportunity_signals?.length > 0 && (
                <div className="mt-4">
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40 mb-2">Opportunities</div>
                  <div className="flex flex-wrap gap-2">
                    {ai.commercial_signals.opportunity_signals.map((r, i) => (
                      <SignalChip key={i} kind="buying" label={r} />
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>

            {/* CRM note */}
            <GlassCard className="mt-6 p-6">
              <div className="flex items-center justify-between">
                <SignalLabel as="h2">CRM note</SignalLabel>
                <button
                  onClick={() => copy(ai.combined_crm_note, "note")}
                  className="text-xs px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 text-white"
                >
                  {copied === "note" ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-white/85 leading-relaxed">
                {ai.combined_crm_note}
              </p>
            </GlassCard>

            {/* Follow-up email */}
            <GlassCard className="mt-6 p-6">
              <div className="flex items-center justify-between">
                <SignalLabel as="h2">Follow-up email</SignalLabel>
                <button
                  onClick={() =>
                    copy(`Subject: ${ai.follow_up_email.subject}\n\n${ai.follow_up_email.body}`, "email")
                  }
                  className="text-xs px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 text-white"
                >
                  {copied === "email" ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="mt-3 text-sm text-white/85">
                <div className="text-white font-medium">{ai.follow_up_email.subject}</div>
                <p className="mt-2 whitespace-pre-wrap leading-relaxed">{ai.follow_up_email.body}</p>
              </div>
            </GlassCard>

            {ai.missed_opportunity && (
              <GlassCard className="mt-6 p-6">
                <SignalLabel as="h2">Missed opportunity</SignalLabel>
                <p className="mt-3 text-sm text-white/85 leading-relaxed">{ai.missed_opportunity}</p>
              </GlassCard>
            )}

            {ai.targeted_deals && ai.targeted_deals.length > 0 && (
              <GlassCard className="mt-6 p-6">
                <SignalLabel as="h2">TARGETED DEALS TO PITCH NEXT CALL</SignalLabel>
                <ul className="mt-3 space-y-4">
                  {ai.targeted_deals.map((d, i) => (
                    <li key={i} className="rounded-lg border border-white/10 bg-white/5 p-4">
                      <div className="flex items-baseline justify-between flex-wrap gap-2">
                        <div className="text-white font-semibold">{d.product}</div>
                        <div className="text-xs text-white/60">{d.window}</div>
                      </div>
                      <div className="mt-1 text-sm text-[var(--brand-cyan)]">{d.deal}</div>
                      {d.eligibility && (
                        <div className="mt-1 text-xs text-white/60">Eligibility: {d.eligibility}</div>
                      )}
                      {d.why_relevant && (
                        <div className="mt-2 text-xs text-white/70">Why relevant: {d.why_relevant}</div>
                      )}
                      {d.pitch_line && (
                        <div className="mt-3 rounded-md border-l-2 border-[var(--brand-cyan)] bg-white/5 p-3 text-sm text-white/90 italic">
                          "{d.pitch_line}"
                        </div>
                      )}
                      {d.source_file && (
                        <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">
                          Source: {d.source_file}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            )}
          </>
        )}

        {/* Raw inputs */}
        <details className="mt-6 group">
          <summary className="cursor-pointer text-xs text-white/50 hover:text-white">
            Show raw note & supporting context
          </summary>
          <GlassCard className="mt-3 p-5">
            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">Raw note</div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-white/80">{data.raw_note}</p>
            {data.supporting_context && (
              <>
                <div className="mt-4 text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">
                  Supporting context
                </div>
                <p className="mt-1 whitespace-pre-wrap text-xs text-white/60">{data.supporting_context}</p>
              </>
            )}
          </GlassCard>
        </details>
      </div>
    </main>
  );
}

function normalizeCopyText(text: string) {
  if (!/%[0-9A-Fa-f]{2}/.test(text)) return text;
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}
