import { motion } from "framer-motion";

export function OctopusOrb({ size = 220 }: { size?: number }) {
  // Stylized signal-orb mark: concentric arms + sensing pulses
  const arms = Array.from({ length: 8 });
  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* aurora bed */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-70"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, oklch(0.74 0.13 195 / 0.55), oklch(0.55 0.25 295 / 0.35) 45%, transparent 70%)",
        }}
      />
      {/* core */}
      <motion.div
        className="absolute inset-[28%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, oklch(0.96 0.02 200), oklch(0.74 0.13 195) 45%, oklch(0.55 0.25 295) 100%)",
          boxShadow:
            "inset 0 0 30px oklch(0.97 0.01 250 / 0.4), 0 0 60px oklch(0.74 0.13 195 / 0.5)",
        }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* arms */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="armG" x1="0" x2="1">
            <stop offset="0" stopColor="oklch(0.74 0.13 195)" stopOpacity="0.9" />
            <stop offset="1" stopColor="oklch(0.55 0.25 295)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {arms.map((_, i) => {
          const angle = (i * 360) / arms.length;
          return (
            <motion.g
              key={i}
              style={{ transformOrigin: "100px 100px" }}
              animate={{ rotate: [angle, angle + 6, angle] }}
              transition={{ duration: 7 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
            >
              <path
                d={`M100 100 Q ${100 + 40} ${100 - 10} ${100 + 80} ${100 + 4}`}
                stroke="url(#armG)"
                strokeWidth="1.2"
                fill="none"
              />
            </motion.g>
          );
        })}
      </svg>
      {/* sensing pulses */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-[20%] rounded-full border"
          style={{ borderColor: "oklch(0.74 0.13 195 / 0.4)" }}
          animate={{ scale: [0.9, 1.6], opacity: [0.6, 0] }}
          transition={{ duration: 3.6, repeat: Infinity, delay: i * 1.2, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
