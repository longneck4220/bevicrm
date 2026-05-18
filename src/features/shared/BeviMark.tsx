import { motion } from "framer-motion";

/**
 * BEVI brandmark — a stylized "B" fused with octopus tentacle dots.
 * The B is built from two gradient-filled bowls; tentacles are dot clusters
 * trailing from the lower-left, sized down as they spiral outward.
 */
export function BeviMark({ size = 40, animated = true }: { size?: number; animated?: boolean }) {
  const id = `bevi-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      aria-hidden
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={`${id}-b`} x1="0.15" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="oklch(0.82 0.13 195)" />
          <stop offset="0.45" stopColor="oklch(0.62 0.20 245)" />
          <stop offset="1" stopColor="oklch(0.50 0.25 295)" />
        </linearGradient>
        <linearGradient id={`${id}-dot`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="oklch(0.82 0.13 195)" />
          <stop offset="1" stopColor="oklch(0.55 0.25 295)" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="oklch(0.74 0.13 195 / 0.55)" />
          <stop offset="1" stopColor="oklch(0.74 0.13 195 / 0)" />
        </radialGradient>
      </defs>

      {/* soft aura behind the mark */}
      <circle cx="60" cy="60" r="55" fill={`url(#${id}-glow)`} />

      {/* The B — spine + two bowls, drawn as a single filled path */}
      <path
        d="
          M 36 18
          L 36 102
          L 64 102
          C 84 102 96 92 96 76
          C 96 66 90 58 80 55
          C 88 51 92 44 92 36
          C 92 24 82 18 64 18
          Z
          M 50 32
          L 64 32
          C 72 32 76 35 76 41
          C 76 47 72 50 64 50
          L 50 50
          Z
          M 50 64
          L 64 64
          C 74 64 80 68 80 76
          C 80 84 74 88 64 88
          L 50 88
          Z
        "
        fill={`url(#${id}-b)`}
        fillRule="evenodd"
      />

      {/* Tentacle dot cluster — trails from lower-left of the B */}
      {[
        { cx: 30, cy: 70, r: 4.2, o: 1 },
        { cx: 22, cy: 76, r: 3.6, o: 0.95 },
        { cx: 16, cy: 84, r: 3.0, o: 0.9 },
        { cx: 12, cy: 93, r: 2.4, o: 0.8 },
        { cx: 18, cy: 96, r: 2.0, o: 0.75 },
        { cx: 26, cy: 92, r: 2.6, o: 0.85 },
        { cx: 28, cy: 84, r: 3.0, o: 0.9 },
        { cx: 22, cy: 88, r: 1.8, o: 0.7 },
        { cx: 8, cy: 88, r: 1.6, o: 0.6 },
        { cx: 32, cy: 88, r: 2.2, o: 0.8 },
      ].map((d, i) =>
        animated ? (
          <motion.circle
            key={i}
            cx={d.cx}
            cy={d.cy}
            r={d.r}
            fill={`url(#${id}-dot)`}
            initial={{ opacity: d.o * 0.5 }}
            animate={{ opacity: [d.o * 0.5, d.o, d.o * 0.5] }}
            transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.15 }}
          />
        ) : (
          <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={`url(#${id}-dot)`} opacity={d.o} />
        ),
      )}
    </svg>
  );
}
