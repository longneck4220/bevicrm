import { motion } from "framer-motion";
import { useMemo } from "react";

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function ParticleField({
  count = 28,
  className = "",
  seed,
}: {
  count?: number;
  className?: string;
  seed?: number;
}) {
  const particles = useMemo(() => {
    const rand = mulberry32(seed ?? count * 9301 + 49297);
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: rand() * 100,
      y: rand() * 100,
      size: rand() * 2 + 1,
      delay: rand() * 6,
      duration: 8 + rand() * 10,
      opacity: rand() * 0.5 + 0.2,
    }));
  }, [count, seed]);
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: "oklch(0.74 0.13 195)",
            boxShadow: "0 0 8px oklch(0.74 0.13 195 / 0.8)",
            opacity: p.opacity,
          }}
          animate={{ y: [0, -30, 0], opacity: [p.opacity, p.opacity * 0.3, p.opacity] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
