import { motion } from "framer-motion";
import { useMemo } from "react";

export function ParticleField({ count = 28, className = "" }: { count?: number; className?: string }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 6,
        duration: 8 + Math.random() * 10,
        opacity: Math.random() * 0.5 + 0.2,
      })),
    [count],
  );
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
