import { Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { STATUS_COLOR } from "./data";
import { RepRings, RingLegend } from "./RepRings";
import { ManagerHeader } from "./ManagerHeader";
import { listTeamOverview, type ManagerAccountItem } from "@/lib/manager.functions";

function AccountCard({ account }: { account: ManagerAccountItem }) {
  return (
    <div
      className="rounded-xl border border-border bg-surface"
      style={{ borderLeft: `4px solid ${STATUS_COLOR[account.status]}` }}
    >
      <div className="p-4">
        <span className="font-bold">{account.name}</span>
        <p className="mt-1.5 text-sm leading-snug text-foreground/90">{account.summary}</p>
        <p className="mt-2 text-sm leading-snug">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Manager action:{" "}
          </span>
          <span className="text-foreground">{account.action}</span>
        </p>
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </h2>
  );
}

export function RepDetailPage() {
  const { repId } = useParams({ from: "/_authenticated/manager/$repId" });
  const fetchOverview = useServerFn(listTeamOverview);
  const { data, isLoading, error } = useQuery({
    queryKey: ["manager-team-overview"],
    queryFn: () => fetchOverview(),
  });
  const rep = data?.reps.find((r) => r.id === repId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8 text-foreground">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (error || !rep) {
    return (
      <div className="min-h-screen bg-background p-8 text-foreground">
        <Link to="/manager" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to team
        </Link>
        <p className="mt-6 text-sm text-muted-foreground">
          {error ? "Could not load this rep." : "Rep not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ManagerHeader />

      <main className="mx-auto max-w-3xl px-5 pt-4 pb-8">
        <Link
          to="/manager"
          className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          ← Back to team
        </Link>
        <div className="mt-6">
          {/* Rep header: name + smaller rings */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold leading-tight">{rep.name}</h1>
              <div className="mt-0.5 text-sm text-muted-foreground">
                {rep.email ?? `${rep.accountCount} account${rep.accountCount === 1 ? "" : "s"}`}
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
                size={56}
              />
              <RingLegend />
            </div>
          </div>

          {/* Section 1: Needs attention */}
          <section className="mt-8">
            <SectionHeader>Needs attention</SectionHeader>
            {rep.attention.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Nothing needs attention right now.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {rep.attention.map((a) => (
                  <AccountCard key={a.name} account={a} />
                ))}
              </div>
            )}
          </section>

          {/* Section 2: On track */}
          <section className="mt-8">
            <SectionHeader>On track</SectionHeader>
            {rep.onTrack.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No accounts currently on track</p>
            ) : (
              <div className="mt-3 space-y-3">
                {rep.onTrack.map((a) => (
                  <AccountCard key={a.name} account={a} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
