import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { BeviMark } from "@/features/shared/BeviMark";
import { ParticleField } from "@/features/shared/ParticleField";
import { GlassCard, SignalLabel } from "@/features/shared/primitives";

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
              <SignalLabel className="text-left leading-tight">
                POST VISIT SALES INTELLIGENCE
                <br />
                &nbsp; FOR FIELD MANAGERS&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
              </SignalLabel>
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
              BEVI turns post-visit thinking into CRM ready notes, account memory and the next best
              commercial move.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="show"
              variants={fadeUp}
              custom={3}
              className="mt-10 flex flex-wrap items-center gap-3"
            >
              <Link
                to="/try"
                className="group relative inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold tracking-wide text-primary-foreground ambient-glow border border-white/15 shadow-lg shadow-black/30 hover:shadow-xl transition-shadow"
                style={{ background: "var(--gradient-signal)" }}
              >
                Try a Visit Note
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
              <Link
                to="/how-it-works"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold tracking-wide glass border border-white/15 hover:bg-white/5 transition-colors"
              >
                How it works
                <span>→</span>
              </Link>
              <Link
                to="/mobile"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold tracking-wide glass border border-white/15 hover:bg-white/5 transition-colors"
              >
                See Example Output
                <span>→</span>
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
            </div>
          </motion.div>
        </div>
      </section>

      {/* THREE PILLARS — Senses · Understands · Delivers */}
      <section className="relative mx-auto max-w-7xl px-6 mt-24">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "BEVI SENSES OPPORTUNITY", tone: "var(--brand-cyan)" },
            { label: "BEVI UNDERSTANDS CONTEXT", tone: "var(--brand-blue)" },
            { label: "DELIVERS THE NEXT MOVE", tone: "var(--brand-violet)" },
          ].map((p) => (
            <div key={p.label} className="glass rounded-2xl px-5 py-4 flex items-center gap-3">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: p.tone, boxShadow: `0 0 14px ${p.tone}` }}
              />
              <span className="signal-label font-sans font-bold text-lg !text-white/90">
                {p.label}
              </span>
            </div>
          ))}
        </div>
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
              tag: "BEVI SENSES OPPORTUNITY",
              title: "Capture",
              body: "Dictate or type the rough notes, buyer cues, pricing tension, product talk and promises before they get lost.",
              ring: "var(--brand-cyan)",
            },
            {
              tag: "UNDERSTANDS SALES CONTEXT",
              title: "Signal\u00A0",
              body: "BEVI identifies intent, objections, margin pressure, opportunity quality, missed details and what matters for the next call.",
              ring: "var(--brand-blue)",
            },
            {
              tag: "BEVI ACTS",
              title: "Move",
              body: "Generate a CRM-ready note, follow-up email, automatic updated account memory and one practical commercial action to take next.",
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
                  style={{
                    background: `color-mix(in oklab, ${c.ring} 18%, transparent)`,
                    border: `1px solid ${c.ring}`,
                  }}
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
