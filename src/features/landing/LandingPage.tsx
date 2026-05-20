import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { BeviMark } from "@/features/shared/BeviMark";
import { ParticleField } from "@/features/shared/ParticleField";
import { GlassCard, SignalLabel, Sparkline } from "@/features/shared/primitives";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function LandingPage() {
  return (
    <main className="relative pt-28 pb-32">
      <ParticleField count={36} />
      <div className="absolute inset-0 grid-overlay pointer-events-none" aria-hidden />

      {/* HERO */}
      <section className="relative mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <motion.div
              initial="hidden"
              animate="show"
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-cyan)] animate-pulse" />
              <SignalLabel>Ambient Sales Intelligence · v2.4</SignalLabel>
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="show"
              variants={fadeUp}
              custom={1}
              className="text-[clamp(2.8rem,6.4vw,5.5rem)] leading-[0.98] font-semibold tracking-[-0.025em] text-white"
            >
              Win the <br className="hidden sm:block" />
              <span className="text-gradient">next call.</span>
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="show"
              variants={fadeUp}
              custom={2}
              className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed"
            >
              BEVI turns post-visit thinking into CRM notes, account memory
              and the next commercial move.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="show"
              variants={fadeUp}
              custom={3}
              className="mt-10 flex flex-wrap items-center gap-3"
            >
              <Link
                to="/trial"
                className="group relative inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium text-primary-foreground ambient-glow"
                style={{ background: "var(--gradient-signal)" }}
              >
                Try the agent
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
              <Link
                to="/mobile"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm glass hover:bg-white/5 transition-colors"
              >
                See mobile companion
              </Link>
            </motion.div>

          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 relative flex justify-center"
          >
            <div className="relative">
              {/* aura behind the brandmark */}
              <div
                className="absolute -inset-16 rounded-full blur-3xl opacity-60 pointer-events-none"
                style={{ background: "var(--gradient-aurora)" }}
              />
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <BeviMark size={380} />
              </motion.div>

              <FloatingChip
                className="absolute -left-10 top-6"
                label="BUYING SIGNAL"
                value="Budget unlocked"
                tone="var(--signal-positive)"
              />
              <FloatingChip
                className="absolute -right-6 top-32"
                label="STAKEHOLDER"
                value="CFO surfaced"
                tone="var(--brand-cyan)"
              />
              <FloatingChip
                className="absolute -left-2 bottom-10"
                label="NEXT MOVE"
                value="Send SOC2 brief"
                tone="var(--brand-violet)"
                delay={1.2}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* THREE PILLARS — Senses · Understands · Delivers */}
      <section className="relative mx-auto max-w-7xl px-6 mt-24">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "Senses opportunity", tone: "var(--brand-cyan)" },
            { label: "Understands context", tone: "var(--brand-blue)" },
            { label: "Delivers the next move", tone: "var(--brand-violet)" },
          ].map((p) => (
            <div
              key={p.label}
              className="glass rounded-2xl px-5 py-4 flex items-center gap-3"
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: p.tone, boxShadow: `0 0 14px ${p.tone}` }}
              />
              <span className="signal-label !text-white/90">{p.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SIGNAL BAR */}
      <section className="relative mx-auto max-w-7xl px-6 mt-28">
        <GlassCard tone="strong" className="p-2">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5">
            {[
              { label: "Conversations parsed", value: "184,902", spark: [4, 8, 6, 10, 12, 9, 14, 16] },
              { label: "Signals surfaced today", value: "12,447", spark: [6, 5, 9, 8, 12, 14, 11, 18] },
              { label: "Avg. response window", value: "38 min", spark: [12, 10, 8, 9, 7, 5, 6, 4] },
              { label: "Deals advanced", value: "+312 / wk", spark: [2, 4, 5, 7, 8, 11, 13, 15] },
            ].map((m) => (
              <div key={m.label} className="px-6 py-5 flex items-center justify-between gap-4">
                <div>
                  <SignalLabel>{m.label}</SignalLabel>
                  <div className="text-xl font-semibold text-white mt-1">{m.value}</div>
                </div>
                <Sparkline values={m.spark} />
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      {/* CAPABILITIES */}
      <section className="relative mx-auto max-w-7xl px-6 mt-32">
        <div className="max-w-2xl">
          <SignalLabel>How BEVI sees</SignalLabel>
          <h2 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight text-white">
            Sense. Understand. Act.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Three quiet layers of perception, working in continuous loop — so you walk into every
            conversation already a step ahead.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            {
              tag: "Sense",
              title: "Ambient capture",
              body: "Every call, email, and thread flows in. No bots, no recording prompts, no friction.",
              ring: "var(--brand-cyan)",
            },
            {
              tag: "Understand",
              title: "Signal extraction",
              body: "Intent, risk, objections, stakeholder shifts — surfaced with weight and provenance.",
              ring: "var(--brand-blue)",
            },
            {
              tag: "Act",
              title: "Next-move engine",
              body: "One tactical recommendation, ranked by impact and effort. No dashboard fatigue.",
              ring: "var(--brand-violet)",
            },
          ].map((c, i) => (
            <motion.div
              key={c.tag}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
            >
              <GlassCard className="p-7 h-full">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-6"
                  style={{ background: `color-mix(in oklab, ${c.ring} 18%, transparent)`, border: `1px solid ${c.ring}` }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: c.ring }} />
                </div>
                <SignalLabel>{c.tag}</SignalLabel>
                <h3 className="mt-2 text-xl font-semibold text-white">{c.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{c.body}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-auto max-w-5xl px-6 mt-32">
        <GlassCard tone="strong" className="relative overflow-hidden p-12 md:p-16 text-center">
          <div
            className="absolute inset-0 opacity-60"
            style={{ background: "var(--gradient-aurora)" }}
            aria-hidden
          />
          <div className="relative">
            <SignalLabel>One conversation</SignalLabel>
            <h3 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight text-white">
              One clear <span className="text-gradient">next move.</span>
            </h3>
            <p className="mt-4 max-w-xl mx-auto text-muted-foreground">
              Capture everything. Surface what matters. Move deals forward. Win the next call.
            </p>
            <Link
              to="/dashboard"
              className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-medium text-primary-foreground ambient-glow"
              style={{ background: "var(--gradient-signal)" }}
            >
              Open Command Center →
            </Link>
          </div>
        </GlassCard>
      </section>
    </main>
  );
}

function FloatingChip({
  className,
  label,
  value,
  tone,
  delay = 0,
}: {
  className?: string;
  label: string;
  value: string;
  tone: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: [0, -6, 0] }}
      transition={{
        opacity: { duration: 0.8, delay },
        y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay },
      }}
      className={`glass-strong rounded-xl px-3.5 py-2.5 ambient-glow ${className ?? ""}`}
    >
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: tone, boxShadow: `0 0 10px ${tone}` }} />
        <span className="text-[10px] tracking-[0.2em] font-mono" style={{ color: tone }}>
          {label}
        </span>
      </div>
      <div className="mt-1 text-sm text-white font-medium">{value}</div>
    </motion.div>
  );
}
