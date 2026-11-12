import { useState } from "react";
import { GlassCard, SignalLabel } from "@/features/shared/primitives";

export type LastVisit = { created_at: string; ai_output: unknown } | null;

type Props = {
  accountName: string;
  memory: string | null;
  lastVisit: LastVisit;
  open: boolean;
  onToggle: () => void;
};

type Deal = {
  product?: string;
  deal?: string;
  eligibility?: string;
  window?: string;
  pitch_line?: string;
  source_file?: string;
};

const POSTURE_COLOR: Record<string, string> = {
  hold: "var(--signal-warning)",
  push: "var(--signal-risk)",
  recommend: "var(--brand-cyan)",
  suggest: "var(--brand-violet)",
};

const CONFIDENCE_BARS: Record<string, number> = { low: 1, medium: 2, high: 3 };

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

// Memory is written as "Heading: text" lines (see SYSTEM_PROMPT). Anything that
// doesn't parse into at least two headings is shown as plain text instead.
function parseMemory(memory: string): { heading: string; text: string }[] | null {
  const sections: { heading: string; text: string }[] = [];
  for (const raw of memory.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^[-*•]?\s*([A-Za-z][A-Za-z /&'-]{1,40}):\s*(.*)$/);
    if (m) {
      sections.push({ heading: m[1].trim(), text: m[2].trim() });
    } else if (sections.length) {
      sections[sections.length - 1].text += ` ${line}`;
    } else {
      return null;
    }
  }
  return sections.length >= 2 ? sections : null;
}

function memoryField(sections: { heading: string; text: string }[] | null, ...names: string[]) {
  const hit = sections?.find((s) => names.some((n) => s.heading.toLowerCase().startsWith(n)));
  return hit?.text ?? "";
}

function visitAge(iso: string): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "";
  const date = then.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(new Date()) - startOf(then)) / 86_400_000);
  if (days <= 0) return `Last visit today, ${date}`;
  if (days === 1) return `Last visit yesterday, ${date}`;
  return `Last visit ${date} · ${days} days ago`;
}

export function WalkInCard({ accountName, memory, lastVisit, open, onToggle }: Props) {
  const [whyOpen, setWhyOpen] = useState(false);

  const memoryText = (memory ?? "").trim();
  const sections = memoryText ? parseMemory(memoryText) : null;

  const output = obj(lastVisit?.ai_output);
  const nbm = obj(output.next_best_move);
  const signals = obj(output.commercial_signals);
  const deals = Array.isArray(output.targeted_deals) ? (output.targeted_deals as Deal[]) : [];
  const deal = deals.find((d) => d && str(d.product)) ?? null;

  const specificAsk = str(nbm.specific_ask);
  const recommendation = str(nbm.recommendation);
  const ask = specificAsk || recommendation;
  const why = specificAsk ? recommendation || str(nbm.reason) : str(nbm.reason);
  const posture = str(nbm.commercial_posture);
  const postureColor = POSTURE_COLOR[posture.toLowerCase()] ?? "rgba(255,255,255,0.6)";
  const bars = CONFIDENCE_BARS[str(nbm.confidence).toLowerCase()] ?? 0;

  // Prefer the latest visit's read, which is fresher than memory until the rep
  // adopts a new memory; fall back to memory for accounts without one.
  const focus = ask || memoryField(sections, "next focus");
  const focusLabel = ask ? "Your ask today" : "Next focus";
  const buyingStyle = str(signals.buying_style) || memoryField(sections, "buying style");
  const risks = Array.isArray(signals.risk_flags)
    ? signals.risk_flags.map(str).filter(Boolean).slice(0, 2)
    : [];
  const watchOut = risks.length ? risks.join(" · ") : memoryField(sections, "watch-out", "watch out");

  const hasAnything = Boolean(focus || buyingStyle || watchOut || deal || memoryText);
  const tileColor = (c: string) => `color-mix(in oklab, ${c} 12%, transparent)`;
  const edgeColor = (c: string) => `color-mix(in oklab, ${c} 35%, transparent)`;

  return (
    <GlassCard className="p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0">
          <SignalLabel>Before you walk in</SignalLabel>
          <div className="mt-1 text-base font-semibold text-white">{accountName}</div>
          {lastVisit && (
            <div className="mt-0.5 text-xs text-white/45">{visitAge(lastVisit.created_at)}</div>
          )}
        </div>
        {hasAnything && (
          <button
            type="button"
            onClick={onToggle}
            className="ml-auto shrink-0 text-[11px] text-white/60 hover:text-white"
          >
            {open ? "Hide" : "Show"}
          </button>
        )}
      </div>

      {!hasAnything && (
        <p className="mt-2 text-sm text-white/50">
          Nothing on file yet — this will be the first visit recorded for {accountName}.
        </p>
      )}

      {hasAnything && open && (
        <div className="mt-4 grid gap-3">
          {focus && (
            <div
              className="grid gap-2 rounded-2xl border p-3.5"
              style={{ background: tileColor(postureColor), borderColor: edgeColor(postureColor) }}
            >
              {(posture || bars > 0) && (
                <div className="flex flex-wrap items-center gap-2">
                  {posture && (
                    <span
                      className="rounded-full px-2.5 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-black"
                      style={{ background: postureColor }}
                    >
                      {posture}
                    </span>
                  )}
                  {bars > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-white/60">
                      <span className="inline-flex items-end gap-0.5" aria-hidden="true">
                        {[1, 2, 3].map((n) => (
                          <i
                            key={n}
                            className="block w-1 rounded-[1px]"
                            style={{
                              height: 3 + n * 3,
                              background: n <= bars ? postureColor : "rgba(255,255,255,0.18)",
                            }}
                          />
                        ))}
                      </span>
                      {str(nbm.confidence)} confidence
                    </span>
                  )}
                </div>
              )}
              <div
                className="font-mono text-[10px] uppercase tracking-[0.2em]"
                style={{ color: postureColor }}
              >
                {focusLabel}
              </div>
              <p className="text-[17px] font-semibold leading-snug text-white">{focus}</p>
              {why && (
                <>
                  <p
                    className={`text-[13.5px] leading-relaxed text-white/60 ${whyOpen ? "" : "line-clamp-2"}`}
                  >
                    {why}
                  </p>
                  <button
                    type="button"
                    onClick={() => setWhyOpen((v) => !v)}
                    className="justify-self-start text-xs font-medium text-[var(--brand-cyan)]"
                  >
                    {whyOpen ? "Show less" : "Why this move"}
                  </button>
                </>
              )}
            </div>
          )}

          {(buyingStyle || watchOut) && (
            <div className={`grid gap-2.5 ${buyingStyle && watchOut ? "grid-cols-2" : ""}`}>
              {buyingStyle && (
                <QuickRead label="Buying style" color="var(--brand-violet)" text={buyingStyle} />
              )}
              {watchOut && <QuickRead label="Watch out" color="var(--signal-risk)" text={watchOut} />}
            </div>
          )}

          {deal && (
            <div
              className="grid gap-2 rounded-2xl border p-3.5"
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in oklab, var(--brand-cyan) 12%, transparent), color-mix(in oklab, var(--brand-violet) 12%, transparent))",
                borderColor: edgeColor("var(--brand-cyan)"),
              }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--brand-cyan)]">
                  Deal to pitch
                </span>
                {deals.length > 1 && (
                  <span className="text-[11px] text-white/40">1 of {deals.length} matched</span>
                )}
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="text-[15px] font-semibold text-white">{str(deal.product)}</span>
                {str(deal.deal) && (
                  <span className="rounded-md bg-[var(--brand-cyan)] px-1.5 py-0.5 font-mono text-[11.5px] font-semibold text-black">
                    {str(deal.deal)}
                  </span>
                )}
                {(str(deal.eligibility) || str(deal.window)) && (
                  <span className="text-xs text-white/60">
                    {[str(deal.eligibility), str(deal.window)].filter(Boolean).join(" · ")}
                  </span>
                )}
              </div>
              {str(deal.pitch_line) && (
                <p className="border-l-2 border-[var(--brand-cyan)]/50 pl-2.5 text-sm leading-relaxed text-white/90">
                  “{str(deal.pitch_line)}”
                </p>
              )}
              {str(deal.source_file) && (
                <div className="text-[11px] text-white/40">From {str(deal.source_file)}</div>
              )}
            </div>
          )}

          {memoryText && (
            <details className="group border-t border-white/10 pt-2.5">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px] font-medium text-white/60 [&::-webkit-details-marker]:hidden">
                <span className="transition-transform group-open:rotate-90" aria-hidden="true">
                  ›
                </span>
                Full account memory
              </summary>
              {sections ? (
                <dl className="mt-3 grid gap-2.5">
                  {sections.map((s, i) => (
                    <div key={`${s.heading}-${i}`} className="grid gap-0.5">
                      <dt className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-white/40">
                        {s.heading}
                      </dt>
                      <dd className="text-[13.5px] leading-relaxed text-white/85">{s.text}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                  {memoryText}
                </p>
              )}
            </details>
          )}
        </div>
      )}
    </GlassCard>
  );
}

function QuickRead({ label, color, text }: { label: string; color: string; text: string }) {
  return (
    <div className="grid min-w-0 content-start gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.045] p-3">
      <div className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-white/40">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
        {label}
      </div>
      <p className="line-clamp-4 text-[13px] leading-snug text-white">{text}</p>
    </div>
  );
}
