import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PrimaryAction, SecondaryAction } from "@/features/shared/MarketingButtons";
import { copyToClipboard } from "@/lib/clipboard";
import { generateDemoIntelligence } from "@/lib/demo.functions";
import type { AiOutput } from "@/lib/trial.functions";

const SAMPLES: Array<{ venue: string; note: string; label: string }> = [
  {
    label: "Pub — lapsed support",
    venue: "The Royal Oak",
    note: "Caught Aaron between deliveries. Happy with how Byron is selling, sitting front of well. Pricing support lapsed a few months ago and he noticed on the last invoice. Wants help lifting staff confidence on cocktails, said the new crew don't upsell. Open to a training session next month. Didn't order today, said check back after the long weekend.",
  },
  {
    label: "Bistro — range review",
    venue: "Riverbend Bistro",
    note: "Met Priya, venue manager. Doing a menu refresh in six weeks and wants two signature cocktails. Says gin moves well on weekends, rum barely turns. Worried about pour cost, asked what the margin looks like at $18 a serve. Current supplier slow on deliveries. Wants a sample pack before she commits.",
  },
  {
    label: "Bottle shop — volume push",
    venue: "Coastal Cellars",
    note: "Spoke to Dean. Foot traffic up over summer, ran out of the 700ml twice. Wants better fridge placement but space is tight. Complained a competitor gave him a case deal last month. Interested in a bundle for the Easter window if the numbers stack up. Follow up with what's available.",
  },
  {
    label: "Bar — new opening",
    venue: "Sable Rooftop",
    note: "New venue opening next month. Bar manager Jake wants a tight, premium spirits list — around 25 SKUs. Focus on local gins and rums with a story. Needs staff training built into any launch deal. Asked for terms and delivery schedule. Wants samples by Friday.",
  },
  {
    label: "Hotel — event play",
    venue: "Marina Hotel",
    note: "Functions manager Sarah is planning wedding season. Currently buys sparkling by the case from a competitor but price went up. Wants a prosecco alternative and a rosé for summer packages. Needs a tasting for the events team. Mentioned previous supplier was slow to respond.",
  },
  {
    label: "Restaurant — competitor switch",
    venue: "Bistro Lumière",
    note: "Head chef Marco is unhappy with current supplier's consistency on vermouth. Wants to switch before the winter menu launches. Asks for spec sheets and pricing on three vermouths and two amaros. Interested in a back-bar training session for the floor team.",
  },
];

function Label({ children }: { children: string }) {
  return (
    <p className="font-mono text-[13px] uppercase tracking-[0.06em] text-muted-foreground">
      {children}
    </p>
  );
}

export function TryDemoPage() {
  const [venue, setVenue] = useState("");
  const [note, setNote] = useState("");
  const [output, setOutput] = useState<AiOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(false);

  const generate = useServerFn(generateDemoIntelligence);

  const canRun = venue.trim().length > 0 && note.trim().length >= 20 && !loading && !cooldown;

  function onReset() {
    setVenue("");
    setNote("");
    setOutput(null);
    setError(null);
    setCooldown(false);
  }

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
    <main id="main" className="section-y">
      <div className="shell max-w-4xl">
        <p className="eyebrow">Live demo — nothing is saved</p>
        <h1 className="mt-5 text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.04] tracking-[-0.02em] text-foreground">
          Try a visit note. See the next move.
        </h1>
        <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">
          Enter a venue name and a rough post-visit note. BEVI builds a CRM-ready record, commercial
          signals and a follow-up email, then gives you the next best commercial move — in real
          time.
        </p>

        <section className="panel mt-10">
          <Label>Post-visit input</Label>

          <div className="mt-6">
            <label htmlFor="venue" className="block text-sm text-foreground">
              Venue name
            </label>
            <input
              id="venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value.slice(0, 120))}
              placeholder="e.g. The Royal Oak"
              className="mt-2 min-h-[44px] w-full rounded-lg border border-hairline bg-surface-2 px-4 text-[15px] text-foreground placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="mt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="note" className="block text-sm text-foreground">
                Post-visit note
              </label>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {note.trim().length}/4000
              </span>
            </div>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 4000))}
              rows={7}
              placeholder="Messy is fine. Who you saw, what they said, objections, orders, what you promised…"
              className="mt-2 min-h-[160px] w-full resize-y rounded-xl border border-hairline bg-surface-2 p-4 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="mt-5 rounded-xl border border-hairline bg-surface-2 p-4">
            <p className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.06em] text-muted-foreground">
              <span className="signal-dot h-1.5 w-1.5" />
              Try an instant sample
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SAMPLES.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => {
                    setVenue(s.venue);
                    setNote(s.note);
                    setError(null);
                  }}
                  className="min-h-[44px] rounded-full border border-hairline px-4 text-[13px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <PrimaryAction onClick={onGenerate} disabled={!canRun}>
              {loading && (
                <span
                  aria-hidden
                  className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                />
              )}
              {loading ? "BEVI is thinking…" : "Generate intelligence"}
            </PrimaryAction>
            <SecondaryAction onClick={onReset}>Reset demo</SecondaryAction>
            {note.trim().length > 0 && note.trim().length < 20 && (
              <span className="text-[13px] text-muted-foreground">
                Add a bit more detail to the note.
              </span>
            )}
            {cooldown && !loading && (
              <span className="text-[13px] text-muted-foreground">
                Ready again in a few seconds.
              </span>
            )}
          </div>

          <p className="mt-4 font-mono text-[13px] uppercase tracking-[0.06em] text-muted-foreground">
            No signup · Nothing saved · Interpreted live
          </p>

          {error && (
            <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-[15px] text-foreground">
              {error}
            </p>
          )}
        </section>

        {loading && (
          <section className="panel mt-6" aria-live="polite">
            <Label>Working</Label>
            <div className="mt-4 animate-pulse space-y-3" aria-hidden>
              <div className="h-3 w-full rounded bg-surface-2" />
              <div className="h-3 w-4/5 rounded bg-surface-2" />
              <div className="h-3 w-2/3 rounded bg-surface-2" />
            </div>
          </section>
        )}

        {output && (
          <div className="mt-8 space-y-4" aria-live="polite">
            {/* 1. NEXT BEST MOVE */}
            {nbm && (
              <section className="panel rise">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Label>Next best move</Label>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-[12px] uppercase tracking-[0.06em] text-primary">
                      {nbm.commercial_posture}
                    </span>
                    <span className="rounded-full border border-hairline bg-surface-2 px-3 py-1 font-mono text-[12px] uppercase tracking-[0.06em] text-muted-foreground">
                      {nbm.confidence} confidence
                    </span>
                  </div>
                </div>
                <p className="mt-5 font-display text-xl leading-snug tracking-[-0.01em] text-foreground md:text-h3">
                  {nbm.recommendation}
                </p>
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                  {nbm.reason}
                </p>
                {nbm.specific_ask && (
                  <div className="mt-5 rounded-lg border border-hairline bg-surface-2 p-4">
                    <Label>Specific ask</Label>
                    <p className="mt-2 text-[15px] leading-relaxed text-foreground">
                      {nbm.specific_ask}
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* 2. COMMERCIAL SIGNALS */}
            {sig && (
              <section className="panel">
                <Label>Commercial signals</Label>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <SignalBlock label="Buying style">
                    <p className="text-[15px] text-muted-foreground">{sig.buying_style || "—"}</p>
                  </SignalBlock>
                  <SignalBlock label="Margin pressure">
                    <p className="text-[15px] text-muted-foreground">
                      {sig.margin_pressure || "—"}
                    </p>
                  </SignalBlock>
                  <SignalBlock label="Risk flags" tone="risk">
                    {sig.risk_flags?.length ? (
                      <ul className="space-y-1 text-[15px] text-muted-foreground">
                        {sig.risk_flags.map((r, i) => (
                          <li key={i}>· {r}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[15px] text-muted-foreground/60">None flagged.</p>
                    )}
                  </SignalBlock>
                  <SignalBlock label="Opportunity signals" tone="good">
                    {sig.opportunity_signals?.length ? (
                      <ul className="space-y-1 text-[15px] text-muted-foreground">
                        {sig.opportunity_signals.map((r, i) => (
                          <li key={i}>· {r}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[15px] text-muted-foreground/60">None surfaced.</p>
                    )}
                  </SignalBlock>
                </div>
              </section>
            )}

            {/* 3. CRM NOTE */}
            <section className="panel">
              <div className="flex items-start justify-between gap-4">
                <Label>CRM note</Label>
                <CopyButton text={output.combined_crm_note} />
              </div>
              <pre className="mt-4 whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-muted-foreground">
                {output.combined_crm_note}
              </pre>
            </section>

            {/* 4. FOLLOW-UP EMAIL */}
            {output.follow_up_email && (
              <section className="panel">
                <div className="flex items-start justify-between gap-4">
                  <Label>Follow-up email</Label>
                  <CopyButton
                    text={`Subject: ${output.follow_up_email.subject}\n\n${output.follow_up_email.body}`}
                    label="Copy full email"
                  />
                </div>
                <div className="mt-4 space-y-3">
                  <div className="rounded-lg border border-hairline bg-surface-2 p-3">
                    <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-muted-foreground">
                      Subject
                    </p>
                    <p className="mt-1 text-[15px] text-foreground">
                      {output.follow_up_email.subject}
                    </p>
                  </div>
                  <div className="rounded-lg border border-hairline bg-surface-2 p-3">
                    <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-muted-foreground">
                      Body
                    </p>
                    <pre className="mt-2 whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-muted-foreground">
                      {output.follow_up_email.body}
                    </pre>
                  </div>
                </div>
              </section>
            )}

            {/* 5. MISSED OPPORTUNITY */}
            {output.missed_opportunity && (
              <section className="panel">
                <Label>Missed opportunity challenge</Label>
                <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                  {output.missed_opportunity}
                </p>
              </section>
            )}

            {/* Locked: the memory payoff */}
            <div className="grid gap-4 md:grid-cols-2">
              <LockedTile
                label="Account memory"
                body="In the full version BEVI keeps a running brief on this venue — buyer style, what sells, recurring objections and open actions — so the next visit starts warm."
              />
              <LockedTile
                label="Targeted deals to pitch"
                body="Upload price lists, promo decks and range cards and BEVI pitches the deals that actually fit this account, with the line to say at the end of the call."
              />
            </div>

            <section className="panel">
              <Label>Nothing here was saved</Label>
              <h2 className="mt-4 text-2xl leading-snug tracking-[-0.02em] text-foreground md:text-h3">
                Create an account to keep account memory, files and deal pitches.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                This demo runs once and forgets. The real BEVI carries every visit forward so each
                call builds on the last.
              </p>
              <Link
                to="/login"
                search={{ next: undefined }}
                className="mt-7 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-[filter] hover:brightness-110"
              >
                Start with account memory
              </Link>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function SignalBlock({
  label,
  tone = "neutral",
  children,
}: {
  label: string;
  tone?: "neutral" | "good" | "risk";
  children: ReactNode;
}) {
  const border =
    tone === "risk"
      ? "border-destructive/30"
      : tone === "good"
        ? "border-primary/30"
        : "border-hairline";
  const labelTone =
    tone === "risk"
      ? "text-destructive"
      : tone === "good"
        ? "text-primary"
        : "text-muted-foreground";
  return (
    <div className={`rounded-lg border bg-surface-2 p-4 ${border}`}>
      <p className={`font-mono text-[12px] uppercase tracking-[0.06em] ${labelTone}`}>{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function LockedTile({ label, body }: { label: string; body: string }) {
  return (
    <section className="panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Label>{label}</Label>
        <span className="rounded-full border border-hairline px-3 py-1 font-mono text-[12px] uppercase tracking-[0.06em] text-muted-foreground">
          Full version
        </span>
      </div>
      <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{body}</p>
      <div className="mt-5 space-y-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2.5 rounded-full bg-surface-2"
            style={{ width: `${88 - i * 18}%` }}
          />
        ))}
      </div>
    </section>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await copyToClipboard(text);
        setStatus(ok ? "copied" : "failed");
        setTimeout(() => setStatus("idle"), 1800);
      }}
      className="min-h-[36px] shrink-0 rounded-md border border-hairline px-3 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
    >
      {status === "copied"
        ? "Copied ✓"
        : status === "failed"
          ? "Couldn't copy — select manually"
          : label}
    </button>
  );
}
