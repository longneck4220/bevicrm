import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  GlassCard,
  SignalLabel,
  SignalChip,
  RiskDot,
  MomentumBadge,
} from "@/features/shared/primitives";
import { BeviMark } from "@/features/shared/BeviMark";
import {
  getAccountBriefing,
  type AccountBriefing,
  type AccountBriefingVisit,
} from "@/lib/trial.functions";
import { ReviewImportedHistoryCard } from "@/features/prep/ReviewImportedHistoryCard";

const postureRank: Record<string, number> = { Push: 4, Recommend: 3, Suggest: 2, Hold: 1 };

function risk(visits: AccountBriefingVisit[]): "low" | "medium" | "high" {
  const flags = visits[0]?.ai_output?.commercial_signals?.risk_flags?.length ?? 0;
  if (flags >= 2) return "high";
  if (flags === 1) return "medium";
  return "low";
}

function momentum(visits: AccountBriefingVisit[]): "accelerating" | "steady" | "stalling" {
  if (visits.length < 2) return "steady";
  const latest = postureRank[visits[0].ai_output?.next_best_move?.commercial_posture ?? ""] ?? 0;
  const prev = postureRank[visits[1].ai_output?.next_best_move?.commercial_posture ?? ""] ?? 0;
  if (latest > prev) return "accelerating";
  if (latest < prev) return "stalling";
  return "steady";
}

function standingLine(visits: AccountBriefingVisit[]): string {
  if (visits.length === 0) return "First visit — no history yet";
  const latest = visits[0];
  const flags = latest.ai_output?.commercial_signals?.risk_flags?.length ?? 0;
  const posture = latest.ai_output?.next_best_move?.commercial_posture;
  if (flags >= 2) return "At risk — multiple open flags from last visit";
  if (posture === "Push") return "Strong — ready to push this visit";
  if (posture === "Hold") return "Holding — no clear opening yet";
  return "Steady — building toward the next move";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PreVisitPage({ accountId }: { accountId: string }) {
  const fetchBriefing = useServerFn(getAccountBriefing);
  const { data, isLoading, error } = useQuery({
    queryKey: ["account-briefing", accountId],
    queryFn: () => fetchBriefing({ data: { accountId } }),
  });

  if (isLoading) {
    return (
      <main className="pt-28 pb-24 max-w-3xl mx-auto px-6 text-sm text-white/50">
        Loading pre-visit briefing…
      </main>
    );
  }
  if (error || !data) {
    return (
      <main className="pt-28 pb-24 max-w-3xl mx-auto px-6">
        <p className="text-sm text-[var(--signal-risk)]">Account not found.</p>
        <Link to="/dashboard" className="text-xs text-white/70 hover:text-white mt-4 inline-block">
          ← Back to dashboard
        </Link>
      </main>
    );
  }

  return <PreVisitView data={data} />;
}

/** Pure presentational view, split out so it can be rendered/tested with data from any source. */
export function PreVisitView({ data }: { data: AccountBriefing }) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const visits = data.visits;
  const latest = visits[0] ?? null;
  const nbm = latest?.ai_output?.next_best_move ?? null;
  const signals = latest?.ai_output?.commercial_signals ?? null;

  return (
    <main className="relative pt-28 pb-24">
      <div className="mx-auto max-w-3xl px-6">
        <Link to="/dashboard" className="text-xs text-white/60 hover:text-white">
          ← Back to dashboard
        </Link>

        <header className="mt-4 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <BeviMark size={28} animated={false} />
            <div>
              <SignalLabel>Pre-visit briefing</SignalLabel>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">{data.name}</h1>
              <p className="text-xs text-white/50 mt-1">
                {data.contact ? `${data.contact} · ` : ""}
                {visits.length} visit{visits.length === 1 ? "" : "s"} logged
              </p>
            </div>
          </div>
          <Link
            to="/trial"
            className="rounded-xl px-4 py-2 text-sm font-medium text-primary-foreground"
            style={{ background: "var(--gradient-signal)" }}
          >
            Log a visit →
          </Link>
        </header>

        {data.memory.trim().length === 0 &&
          data.memoryDraft &&
          data.memoryDraft.trim().length > 0 && (
            <div className="mt-8">
              <ReviewImportedHistoryCard accountId={data.id} memoryDraft={data.memoryDraft} />
            </div>
          )}

        {/* Standing line */}
        <GlassCard tone="strong" className="mt-6 p-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <RiskDot risk={risk(visits)} />
              <span className="text-lg text-white leading-snug font-medium">
                {standingLine(visits)}
              </span>
            </div>
            <MomentumBadge momentum={momentum(visits)} />
          </div>
        </GlassCard>

        {/* Latest next move */}
        {nbm && (
          <GlassCard className="mt-6 p-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <SignalLabel as="h2">Next move</SignalLabel>
              <span className="text-[10px] font-mono text-white/50">
                {nbm.commercial_posture} · {nbm.confidence} confidence
              </span>
            </div>
            <div className="mt-3 text-lg text-white leading-snug font-medium">
              {nbm.recommendation}
            </div>
            {nbm.specific_ask && (
              <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">
                  Specific ask
                </div>
                <div className="mt-1 text-sm text-white">{nbm.specific_ask}</div>
              </div>
            )}
            {signals &&
              (signals.risk_flags?.length > 0 || signals.opportunity_signals?.length > 0) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {signals.risk_flags?.map((r, i) => (
                    <SignalChip key={`r-${i}`} kind="risk" label={r} />
                  ))}
                  {signals.opportunity_signals?.map((o, i) => (
                    <SignalChip key={`o-${i}`} kind="buying" label={o} />
                  ))}
                </div>
              )}
            <Link
              to="/visit/$id"
              params={{ id: latest.id }}
              className="mt-4 inline-block text-xs text-white/70 hover:text-white"
            >
              View full visit intelligence →
            </Link>
          </GlassCard>
        )}

        {/* Account memory */}
        <GlassCard className="mt-6 p-6">
          <SignalLabel as="h2">Account memory</SignalLabel>
          {data.memory.trim() ? (
            <pre className="mt-3 text-[13px] text-white/80 whitespace-pre-wrap font-sans leading-relaxed">
              {data.memory}
            </pre>
          ) : (
            <p className="mt-3 text-sm text-white/50">
              No memory yet — this builds itself automatically as you log visits.
            </p>
          )}
        </GlassCard>

        {/* Visit history */}
        <GlassCard className="mt-6 p-6">
          <button
            type="button"
            onClick={() => setHistoryOpen((v) => !v)}
            className="flex w-full items-center justify-between text-left"
          >
            <SignalLabel as="h2">Visit history ({visits.length})</SignalLabel>
            <span className="text-xs text-white/50">{historyOpen ? "Hide" : "Show"}</span>
          </button>
          {historyOpen && (
            <ul className="mt-4 divide-y divide-white/5">
              {visits.length === 0 && (
                <li className="py-3 text-sm text-white/50">No visits recorded yet.</li>
              )}
              {visits.map((v) => (
                <li key={v.id} className="py-3">
                  <Link
                    to="/visit/$id"
                    params={{ id: v.id }}
                    className="flex items-center gap-4 hover:opacity-80"
                  >
                    <span className="text-xs font-mono text-white/40 w-24 shrink-0">
                      {formatDate(v.created_at)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-white truncate">
                        {v.ai_output?.next_best_move?.recommendation ?? "—"}
                      </div>
                    </div>
                    <span className="text-white/30 shrink-0">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>
    </main>
  );
}
