import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { conversations } from "@/features/intelligence/data";
import { GlassCard, MomentumBadge, RiskDot, SignalLabel, SignalChip } from "@/features/shared/primitives";

export function ConversationDetailPage({ id }: { id: string }) {
  const conv = conversations.find((c) => c.id === id) ?? conversations[0];
  const fmt$ = (n: number) => `$${(n / 1000).toFixed(0)}k`;

  return (
    <main className="relative pt-28 pb-24">
      <div className="mx-auto max-w-7xl px-6">
        <Link to="/dashboard" className="signal-label font-sans font-bold text-lg hover:!text-white transition">
          ← Command Center
        </Link>

        <header className="mt-6 flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 flex-wrap">
              <RiskDot risk={conv.risk} />
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                {conv.channel} · {conv.when} · {conv.durationMin > 0 ? `${conv.durationMin}m` : "thread"}
              </span>
              <MomentumBadge momentum={conv.momentum} />
            </div>
            <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-white">
              {conv.account}
            </h1>
            <div className="mt-1 text-muted-foreground">{conv.title}</div>
            <div className="mt-1 text-sm text-white/60">{conv.contact}</div>
          </div>
          <GlassCard className="px-5 py-4 text-right">
            <SignalLabel>MAT Value</SignalLabel>
            <div className="text-3xl font-semibold text-white">{fmt$(conv.dealValue)}</div>
            <div className="signal-label font-sans font-bold text-lg !text-[10px] mt-0.5">{conv.stage}</div>
          </GlassCard>
        </header>

        {/* Hero recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-8"
        >
          <GlassCard tone="strong" className="relative overflow-hidden p-7 md:p-9 ambient-glow">
            <div
              className="absolute inset-0 opacity-50 pointer-events-none"
              style={{ background: "var(--gradient-aurora)" }}
            />
            <div className="relative flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1">
                <SignalLabel>Highest-impact next move</SignalLabel>
                <h2 className="mt-3 text-2xl md:text-3xl font-semibold tracking-tight text-white leading-tight">
                  {conv.nextMoves[0].title}
                </h2>
                <p className="mt-3 text-muted-foreground max-w-2xl">
                  {conv.nextMoves[0].rationale}
                </p>
              </div>
              <div className="flex md:flex-col items-center md:items-end gap-4">
                <ConfidenceRing value={conv.nextMoves[0].confidence} />
                <button
                  className="rounded-xl px-5 py-3 text-sm font-medium text-primary-foreground whitespace-nowrap"
                  style={{ background: "var(--gradient-signal)" }}
                >
                  Execute move
                </button>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Grid */}
        <section className="mt-8 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Summary */}
            <GlassCard className="p-6">
              <SignalLabel>AI brief</SignalLabel>
              <p className="mt-3 text-white/85 leading-relaxed">{conv.summary}</p>
            </GlassCard>

            {/* Transcript highlights */}
            <GlassCard className="p-6">
              <SignalLabel>Signal moments</SignalLabel>
              <div className="mt-5 space-y-4">
                {conv.transcriptHighlights.map((t, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex gap-4"
                  >
                    <div className="signal-label font-sans font-bold text-lg !text-white/40 w-16 shrink-0 pt-1">
                      {t.speaker}
                    </div>
                    <div className="flex-1">
                      <p className="text-white/85">{t.text}</p>
                      {t.tag && (
                        <div className="mt-1.5">
                          <SignalChip kind={tagToKind(t.tag)} label={t.tag} />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>

            {/* All next moves */}
            <GlassCard className="p-6">
              <SignalLabel>Recommendation stack</SignalLabel>
              <div className="mt-4 space-y-3">
                {conv.nextMoves.map((nm) => (
                  <div key={nm.id} className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="shrink-0">
                      <ConfidenceRing value={nm.confidence} size={56} />
                    </div>
                    <div className="flex-1">
                      <div className="text-[15px] font-medium text-white">{nm.title}</div>
                      <p className="mt-1 text-sm text-muted-foreground">{nm.rationale}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="signal-label font-sans font-bold text-lg">effort · {nm.effort}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          <aside className="space-y-6">
            {/* Signals */}
            <GlassCard className="p-6">
              <SignalLabel>Live signals</SignalLabel>
              <div className="mt-4 space-y-3">
                {conv.signals.map((s) => (
                  <div key={s.id} className="">
                    <div className="flex items-center justify-between">
                      <SignalChip kind={s.kind} label={s.label} />
                      <span className="text-[11px] font-mono text-white/40">{s.at}</span>
                    </div>
                    <div className="mt-1.5 text-xs text-muted-foreground pl-1">{s.detail}</div>
                    <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${s.weight}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="h-full"
                        style={{ background: "var(--gradient-signal)" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Stakeholders */}
            <GlassCard className="p-6">
              <SignalLabel>Stakeholder map</SignalLabel>
              <div className="mt-4 space-y-3">
                {conv.stakeholders.map((s) => (
                  <div key={s.name}>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <div className="text-white">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.role}</div>
                      </div>
                      <span
                        className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded"
                        style={{
                          color: sentimentColor(s.sentiment),
                          background: `color-mix(in oklab, ${sentimentColor(s.sentiment)} 14%, transparent)`,
                        }}
                      >
                        {s.sentiment}
                      </span>
                    </div>
                    <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${s.alignment}%` }}
                        transition={{ duration: 1.1 }}
                        className="h-full"
                        style={{ background: sentimentColor(s.sentiment) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </aside>
        </section>
      </div>
    </main>
  );
}

function tagToKind(t: string) {
  if (t === "commit" || t === "action") return "intent";
  return t;
}

function sentimentColor(s: "champion" | "neutral" | "blocker") {
  return s === "champion"
    ? "var(--signal-positive)"
    : s === "blocker"
      ? "var(--signal-risk)"
      : "var(--brand-cyan)";
}

function ConfidenceRing({ value, size = 80 }: { value: number; size?: number }) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="oklch(0.97 0.01 250 / 0.08)" strokeWidth="3" fill="none" />
        <defs>
          <linearGradient id={`cring-${size}`} x1="0" x2="1">
            <stop offset="0" stopColor="oklch(0.74 0.13 195)" />
            <stop offset="1" stopColor="oklch(0.55 0.25 295)" />
          </linearGradient>
        </defs>
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#cring-${size})`}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.3, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center leading-none">
          <div className="text-base font-semibold text-white">{value}</div>
          <div className="signal-label font-sans font-bold text-lg !text-[8px] mt-0.5">conf</div>
        </div>
      </div>
    </div>
  );
}
