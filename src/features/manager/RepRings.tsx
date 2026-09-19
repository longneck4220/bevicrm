import { useState } from "react";
import { Phone, Pencil, ArrowRight } from "lucide-react";
import type { Rings, Status } from "./data";
import { STATUS_COLOR } from "./data";

const TRACK = "rgba(255,255,255,0.08)";

export const RING_META = [
  { key: "volume", label: "Calls", Icon: Phone },
  { key: "quality", label: "Notes", Icon: Pencil },
  { key: "progression", label: "Progress", Icon: ArrowRight },
] as const;

export function RepRings({
  rings,
  status,
  size = 72,
}: {
  rings: Rings;
  status: Status;
  size?: number;
}) {
  const color = STATUS_COLOR[status];
  const [hover, setHover] = useState<number | null>(null);
  const sw = size > 60 ? 5 : 4;
  const c = size / 2;
  const circles = [
    { r: c - sw / 2, pct: rings.volume },
    { r: c - sw * 1.5 - 2, pct: rings.quality },
    { r: c - sw * 2.5 - 4, pct: rings.progression },
  ];
  return (
    <svg width={size} height={size} aria-label="Activity rings" role="img">
      {circles.map(({ r, pct }, i) => {
        const circumference = 2 * Math.PI * r;
        const meta = RING_META[i];
        return (
          <g key={i} transform={`rotate(-90 ${c} ${c})`}>
            <circle
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke={TRACK}
              strokeWidth={sw}
            />
            <circle
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={hover === i ? sw + 1.5 : sw}
              strokeLinecap="round"
              strokeDasharray={`${circumference * Math.min(Math.max(pct, 0), 1)} ${circumference}`}
              style={{ transition: "stroke-width 120ms ease-out" }}
            />
            <circle
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke="transparent"
              strokeWidth={sw * 3}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <title>{meta.label}</title>
            </circle>
          </g>
        );
      })}
      {hover !== null && (
        <g pointerEvents="none">
          <rect
            x={c - 32}
            y={1}
            width={64}
            height={18}
            rx={6}
            style={{
              fill: "var(--bg-surface-2)",
              stroke: "rgba(255,255,255,0.14)",
            }}
          />
          <text
            x={c}
            y={13.5}
            textAnchor="middle"
            fontSize={9}
            style={{
              fill: "var(--foreground)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.1em",
            }}
          >
            {RING_META[hover].label.toUpperCase()}
          </text>
        </g>
      )}
    </svg>
  );
}

export function RingLegend() {
  return (
    <div className="flex flex-col gap-1.5" aria-hidden="true">
      {RING_META.map(({ label, Icon }) => (
        <div
          key={label}
          className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
        >
          <Icon size={11} strokeWidth={2} />
          {label}
        </div>
      ))}
    </div>
  );
}

export function SplitBar({ onPremise }: { onPremise: number }) {
  return (
    <div>
      <div
        className="flex h-1.5 w-full overflow-hidden"
        style={{ borderRadius: 2 }}
      >
        <div
          style={{ width: `${onPremise}%`, background: "var(--foreground)" }}
        />
        <div
          style={{
            width: `${100 - onPremise}%`,
            background: "rgba(255,255,255,0.15)",
          }}
        />
      </div>
      <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        On premise {onPremise}% · Retail {100 - onPremise}%
      </div>
    </div>
  );
}
