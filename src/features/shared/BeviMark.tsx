import { motion } from "framer-motion";

/**
 * BEVI brandmark — sculpted gradient "B" with a single curling tail of
 * dots sweeping out of the lower-left. Cyan → indigo → violet, with an
 * inner shadow that gives the bowls real dimension. Inline SVG so it
 * stays crisp at every size and remains animatable.
 */
export function BeviMark({ size = 40, animated = true }: { size?: number; animated?: boolean }) {
  const id = `bevi-${Math.random().toString(36).slice(2, 8)}`;

  // Curling tail — dots placed along a single spiral curve that starts
  // tucked against the B's lower-left and tapers off down-and-under.
  // Size and opacity graduate together so the tail "fades into mist".
  const tail = [
    { cx: 40, cy: 88, r: 5.6, o: 1.0 },
    { cx: 32, cy: 94, r: 4.9, o: 0.96 },
    { cx: 24, cy: 101, r: 4.2, o: 0.92 },
    { cx: 18, cy: 110, r: 3.6, o: 0.86 },
    { cx: 16, cy: 119, r: 3.1, o: 0.8 },
    { cx: 20, cy: 127, r: 2.7, o: 0.74 },
    { cx: 28, cy: 132, r: 2.3, o: 0.68 },
    { cx: 38, cy: 134, r: 2.0, o: 0.62 },
    { cx: 48, cy: 133, r: 1.7, o: 0.56 },
    { cx: 58, cy: 130, r: 1.4, o: 0.5 },
    { cx: 68, cy: 126, r: 1.2, o: 0.44 },
    { cx: 76, cy: 121, r: 1.0, o: 0.38 },
    { cx: 82, cy: 116, r: 0.8, o: 0.32 },
    { cx: 86, cy: 111, r: 0.6, o: 0.26 },
  ];

  return (
    <svg
      viewBox="0 0 140 140"
      width={size}
      height={size}
      aria-hidden
      className="overflow-visible"
    >
      <defs>
        {/* Body gradient — cyan top-left → indigo mid → deep violet bottom-right */}
        <linearGradient id={`${id}-b`} x1="0.05" y1="0.05" x2="0.95" y2="1">
          <stop offset="0" stopColor="#3ED8E0" />
          <stop offset="0.35" stopColor="#1E3A8A" />
          <stop offset="0.7" stopColor="#4C1D95" />
          <stop offset="1" stopColor="#3B0764" />
        </linearGradient>

        {/* Inner shadow — radial dark navy along the inside of the S-curve */}
        <radialGradient id={`${id}-shadow`} cx="0.55" cy="0.5" r="0.55">
          <stop offset="0" stopColor="#0A1027" stopOpacity="0.55" />
          <stop offset="0.6" stopColor="#0A1027" stopOpacity="0.18" />
          <stop offset="1" stopColor="#0A1027" stopOpacity="0" />
        </radialGradient>

        {/* Subtle top-edge sheen so the upper bowl has a glint of light */}
        <linearGradient id={`${id}-sheen`} x1="0.2" y1="0" x2="0.6" y2="0.4">
          <stop offset="0" stopColor="#7CF0F0" stopOpacity="0.45" />
          <stop offset="1" stopColor="#7CF0F0" stopOpacity="0" />
        </linearGradient>

        {/* Dot gradient — cyan → violet to echo the body */}
        <linearGradient id={`${id}-dot`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5DE6EC" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>

        {/* Soft aura behind the mark */}
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#18B4A6" stopOpacity="0.4" />
          <stop offset="1" stopColor="#18B4A6" stopOpacity="0" />
        </radialGradient>

        {/* Clip the inner shadow so it never bleeds outside the B silhouette */}
        <clipPath id={`${id}-clip`}>
          <path
            d="
              M 46 18
              C 43 18 41 20 41 23
              L 41 117
              C 41 120 43 122 46 122
              L 84 122
              C 103 122 116 110 116 92
              C 116 81 109 72 99 68
              C 107 64 112 56 112 46
              C 112 29 100 18 83 18
              Z
            "
          />
        </clipPath>
      </defs>

      {/* Soft aura */}
      <circle cx="70" cy="70" r="62" fill={`url(#${id}-glow)`} />

      {/* The B — outer silhouette with both counters punched via evenodd.
          Counters are crescents (curved inner edges) so they read as one
          flowing S-curve when paired with the inner shadow below. */}
      <path
        d="
          M 46 18
          C 43 18 41 20 41 23
          L 41 117
          C 41 120 43 122 46 122
          L 84 122
          C 103 122 116 110 116 92
          C 116 81 109 72 99 68
          C 107 64 112 56 112 46
          C 112 29 100 18 83 18
          Z
          M 57 33
          L 81 33
          C 90 33 95 39 95 47
          C 95 55 89 60 80 60
          C 71 60 63 58 57 54
          Z
          M 57 76
          C 64 73 73 71 84 71
          C 95 71 100 79 100 88
          C 100 99 94 106 83 106
          L 57 106
          Z
        "
        fill={`url(#${id}-b)`}
        fillRule="evenodd"
      />

      {/* Inner shadow — clipped to the B silhouette, painted along the
          diagonal where the upper bowl folds into the lower bowl. This is
          what gives the mark its dimensional "two surfaces folding" feel. */}
      <g clipPath={`url(#${id}-clip)`}>
        <ellipse
          cx="78"
          cy="68"
          rx="44"
          ry="30"
          fill={`url(#${id}-shadow)`}
          transform="rotate(-18 78 68)"
        />
      </g>

      {/* Top-bowl sheen — restrained glint along the upper-left curve */}
      <path
        d="M 50 22 C 60 19 72 19 82 20 C 88 21 92 24 94 28 L 60 28 Z"
        fill={`url(#${id}-sheen)`}
        clipPath={`url(#${id}-clip)`}
      />

      {/* Curling tail of dots — single trajectory, graduated size + opacity.
          Animated shimmer travels along the spiral via staggered delay. */}
      {tail.map((d, i) =>
        animated ? (
          <motion.circle
            key={i}
            cx={d.cx}
            cy={d.cy}
            r={d.r}
            fill={`url(#${id}-dot)`}
            initial={{ opacity: d.o * 0.6 }}
            animate={{ opacity: [d.o * 0.6, d.o, d.o * 0.6] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.18 }}
          />
        ) : (
          <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={`url(#${id}-dot)`} opacity={d.o} />
        ),
      )}
    </svg>
  );
}
