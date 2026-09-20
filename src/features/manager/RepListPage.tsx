import { Link } from "@tanstack/react-router";
import { REPS, STATUS_COLOR } from "./data";
import { RepRings, RingLegend, SplitBar } from "./RepRings";
import { ManagerHeader } from "./ManagerHeader";

export function RepListPage() {
  const weekOf = new Date().toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ManagerHeader subtitle={`Team overview · Week of ${weekOf}`} />

      <main className="mx-auto max-w-3xl px-5 py-8">
        {/* Level 1 — Rep list, ranked most help needed first */}
        <div className="space-y-4">
          {REPS.map((rep) => (
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
                    <div className="mt-0.5 text-sm text-muted-foreground">{rep.territory}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <RepRings rings={rep.rings} status={rep.status} size={72} />
                    <RingLegend />
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-3xl font-bold leading-none tabular-nums">{rep.calls}</div>
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

                <div className="mt-4">
                  <SplitBar onPremise={rep.onPremise} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
