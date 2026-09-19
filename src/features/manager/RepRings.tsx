import type { Rings, Status } from "./data";
import { STATUS_COLOR } from "./data";

const TRACK = "#E5E7EB";

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
              strokeWidth={sw}
              strokeLinecap="round"
              strokeDasharray={`${circumference * Math.min(Math.max(pct, 0), 1)} ${circumference}`}
            />
          </g>
        );
      })}
    </svg>
  );
}

export function SplitBar({ onPremise }: { onPremise: number }) {
  return (
    <div>
      <div className="flex h-1.5 w-full overflow-hidden" style={{ borderRadius: 2 }}>
        <div style={{ width: `${onPremise}%`, background: "#1F2937" }} />
        <div style={{ width: `${100 - onPremise}%`, background: "#D1D5DB" }} />
      </div>
      <div className="mt-1.5 text-xs text-gray-500">
        On premise {onPremise}% · Retail {100 - onPremise}%
      </div>
    </div>
  );
}
