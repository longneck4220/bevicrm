import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { conversations, dashboardMetrics } from "@/features/intelligence/data";
import {
  GlassCard,
  MomentumBadge,
  RiskDot,
  SignalLabel,
  Sparkline,
} from "@/features/shared/primitives";
import { ParticleField } from "@/features/shared/ParticleField";
import { BeviMark } from "@/features/shared/BeviMark";

const fmt$ = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${(n / 1000).toFixed(0)}k`;

export function DashboardPage() {
  return (
    <main className="relative pt-28 pb-24">
      <ParticleField count={18} />

      <div className="relative mx-auto max-w-7xl px-6">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <SignalLabel>Command Center · Live</SignalLabel>
            <h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-tight text-white">
              Good morning, Avery.
            </h1>
            <p className="mt-2 text-muted-foreground max-w-lg">
              9 deals advanced overnight. 4 ask for your attention today. Here's the read.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="glass rounded-xl px-4 py-2.5 text-sm hover:bg-white/5 transition">
              This week
            </button>
            <button
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-primary-foreground"
              style={{ background: "var(--gradient-signal)" }}
            >
              Refresh signals
            </button>
          </div>
        </header>

        {/* METRICS */}
        <section className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active deals", value: dashboardMetrics.activeDeals.toString(), spark: [5, 6, 8, 7, 9, 10, 12, 11] },
            { label: "Pipeline value", value: fmt$(dashboardMetrics.pipelineValue), spark: [3, 4, 6, 7, 9, 10, 12, 14] },
            { label: "Signals today", value: dashboardMetrics.signalsToday.toString(), spark: [10, 8, 12, 9, 14, 11, 16, 18] },
            { label: "Next moves queued", value: dashboardMetrics.recommendedMoves.toString(), spark: [2, 3, 3, 4, 4, 6, 5, 7] },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
            >
              <GlassCard className="p-5">
                <SignalLabel>{m.label}</SignalLabel>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <div className="text-3xl font-semibold text-white tracking-tight">{m.value}</div>
                  <Sparkline values={m.spark} />
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </section>

        {/* MAIN GRID */}
        <section className="mt-8 grid lg:grid-cols-3 gap-6">
          {/* Conversations */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <SignalLabel>Live conversations</SignalLabel>
              <span className="signal-label font-sans font-bold text-lg !text-white/40">{conversations.length} active</span>
            </div>
            {conversations.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <Link to="/conversation/$id" params={{ id: c.id }}>
                  <GlassCard className="group p-6 hover:bg-white/[0.03] transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <RiskDot risk={c.risk} />
                          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                            {c.channel} · {c.when}
                          </span>
                          <MomentumBadge momentum={c.momentum} />
                        </div>
                        <h3 className="mt-3 text-lg font-semibold text-white">{c.account}</h3>
                        <div className="text-sm text-muted-foreground">{c.title}</div>
                        <p className="mt-3 text-sm text-white/70 line-clamp-2 leading-relaxed">
                          {c.summary}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <SignalLabel>Deal</SignalLabel>
                        <div className="text-xl font-semibold text-white">{fmt$(c.dealValue)}</div>
                        <div className="signal-label font-sans font-bold text-lg !text-[10px] mt-1">{c.stage}</div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center gap-2 flex-wrap">
                      {c.signals.slice(0, 3).map((s) => (
                        <SignalChip key={s.id} kind={s.kind} label={s.label} />
                      ))}
                      <span className="ml-auto text-xs text-white/40 group-hover:text-white/80 transition">
                        Open conversation →
                      </span>
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Next moves */}
          <aside className="space-y-4">
            <div className="flex items-center gap-2.5">
              <BeviMark size={22} animated={false} />
              <SignalLabel>Today's next moves</SignalLabel>
            </div>
            {conversations.flatMap((c) =>
              c.nextMoves.slice(0, 1).map((nm) => (
                <motion.div
                  key={nm.id + c.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <GlassCard tone="strong" className="p-5">
                    <div className="flex items-center justify-between">
                      <SignalLabel>{c.account}</SignalLabel>
                      <span
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{
                          color: "var(--brand-cyan)",
                          background: "color-mix(in oklab, var(--brand-cyan) 14%, transparent)",
                        }}
                      >
                        {nm.confidence}% conf
                      </span>
                    </div>
                    <div className="mt-2 text-[15px] text-white leading-snug font-medium">
                      {nm.title}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      {nm.rationale}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="signal-label font-sans font-bold text-lg">Effort · {nm.effort}</span>
                      <Link
                        to="/conversation/$id"
                        params={{ id: c.id }}
                        className="text-xs text-white hover:underline"
                      >
                        Execute →
                      </Link>
                    </div>
                  </GlassCard>
                </motion.div>
              )),
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}

export function SignalChip({ kind, label }: { kind: string; label: string }) {
  const map: Record<string, string> = {
    buying: "var(--signal-positive)",
    risk: "var(--signal-risk)",
    objection: "var(--signal-warning)",
    intent: "var(--brand-cyan)",
    stakeholder: "var(--brand-violet)",
  };
  const color = map[kind] ?? "var(--brand-cyan)";
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.14em] px-2 py-1 rounded-md"
      style={{
        color,
        background: `color-mix(in oklab, ${color} 12%, transparent)`,
        border: `1px solid color-mix(in oklab, ${color} 30%, transparent)`,
      }}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
