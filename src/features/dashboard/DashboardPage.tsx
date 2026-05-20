import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { conversations } from "@/features/intelligence/data";
import { GlassCard, RiskDot, SignalLabel } from "@/features/shared/primitives";
import { BeviMark } from "@/features/shared/BeviMark";

const fmt$ = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${(n / 1000).toFixed(0)}k`;

export function DashboardPage() {
  const nextMoves = conversations.flatMap((c) =>
    c.nextMoves.slice(0, 1).map((nm) => ({ nm, c })),
  );
  const priorityAccounts = [...conversations].sort(
    (a, b) => (b.risk === "high" ? 2 : b.risk === "medium" ? 1 : 0) - (a.risk === "high" ? 2 : a.risk === "medium" ? 1 : 0),
  );

  return (
    <main className="relative pt-28 pb-24">
      <div className="relative mx-auto max-w-5xl px-6">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <SignalLabel>Today · Field view</SignalLabel>
            <h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-tight text-white">
              Sales Intelligence Dashboard
            </h1>
            <p className="mt-2 text-muted-foreground max-w-lg">
              Good morning, Matthew. Four moves to make. Three accounts to watch. Pick one and go.
            </p>
          </div>
          <Link
            to="/mobile"
            className="rounded-xl px-5 py-3 text-sm font-medium text-primary-foreground"
            style={{ background: "var(--gradient-signal)" }}
          >
            Record a visit →
          </Link>
        </header>

        {/* TODAY'S NEXT MOVES */}
        <section className="mt-12">
          <div className="flex items-center gap-2.5 mb-4">
            <BeviMark size={20} animated={false} />
            <SignalLabel as="h2">Today's next moves</SignalLabel>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {nextMoves.map(({ nm, c }, i) => (
              <motion.div
                key={nm.id + c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
              >
                <GlassCard tone="strong" className="p-5">
                  <div className="flex items-center justify-between">
                    <SignalLabel>{c.account}</SignalLabel>
                    <span className="text-[10px] font-mono text-white/50">
                      Effort · {nm.effort}
                    </span>
                  </div>
                  <div className="mt-2 text-[15px] text-white leading-snug font-medium">
                    {nm.title}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {nm.rationale}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <Link
                      to="/conversation/$id"
                      params={{ id: c.id }}
                      className="text-xs text-white hover:underline"
                    >
                      Open account →
                    </Link>
                    <button className="text-xs text-white/60 hover:text-white">Done</button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* PRIORITY ACCOUNTS */}
        <section className="mt-12">
          <SignalLabel as="h2">Priority accounts</SignalLabel>
          <div className="mt-4 space-y-3">
            {priorityAccounts.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Link to="/conversation/$id" params={{ id: c.id }}>
                  <GlassCard className="p-4 hover:bg-white/[0.03] transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <RiskDot risk={c.risk} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[15px] font-medium text-white truncate">{c.account}</div>
                        <div className="text-xs text-muted-foreground truncate">{c.title}</div>
                      </div>
                      <div className="text-right shrink-0 hidden sm:block">
                        <div className="text-sm text-white">{fmt$(c.dealValue)}</div>
                        <div className="signal-label font-sans text-lg text-right font-extrabold !text-[10px] mt-0.5">{c.stage}</div>
                      </div>
                      <span className="text-white/40">→</span>
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FOLLOW UPS DUE */}
        <section className="mt-12">
          <SignalLabel>Follow ups due</SignalLabel>
          <GlassCard className="mt-4 p-5">
            <ul className="divide-y divide-white/5">
              {conversations.map((c) => (
                <li key={c.id} className="flex items-center gap-4 py-3">
                  <span className="text-xs font-mono text-white/40 w-20 shrink-0">{c.when.split(" · ")[0]}</span>
                  <span className="text-sm text-white truncate flex-1">{c.account}</span>
                  <span className="text-xs text-muted-foreground truncate hidden sm:block">{c.contact.split(" — ")[0]}</span>
                  <Link
                    to="/conversation/$id"
                    params={{ id: c.id }}
                    className="text-xs text-white/70 hover:text-white shrink-0"
                  >
                    Open →
                  </Link>
                </li>
              ))}
            </ul>
          </GlassCard>
        </section>

        {/* TERRITORY SNAPSHOT */}
        <section className="mt-12">
          <SignalLabel>Territory snapshot</SignalLabel>
          <GlassCard className="mt-4 p-8 text-center">
            <div className="text-sm text-white/60">Coming soon</div>
            <div className="mt-1 text-xs text-white/40">
              Visit cadence, account coverage, and route planning land in the next sync.
            </div>
          </GlassCard>
        </section>
      </div>
    </main>
  );
}
