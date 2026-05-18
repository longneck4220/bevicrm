import { motion } from "framer-motion";

/**
 * BEVI brandmark — a rounded gradient "B" with a spiral cluster of
 * tentacle dots curling from the lower-left. Cyan → blue → violet,
 * matching the official brand sheet.
 */
export function BeviMark({ size = 40, animated = true }: { size?: number; animated?: boolean }) {
  const id = `bevi-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg
      viewBox="0 0 140 140"
      width={size}
      height={size}
      aria-hidden
      className="overflow-visible"
    >
      <defs>
        {/* Body gradient — cyan top-left → blue mid → violet bottom-right */}
        <linearGradient id={`${id}-b`} x1="0.1" y1="0.05" x2="0.95" y2="1">
          <stop offset="0" stopColor="#3ED8E0" />
          <stop offset="0.45" stopColor="#2563EB" />
          <stop offset="1" stopColor="#5B21B6" />
        </linearGradient>
        {/* Inner highlight to give the B dimensional sheen */}
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7CF0F0" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#7CF0F0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-dot`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3ED8E0" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#18B4A6" stopOpacity="0.45" />
          <stop offset="1" stopColor="#18B4A6" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* soft aura */}
      <circle cx="70" cy="70" r="62" fill={`url(#${id}-glow)`} />

      {/* The B — full rounded bowls, single filled path */}
      <path
        d="
          M 48 18
          C 44 18 42 20 42 24
          L 42 116
          C 42 120 44 122 48 122
          L 84 122
          C 104 122 116 110 116 92
          C 116 80 109 71 98 67
          C 106 63 111 55 111 45
          C 111 29 100 18 82 18
          Z
          M 56 33
          L 82 33
          C 90 33 95 38 95 46
          C 95 54 90 59 82 59
          L 56 59
          Z
          M 56 73
          L 84 73
          C 94 73 100 79 100 88
          C 100 98 94 104 84 104
          L 56 104
          Z
        "
        fill={`url(#${id}-b)`}
        fillRule="evenodd"
      />

      {/* Sheen highlight on upper bowl */}
      <path
        d="M 56 33 L 82 33 C 90 33 95 38 95 46 C 95 50 93 53 90 55 L 56 55 Z"
        fill={`url(#${id}-sheen)`}
      />

      {/* Tentacle dot spiral — curls from the lower-left of the B */}
      {[
        // inner ring (largest, closest to B)
        { cx: 36, cy: 86, r: 5.0, o: 1.0 },
        { cx: 28, cy: 94, r: 4.4, o: 0.95 },
        { cx: 24, cy: 104, r: 3.8, o: 0.9 },
        { cx: 28, cy: 114, r: 3.4, o: 0.85 },
        { cx: 38, cy: 118, r: 3.6, o: 0.9 },
        { cx: 48, cy: 114, r: 3.2, o: 0.85 },
        // mid ring
        { cx: 18, cy: 96, r: 3.0, o: 0.8 },
        { cx: 14, cy: 108, r: 2.6, o: 0.75 },
        { cx: 20, cy: 120, r: 2.4, o: 0.7 },
        { cx: 34, cy: 124, r: 2.2, o: 0.7 },
        { cx: 48, cy: 122, r: 1.8, o: 0.65 },
        // outer ring (smallest)
        { cx: 10, cy: 100, r: 1.8, o: 0.6 },
        { cx: 8, cy: 112, r: 1.6, o: 0.55 },
        { cx: 14, cy: 124, r: 1.4, o: 0.5 },
        { cx: 28, cy: 128, r: 1.4, o: 0.5 },
        { cx: 42, cy: 128, r: 1.2, o: 0.45 },
        { cx: 54, cy: 124, r: 1.2, o: 0.45 },
      ].map((d, i) =>
        animated ? (
          <motion.circle
            key={i}
            cx={d.cx}
            cy={d.cy}
            r={d.r}
            fill={`url(#${id}-dot)`}
            initial={{ opacity: d.o * 0.6 }}
            animate={{ opacity: [d.o * 0.6, d.o, d.o * 0.6] }}
            transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.12 }}
          />
        ) : (
          <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={`url(#${id}-dot)`} opacity={d.o} />
        ),
      )}
    </svg>
  );
}
