import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { GlassCard, RiskDot, SignalLabel } from "@/features/shared/primitives";
import { BeviMark } from "@/features/shared/BeviMark";
import { listVisits, type VisitListItem } from "@/lib/trial.functions";

const confidenceRank: Record<string, number> = {
  high: 3,
  High: 3,
  medium: 2,
  Medium: 2,
  low: 1,
  Low: 1,
};
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
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
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

  const allAccounts = useMemo(() => {
    const byAccount = new Map<string, VisitListItem>();
    for (const v of visits) if (!byAccount.has(v.account_id)) byAccount.set(v.account_id, v);
    return [...byAccount.values()];
  }, [visits]);

  const priorityAccounts = useMemo(() => {
    const rank = { high: 3, medium: 2, low: 1 } as const;
    return [...allAccounts].sort((a, b) => rank[visitRisk(b)] - rank[visitRisk(a)]).slice(0, 6);
  }, [allAccounts]);

  const q = query.trim().toLowerCase();
  const displayed = useMemo(() => {
    if (!q) return priorityAccounts;
    return allAccounts
      .filter(
        (v) =>
          v.account_name.toLowerCase().includes(q) ||
          (v.account_contact ?? "").toLowerCase().includes(q),
      )
      .sort((a, b) => a.account_name.localeCompare(b.account_name));
  }, [q, allAccounts, priorityAccounts]);

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
            to="/trial"
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
              Log your first post-visit note below. Your dashboard fills in automatically.
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
                        <span className="text-[10px] font-mono text-white/40">
                          {formatDate(v.created_at)}
                        </span>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* PRIORITY ACCOUNTS — ROLODEX */}
        {allAccounts.length > 0 && (
          <section className="mt-12">
            <div className="flex items-end justify-between gap-3">
              <SignalLabel as="h2">Priority accounts</SignalLabel>
              <span className="text-[10px] font-mono text-white/40">
                {allAccounts.length} account{allAccounts.length === 1 ? "" : "s"}
              </span>
            </div>
            <GlassCard className="mt-4 p-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 focus-within:border-white/15 transition-colors">
                <Search className="h-4 w-4 text-white/40 shrink-0" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && displayed[0]) {
                      navigate({ to: "/visit/$id", params: { id: displayed[0].id } });
                    } else if (e.key === "Escape") {
                      setQuery("");
                    }
                  }}
                  placeholder="Type a venue or contact…"
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                  aria-label="Search accounts"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="text-[10px] font-mono text-white/40 hover:text-white/70 shrink-0"
                  >
                    clear
                  </button>
                )}
              </div>

              <div className="mt-2 max-h-[320px] overflow-y-auto">
                {displayed.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No venues match "{query}"
                  </div>
                ) : (
                  <ul className="divide-y divide-white/5">
                    {displayed.map((v) => (
                      <li key={v.account_id}>
                        <Link
                          to="/visit/$id"
                          params={{ id: v.id }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-white/[0.03] transition-colors"
                        >
                          <RiskDot risk={visitRisk(v)} />
                          <div className="min-w-0 flex-1 flex items-baseline gap-2">
                            <span className="text-sm text-white truncate">{v.account_name}</span>
                            {v.account_contact && (
                              <span className="text-xs text-muted-foreground truncate">
                                · {v.account_contact}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-white/40 shrink-0 hidden sm:inline">
                            {formatDate(v.created_at)}
                          </span>
                          <span className="text-white/30 shrink-0">→</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-1 px-3 pt-2 pb-1 text-[10px] font-mono text-white/30 border-t border-white/5">
                {q
                  ? `${displayed.length} match${displayed.length === 1 ? "" : "es"}`
                  : "Showing top priorities — start typing to search all  ·  press / to focus"}
              </div>
            </GlassCard>
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
