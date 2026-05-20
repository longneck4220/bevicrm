import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { conversations } from "@/features/intelligence/data";
import { GlassCard, RiskDot, SignalLabel } from "@/features/shared/primitives";
import { BeviMark } from "@/features/shared/BeviMark";

export function MobileCompanionPage() {
  const today = conversations.slice(0, 3);
  return (
    <main className="relative pt-28 pb-16">
      <div className="mx-auto max-w-md px-5">
        <SignalLabel>Field</SignalLabel>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
          Open. Record. Act. Leave.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          One-handed in 30 seconds. Built for the carpark, not the dashboard.
        </p>

        {/* Primary action */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mt-8"
        >
          <Link
            to="/trial"
            className="relative block w-full rounded-3xl p-8 text-center ambient-glow"
            style={{ background: "var(--gradient-signal)" }}
          >
            <div className="flex justify-center">
              <span className="relative inline-flex w-20 h-20 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                <span className="absolute inset-0 rounded-full ring-pulse bg-white/10" />
                <span className="relative w-5 h-5 rounded-full bg-white" />
              </span>
            </div>
            <div className="mt-5 text-2xl font-semibold text-white tracking-tight">
              Record visit
            </div>
            <div className="mt-1 text-xs font-mono uppercase tracking-[0.2em] text-white/80">
              Tap. Talk. Done.
            </div>
          </Link>
        </motion.div>

        {/* Today's accounts — quick context */}
        <div className="mt-10">
          <SignalLabel>Today's stops</SignalLabel>
          <div className="mt-3 space-y-2.5">
            {today.map((c) => (
              <Link key={c.id} to="/conversation/$id" params={{ id: c.id }}>
                <GlassCard className="p-4 flex items-center gap-3 active:bg-white/[0.04] transition">
                  <RiskDot risk={c.risk} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white truncate">{c.account}</div>
                    <div className="text-[11px] text-white/50 truncate">{c.nextMoves[0].title}</div>
                  </div>
                  <span className="text-white/40">→</span>
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">
          <BeviMark size={14} animated={false} />
          <span>BEVI · field intelligence</span>
        </div>
      </div>
    </main>
  );
}
