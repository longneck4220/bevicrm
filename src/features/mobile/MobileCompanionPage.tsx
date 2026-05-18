import { motion } from "framer-motion";
import { conversations } from "@/features/intelligence/data";
import { GlassCard, RiskDot, SignalLabel } from "@/features/shared/primitives";
import { BeviMark } from "@/features/shared/BeviMark";

export function MobileCompanionPage() {
  const c = conversations[0];
  return (
    <main className="relative pt-28 pb-24">
      <div className="mx-auto max-w-6xl px-6 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <SignalLabel>Mobile companion</SignalLabel>
          <h1 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight text-white">
            One signal. <br />
            <span className="text-gradient">One move. In your pocket.</span>
          </h1>
          <p className="mt-5 text-muted-foreground max-w-md">
            Right before every call, BEVI surfaces the one thing that matters most. No scrolling,
            no dashboards — just the read.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/80">
            {[
              "Pre-call brief, 60 seconds before you dial",
              "Live signal pulse during conversation",
              "Post-call action card, auto-drafted",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--brand-cyan)" }} />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {/* Phone frame */}
            <div
              className="relative w-[300px] h-[620px] rounded-[44px] p-3 ambient-glow"
              style={{
                background:
                  "linear-gradient(180deg, oklch(0.22 0.03 260), oklch(0.14 0.03 260))",
                border: "1px solid oklch(0.97 0.01 250 / 0.1)",
              }}
            >
              <div
                className="relative w-full h-full rounded-[34px] overflow-hidden p-5"
                style={{
                  background:
                    "linear-gradient(180deg, oklch(0.16 0.03 260), oklch(0.12 0.03 260))",
                }}
              >
                {/* notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-5 rounded-full bg-black/70" />

                {/* Aurora bg */}
                <div
                  className="absolute inset-0 opacity-70"
                  style={{ background: "var(--gradient-aurora)" }}
                />

                <div className="relative pt-6 flex justify-between items-center text-[10px] font-mono text-white/60">
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5">
                    <BeviMark size={14} animated={false} />
                    <span className="tracking-[0.2em] text-white/80">BEVI</span>
                  </div>
                </div>

                <div className="relative mt-6 flex justify-center">
                  <BeviMark size={120} />
                </div>

                <div className="relative mt-4 text-center">
                  <SignalLabel>Now sensing</SignalLabel>
                  <div className="mt-1.5 text-white text-sm font-medium">{c.account}</div>
                </div>

                <div className="relative mt-5 glass-strong rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <RiskDot risk={c.risk} />
                    <SignalLabel>Pre-call brief</SignalLabel>
                  </div>
                  <p className="mt-2 text-[13px] text-white/90 leading-snug">
                    {c.summary.slice(0, 110)}…
                  </p>
                </div>

                <div className="relative mt-3 rounded-2xl p-4" style={{ background: "var(--gradient-signal)" }}>
                  <SignalLabel className="!text-white/80">Your next move</SignalLabel>
                  <div className="mt-1.5 text-[13px] text-white font-medium leading-snug">
                    {c.nextMoves[0].title}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-white/90 font-mono">
                    <span>{c.nextMoves[0].confidence}% confidence</span>
                    <span>Tap to execute →</span>
                  </div>
                </div>

                <div className="absolute bottom-3 inset-x-3">
                  <GlassCard className="px-3 py-2 flex items-center justify-around text-[10px] signal-label">
                    <span className="!text-white">Today</span>
                    <span>Deals</span>
                    <span>Signals</span>
                    <span>Inbox</span>
                  </GlassCard>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
