import type { ReactNode } from "react";
import { BeviMark } from "@/features/shared/BeviMark";

const OUTPUTS = [
  {
    label: "Next Best Move",
    body: "Call Aaron Thursday — reinstated pricing support + training date.",
  },
  { label: "CRM Note", body: "Summer promo agreed. Pricing support lapsed. Training booked." },
  { label: "Follow-Up Email", body: "Summer promo + pricing support — sending today." },
  { label: "Missed Opportunity", body: "Premium spirits gap — cocktail list upgraded." },
  { label: "Account Signals", body: "Margin pressure ↑ · Relationship strong · Renewal risk" },
];

const NOTE =
  "Met with Aaron, he is happy to run with the Summer promotional material. He mentioned pricing support lapsed needs reviewing. Wants help with staff performance. Training booked next month.";

function Frame({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="mx-auto w-full max-w-[360px] rounded-2xl border border-hairline bg-surface p-3">
      <div className="flex items-center justify-between border-b border-hairline px-2 pb-3">
        <BeviMark size={18} />
        <span className="font-mono text-[12px] uppercase tracking-[0.06em] text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="min-h-[380px] p-3">{children}</div>
    </div>
  );
}

function Chip({ children, accent = false }: { children: string; accent?: boolean }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 font-mono text-[12px] uppercase tracking-[0.06em] ${
        accent
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-hairline bg-surface-2 text-muted-foreground"
      }`}
    >
      {children}
    </span>
  );
}

export function StageCanvas({ stage, revealed = 5 }: { stage: number; revealed?: number }) {
  if (stage === 0) {
    return (
      <Frame title="New visit note">
        <p className="text-sm text-muted-foreground">
          <span className="inline-block h-4 w-px translate-y-0.5 bg-primary motion-safe:animate-pulse" />
        </p>
        <p className="mt-4 text-sm text-muted-foreground/60">Nothing captured yet.</p>
      </Frame>
    );
  }

  if (stage === 1) {
    return (
      <Frame title="Capturing">
        <p className="text-sm leading-relaxed text-foreground">{NOTE}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Chip>Buyer cue</Chip>
          <Chip>Risk</Chip>
          <Chip>Follow-up</Chip>
        </div>
      </Frame>
    );
  }

  if (stage === 2) {
    return (
      <Frame title="Signal">
        <ul className="space-y-3">
          {[
            ["Buying style", "Practical, menu-led"],
            ["Margin pressure", "Support must be explicit"],
            ["Missed opp", "Premium range activation"],
          ].map(([k, v]) => (
            <li key={k} className="rounded-lg border border-hairline bg-surface-2 p-3">
              <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-muted-foreground">
                {k}
              </p>
              <p className="mt-1 text-sm text-foreground">{v}</p>
            </li>
          ))}
        </ul>
      </Frame>
    );
  }

  if (stage === 3) {
    return (
      <Frame title="Outputs">
        <ul className="space-y-2">
          {OUTPUTS.map((o, i) => (
            <li
              key={o.label}
              className={`rounded-lg border border-hairline bg-surface-2 p-3 transition-opacity duration-500 ${
                i < revealed ? "opacity-100" : "opacity-0"
              }`}
            >
              <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-primary">
                {o.label}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{o.body}</p>
            </li>
          ))}
        </ul>
      </Frame>
    );
  }

  if (stage === 4) {
    return (
      <Frame title="Account memory">
        <p className="font-display text-lg text-foreground">Aaron — Northside Cellars</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip>Menu-led</Chip>
          <Chip accent>Renewal risk</Chip>
          <Chip>Training booked</Chip>
        </div>
        <ul className="mt-5 space-y-3 border-t border-hairline pt-4 text-[13px] text-muted-foreground">
          <li>Open action · Send pricing support proposal</li>
          <li>Open action · Confirm training agenda</li>
          <li>Last visit · Summer promotional material agreed</li>
        </ul>
      </Frame>
    );
  }

  return (
    <Frame title="Ready">
      <p className="text-sm leading-relaxed text-muted-foreground">
        One note in. Five decisions out. Account memory updated.
      </p>
      <div className="mt-5 rounded-lg border border-primary/40 bg-primary/10 p-3">
        <p className="font-mono text-[12px] uppercase tracking-[0.06em] text-primary">90 seconds</p>
      </div>
    </Frame>
  );
}
