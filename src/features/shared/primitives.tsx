import { forwardRef, type HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & { tone?: "default" | "strong" };

export const GlassCard = forwardRef<HTMLDivElement, Props>(function GlassCard(
  { className = "", tone = "default", children, ...rest },
  ref,
) {
  const base = tone === "strong" ? "glass-strong" : "glass";
  return (
    <div
      ref={ref}
      className={`${base} gradient-border rounded-2xl ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
});

export function SignalLabel({
  children,
  className = "",
  as: Tag = "span",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "span" | "h2" | "h3" | "h4";
}) {
  return <Tag className={`signal-label font-sans text-lg text-right font-extrabold ${className}`}>{children}</Tag>;
}

export function SignalChip({ kind, label }: { kind: string; label: string }) {
  const map: Record<string, string> = {
    buying: "var(--signal-positive)",
    risk: "var(--signal-risk)",
    objection: "var(--signal-warning)",
    intent: "var(--brand-cyan)",
    stakeholder: "var(--brand-violet)",
  };
  const color = map[kind] ?? "var(--brand-cyan)";
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.14em] px-2 py-1 rounded-md"
      style={{
        color,
        background: `color-mix(in oklab, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in oklab, ${color} 30%, transparent)`,
      }}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

export function RiskDot({ risk }: { risk: "low" | "medium" | "high" }) {
  const color =
    risk === "low" ? "var(--signal-positive)" : risk === "medium" ? "var(--signal-warning)" : "var(--signal-risk)";
  return (
    <span className="relative inline-flex w-2 h-2">
      <span className="absolute inset-0 rounded-full ring-pulse" style={{ background: color }} />
      <span className="relative w-2 h-2 rounded-full" style={{ background: color }} />
    </span>
  );
}

export function MomentumBadge({ momentum }: { momentum: "accelerating" | "steady" | "stalling" }) {
  const map = {
    accelerating: { color: "var(--signal-positive)", arrow: "↗" },
    steady: { color: "var(--brand-cyan)", arrow: "→" },
    stalling: { color: "var(--signal-risk)", arrow: "↘" },
  } as const;
  const m = map[momentum];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] font-mono px-2 py-1 rounded-md"
      style={{ color: m.color, background: `color-mix(in oklab, ${m.color} 12%, transparent)` }}
    >
      <span>{m.arrow}</span>
      {momentum}
    </span>
  );
}

export function Sparkline({ values, color = "var(--brand-cyan)" }: { values: number[]; color?: string }) {
  const w = 120;
  const h = 32;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={w} cy={h - ((values[values.length - 1] - min) / range) * h} r="2.5" fill={color} />
    </svg>
  );
}
