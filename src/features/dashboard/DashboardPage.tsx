import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { GlassCard, RiskDot, SignalLabel } from "@/features/shared/primitives";
import { BeviMark } from "@/features/shared/BeviMark";
import { listVisits, type VisitListItem } from "@/lib/trial.functions";

const confidenceRank: Record<string, number> = { high: 3, High: 3, medium: 2, Medium: 2, low: 1, Low: 1 };
const postureRank: Record<string, number> = { Push: 4, Recommend: 3, Suggest: 2, Hold: 1 };

function visitRisk(v: VisitListItem): "low" | "medium" | "high" {
  const flags = v.ai_output?.commercial_signals?.risk_flags?.length ?? 0;
  if (flags >= 2) return "high";
  if (flags === 1) return "medium";
  return "low";
}

function moveScore(v: VisitListItem): number {
  const c = confidenceRank[v.ai_output?.next_best_move?.confidence ?? ""] ?? 0;
  const p = postureRank[v.ai_output?.next_best_move?.commercial_posture ?? ""] ?? 0;
  const recencyHours = (Date.now() - new Date(v.created_at).getTime()) / 36e5;
  const recency = Math.max(0, 72 - recencyHours) / 72; // 0..1 over 3 days
  return c * 10 + p * 5 + recency * 4;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return `Today · ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  const diffDays = Math.floor((today.getTime() - d.getTime()) / 86400000);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function DashboardPage() {
  const fetchVisits = useServerFn(listVisits);
  const navigate = useNavigate();
  const { data: visits = [], isLoading } = useQuery({
    queryKey: ["visits"],
    queryFn: () => fetchVisits(),
  });
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const nextMoves = useMemo(
    () =>
      [...visits]
        .filter((v) => v.ai_output?.next_best_move?.recommendation)
        .sort((a, b) => moveScore(b) - moveScore(a))
        .slice(0, 4),
    [visits],
  );

  const priorityAccounts = useMemo(() => {
    const byAccount = new Map<string, VisitListItem>();
    for (const v of visits) if (!byAccount.has(v.account_id)) byAccount.set(v.account_id, v);
    const rank = { high: 3, medium: 2, low: 1 } as const;
    return [...byAccount.values()].sort((a, b) => rank[visitRisk(b)] - rank[visitRisk(a)]).slice(0, 6);
  }, [visits]);

  const highConfidenceCount = visits.filter(
    (v) => (v.ai_output?.next_best_move?.confidence ?? "").toLowerCase() === "high",
  ).length;

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
              {isLoading
                ? "Loading your latest visits…"
                : visits.length === 0
                  ? "Record your first visit to populate your dashboard."
                  : `${visits.length} visit${visits.length === 1 ? "" : "s"} logged · ${highConfidenceCount} high-confidence move${highConfidenceCount === 1 ? "" : "s"}.`}
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

        {visits.length === 0 && !isLoading && (
          <GlassCard className="mt-12 p-8 text-center">
            <div className="text-white font-medium">No visits recorded yet</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Head to the trial recorder to capture your first post-visit note. Your dashboard fills in automatically.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <Link
                to="/trial"
                className="rounded-xl px-4 py-2 text-sm font-medium text-primary-foreground"
                style={{ background: "var(--gradient-signal)" }}
              >
                Open recorder →
              </Link>
            </div>
          </GlassCard>
        )}

        {/* TODAY'S NEXT MOVES */}
        {nextMoves.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-2.5 mb-4">
              <BeviMark size={20} animated={false} />
              <SignalLabel as="h2">Today's next moves</SignalLabel>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {nextMoves.map((v, i) => {
                const nbm = v.ai_output!.next_best_move;
                return (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.06 }}
                  >
                    <GlassCard tone="strong" className="p-5">
                      <div className="flex items-center justify-between">
                        <SignalLabel>{v.account_name}</SignalLabel>
                        <span className="text-[10px] font-mono text-white/50">
                          {nbm.commercial_posture} · {nbm.confidence}
                        </span>
                      </div>
                      <div className="mt-2 text-[15px] text-white leading-snug font-medium">
                        {nbm.recommendation}
                      </div>
                      {nbm.specific_ask && (
                        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                          Ask: {nbm.specific_ask}
                        </p>
                      )}
                      <div className="mt-4 flex items-center justify-between">
                        <Link
                          to="/visit/$id"
                          params={{ id: v.id }}
                          className="text-xs text-white hover:underline"
                        >
                          Open visit →
                        </Link>
                        <span className="text-[10px] font-mono text-white/40">{formatDate(v.created_at)}</span>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* PRIORITY ACCOUNTS */}
        {priorityAccounts.length > 0 && (
          <section className="mt-12">
            <SignalLabel as="h2">Priority accounts</SignalLabel>
            <div className="mt-4 space-y-3">
              {priorityAccounts.map((v, i) => (
                <motion.div
                  key={v.account_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <Link to="/visit/$id" params={{ id: v.id }}>
                    <GlassCard className="p-4 hover:bg-white/[0.03] transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <RiskDot risk={visitRisk(v)} />
                        <div className="min-w-0 flex-1">
                          <div className="text-[15px] font-medium text-white truncate">{v.account_name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {v.ai_output?.next_best_move?.recommendation ?? "No recommendation yet"}
                          </div>
                        </div>
                        <div className="text-right shrink-0 hidden sm:block">
                          <div className="text-[10px] font-mono text-white/50">{formatDate(v.created_at)}</div>
                        </div>
                        <span className="text-white/40">→</span>
                      </div>
                    </GlassCard>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* RECENT VISITS */}
        {visits.length > 0 && (
          <section className="mt-12">
            <SignalLabel as="h2">Recent visits</SignalLabel>
            <GlassCard className="mt-4 p-5">
              <ul className="divide-y divide-white/5">
                {visits.slice(0, 12).map((v) => (
                  <li key={v.id} className="flex items-center gap-4 py-3">
                    <span className="text-xs font-mono text-white/40 w-24 shrink-0">
                      {formatDate(v.created_at)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-white truncate">{v.account_name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {v.ai_output?.next_best_move?.recommendation ?? "—"}
                      </div>
                    </div>
                    {v.rating && (
                      <span className="text-[10px] font-mono text-white/40 hidden sm:inline">
                        {v.rating === "good" ? "✓" : "↻"}
                      </span>
                    )}
                    <Link
                      to="/visit/$id"
                      params={{ id: v.id }}
                      className="text-xs text-white/70 hover:text-white shrink-0"
                    >
                      Open →
                    </Link>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </section>
        )}
      </div>
    </main>
  );
}
