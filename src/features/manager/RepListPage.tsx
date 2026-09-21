import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { STATUS_COLOR } from "./data";
import { RepRings, RingLegend } from "./RepRings";
import { ManagerHeader } from "./ManagerHeader";
import { listTeamOverview } from "@/lib/manager.functions";

export function RepListPage() {
  const weekOf = new Date().toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
  });

  const fetchOverview = useServerFn(listTeamOverview);
  const { data, isLoading, error } = useQuery({
    queryKey: ["manager-team-overview"],
    queryFn: () => fetchOverview(),
  });
  const reps = data?.reps ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ManagerHeader subtitle={`Team overview · Week of ${weekOf}`} />

      <main className="mx-auto max-w-3xl px-5 py-8">
        {isLoading && <p className="text-sm text-muted-foreground">Loading your team…</p>}
        {error && (
          <p className="text-sm text-[var(--signal-risk)]">
            Could not load the team. Please try again.
          </p>
        )}
        {!isLoading && !error && reps.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No reps found yet — once they're invited and logging visits, they'll show up here.
          </p>
        )}

        {/* Level 1 — Rep list, ranked most help needed first */}
        <div className="space-y-4">
          {reps.map((rep) => (
            <Link
              key={rep.id}
              to="/manager/$repId"
              params={{ repId: rep.id }}
              className="block rounded-xl border border-border bg-surface transition-colors duration-200 hover:bg-surface-2"
              style={{ borderLeft: `4px solid ${STATUS_COLOR[rep.status]}` }}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-bold leading-tight">{rep.name}</div>
                    <div className="mt-0.5 text-sm text-muted-foreground">
                      {rep.accountCount} account{rep.accountCount === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <RepRings
                      rings={{
                        volume: Math.min(rep.callsThisWeek / rep.target, 1),
                        quality: rep.notesQuality,
                        progression: rep.progression,
                      }}
                      status={rep.status}
                      size={96}
                    />
                    <RingLegend />
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-3xl font-bold leading-none tabular-nums">
                    {rep.callsThisWeek}
                  </div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    calls this week
                  </div>
                  <div
                    className="mt-0.5 font-mono text-[11px] font-medium uppercase tracking-[0.1em]"
                    style={{ color: STATUS_COLOR[rep.status] }}
                  >
                    Target: {rep.target}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
