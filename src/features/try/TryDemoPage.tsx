import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { GlassCard, SignalLabel } from "@/features/shared/primitives";
import { BeviMark } from "@/features/shared/BeviMark";
import { ParticleField } from "@/features/shared/ParticleField";
import { copyToClipboard } from "@/lib/demo-clipboard";
import { generateDemoIntelligence } from "@/lib/demo.functions";
import type { AiOutput } from "@/lib/trial.functions";

const SAMPLES: Array<{ venue: string; note: string; label: string }> = [
  {
    label: "Pub — lapsed support",
    venue: "The Grand Hotel, Southport",
    note: "Caught Aaron between deliveries. Happy with how Byron is selling, sitting front of well. Pricing support lapsed a few months ago and he noticed on the last invoice. Wants help lifting staff confidence on cocktails, said the new crew don't upsell. Open to a training session next month. Didn't order today, said check back after the long weekend.",
  },
  {
    label: "Bistro — range review",
    venue: "Riverbend Bistro, Toowoomba",
    note: "Met Priya, venue manager. Doing a menu refresh in six weeks and wants two signature cocktails. Says gin moves well on weekends, rum barely turns. Worried about pour cost, asked what the margin looks like at $18 a serve. Current supplier slow on deliveries. Wants a sample pack before she commits.",
  },
  {
    label: "Bottle shop — volume push",
    venue: "Kirra Cellars",
    note: "Spoke to Dean. Foot traffic up over summer, ran out of the 700ml twice. Wants better fridge placement but space is tight. Complained a competitor gave him a case deal last month. Interested in a bundle for the Easter window if the numbers stack up. Follow up with what's available.",
  },
];

export function TryDemoPage() {
  const [venue, setVenue] = useState("");
  const [note, setNote] = useState("");
  const [output, setOutput] = useState<AiOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(false);

  const generate = useServerFn(generateDemoIntelligence);

  const canRun = venue.trim().length > 0 && note.trim().length >= 20 && !loading && !cooldown;

  async function onGenerate() {
    if (!canRun) return;
    setLoading(true);
    setError(null);
    setOutput(null);
    try {
      const res = await generate({
        data: { venue: venue.trim().slice(0, 120), rawNote: note.trim().slice(0, 4000) },
      });
      setOutput(res.output);
      setCooldown(true);
      setTimeout(() => setCooldown(false), 8000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const nbm = output?.next_best_move;
  const sig = output?.commercial_signals;

  return (
    <main className="relative pt-28 pb-24 min-h-screen">
      <ParticleField count={24} />
      <div className="absolute inset-0 grid-overlay pointer-events-none" aria-hidden />

      <div className="relative mx-auto max-w-5xl px-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-7">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-cyan)] animate-pulse" />
          <SignalLabel>LIVE DEMO — NOTHING IS SAVED</SignalLabel>
        </div>

        <h1 className="text-4xl md:text-6xl leading-[1.02] font-semibold text-white">
          Try a visit note. <span className="text-gradient">See the next move.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          Enter a venue and a rough post-visit note. BEVI rebuilds it into a CRM-ready record,
          commercial signals, a follow-up email and the next best commercial move — in real time.
        </p>

        <GlassCard tone="strong" className="mt-9 p-6 md:p-7">
          <div className="flex items-center gap-4">
            <BeviMark size={44} />
            <div>
              <SignalLabel>Post-visit input</SignalLabel>
              <div className="text-white text-lg font-semibold mt-1">Capture the visit</div>
            </div>
          </div>

          <div className="mt-6">
            <label className="text-xs uppercase tracking-[0.18em] text-white/50" htmlFor="venue">
              Venue name
            </label>
            <input
              id="venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value.slice(0, 120))}
              placeholder="e.g. The Grand Hotel, Southport"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-[var(--brand-cyan)]/50"
            />
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs uppercase tracking-[0.18em] text-white/50" htmlFor="note">
                Post-visit note
              </label>
              <span className="text-[11px] text-white/40">{note.trim().length}/4000</span>
            </div>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 4000))}
              rows={7}
              placeholder="Messy is fine. Who you saw, what they said, objections, orders, what you promised…"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-[var(--brand-cyan)]/50 leading-relaxed resize-y"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/40 mr-1">
              Or load a sample
            </span>
            {SAMPLES.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => {
                  setVenue(s.venue);
                  setNote(s.note);
                  setError(null);
                }}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/80 hover:bg-white/[0.09] transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onGenerate}
              disabled={!canRun}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-medium text-primary-foreground ambient-glow disabled:opacity-45 disabled:cursor-not-allowed"
              style={{ background: "var(--gradient-signal)" }}
            >
              {loading ? "BEVI is thinking…" : "Generate intelligence"}
            </button>
            {note.trim().length > 0 && note.trim().length < 20 && (
              <span className="text-xs text-white/50">Add a bit more detail to the note.</span>
            )}
            {cooldown && !loading && (
              <span className="text-xs text-white/50">Ready again in a few seconds.</span>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-[var(--signal-risk)]/40 bg-[var(--signal-risk)]/10 px-4 py-3 text-sm text-white/90">
              {error}
            </div>
          )}
        </GlassCard>

        {loading && (
          <GlassCard className="mt-6 p-6">
            <SignalLabel as="h2">Working</SignalLabel>
            <div className="mt-4 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-3 rounded-full bg-white/[0.06] animate-pulse" />
              ))}
            </div>
          </GlassCard>
        )}

        {output && (
          <div className="mt-8 space-y-5">
            {/* 1. NEXT BEST MOVE */}
            {nbm && (
              <GlassCard tone="strong" className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <SignalLabel as="h2">Next best move</SignalLabel>
                  <div className="flex gap-2 text-[10px] font-mono uppercase tracking-[0.18em]">
                    <span
                      className="px-2 py-1 rounded-md"
                      style={{
                        color: "var(--brand-cyan)",
                        background: "color-mix(in oklab, var(--brand-cyan) 12%, transparent)",
                      }}
                    >
                      {nbm.commercial_posture}
                    </span>
                    <span
                      className="px-2 py-1 rounded-md"
                      style={{
                        color: "var(--brand-violet)",
                        background: "color-mix(in oklab, var(--brand-violet) 12%, transparent)",
                      }}
                    >
                      {nbm.confidence} confidence
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-xl md:text-2xl text-white font-semibold leading-snug">
                  {nbm.recommendation}
                </p>
                <p className="mt-3 text-white/70 text-sm leading-relaxed">{nbm.reason}</p>
                {nbm.specific_ask && (
                  <div className="mt-4 p-3 rounded-lg border border-white/10 bg-white/5">
                    <SignalLabel>Specific ask</SignalLabel>
                    <p className="text-white/90 text-sm mt-1">{nbm.specific_ask}</p>
                  </div>
                )}
              </GlassCard>
            )}

            {/* 2. COMMERCIAL SIGNALS */}
            {sig && (
              <GlassCard tone="strong" className="p-6">
                <SignalLabel as="h2">Commercial signals</SignalLabel>
                <div className="mt-4 grid sm:grid-cols-2 gap-4">
                  <SignalBlock label="Buying style" tone="var(--brand-cyan)">
                    <p className="text-white/85 text-sm">{sig.buying_style || "—"}</p>
                  </SignalBlock>
                  <SignalBlock label="Margin pressure" tone="var(--signal-warning)">
                    <p className="text-white/85 text-sm">{sig.margin_pressure || "—"}</p>
                  </SignalBlock>
                  <SignalBlock label="Risk flags" tone="var(--signal-risk)">
                    {sig.risk_flags?.length ? (
                      <ul className="text-white/85 text-sm space-y-1">
                        {sig.risk_flags.map((r, i) => (
                          <li key={i}>· {r}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-white/50 text-sm">None flagged.</p>
                    )}
                  </SignalBlock>
                  <SignalBlock label="Opportunity signals" tone="var(--signal-positive)">
                    {sig.opportunity_signals?.length ? (
                      <ul className="text-white/85 text-sm space-y-1">
                        {sig.opportunity_signals.map((r, i) => (
                          <li key={i}>· {r}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-white/50 text-sm">None surfaced.</p>
                    )}
                  </SignalBlock>
                </div>
              </GlassCard>
            )}

            {/* 3. CRM NOTE */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-2">
                <SignalLabel as="h2">CRM NOTE</SignalLabel>
                <CopyButton text={output.combined_crm_note} />
              </div>
              <pre className="text-[13px] text-white/85 whitespace-pre-wrap font-sans leading-relaxed">
                {output.combined_crm_note}
              </pre>
            </GlassCard>

            {/* 4. FOLLOW-UP EMAIL */}
            {output.follow_up_email && (
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <SignalLabel as="h2">Follow-up Email</SignalLabel>
                  <CopyButton
                    text={`Subject: ${output.follow_up_email.subject}\n\n${output.follow_up_email.body}`}
                  />
                </div>
                <div className="text-xs text-white/50 mb-1">Subject</div>
                <div className="text-white text-sm font-medium">
                  {output.follow_up_email.subject}
                </div>
                <div className="text-xs text-white/50 mt-3 mb-1">Body</div>
                <pre className="text-[13px] text-white/85 whitespace-pre-wrap font-sans leading-relaxed">
                  {output.follow_up_email.body}
                </pre>
              </GlassCard>
            )}

            {/* 5. MISSED OPPORTUNITY */}
            {output.missed_opportunity && (
              <GlassCard className="p-5">
                <SignalLabel as="h2">Missed opportunity challenge</SignalLabel>
                <p className="mt-2 text-white/85 text-sm">{output.missed_opportunity}</p>
              </GlassCard>
            )}

            {/* Locked: the memory payoff */}
            <div className="grid md:grid-cols-2 gap-5">
              <LockedTile
                label="Account memory"
                body="In the full version BEVI keeps a running brief on this venue — buyer style, what sells, recurring objections and open actions — so the next visit starts warm."
              />
              <LockedTile
                label="Targeted deals to pitch"
                body="Upload price lists, promo decks and range cards and BEVI pitches the deals that actually fit this account, with the line to say at the end of the call."
              />
            </div>

            <GlassCard tone="strong" className="p-7">
              <SignalLabel as="h2">Nothing here was saved</SignalLabel>
              <h2 className="mt-3 text-2xl md:text-3xl font-semibold text-white">
                Create an account to keep account memory, files and deal pitches.
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                This demo runs once and forgets. The real BEVI carries every visit forward so each
                call builds on the last.
              </p>
              <Link
                to="/login"
                className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-medium text-primary-foreground ambient-glow"
                style={{ background: "var(--gradient-signal)" }}
              >
                Start with account memory
              </Link>
            </GlassCard>
          </div>
        )}
      </div>
    </main>
  );
}

function SignalBlock({
  label,
  tone,
  children,
}: {
  label: string;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: `color-mix(in oklab, ${tone} 30%, transparent)`,
        background: `color-mix(in oklab, ${tone} 7%, transparent)`,
      }}
    >
      <div
        className="text-[10px] font-mono uppercase tracking-[0.18em] mb-2"
        style={{ color: tone }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function LockedTile({ label, body }: { label: string; body: string }) {
  return (
    <GlassCard className="p-5 relative overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <SignalLabel as="h2">{label}</SignalLabel>
        <span className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-white/55">
          Full version
        </span>
      </div>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{body}</p>
      <div className="mt-4 space-y-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2.5 rounded-full bg-white/[0.06]"
            style={{ width: `${88 - i * 18}%` }}
          />
        ))}
      </div>
    </GlassCard>
  );
}

function CopyButton({ text }: { text: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await copyToClipboard(text);
        setStatus(ok ? "copied" : "failed");
        setTimeout(() => setStatus("idle"), 1800);
      }}
      className="text-xs px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/15 text-white"
    >
      {status === "copied"
        ? "Copied ✓"
        : status === "failed"
          ? "Couldn't copy — select manually"
          : "Copy"}
    </button>
  );
}
