import { Link } from "@tanstack/react-router";
import { REPS, STATUS_COLOR } from "./data";
import { RepRings, SplitBar } from "./RepRings";

export function RepListPage() {
  const weekOf = new Date().toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
  });

  return (
    <div
      className="min-h-screen bg-white text-gray-900"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Header bar */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="relative mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <span className="text-lg font-bold tracking-tight">Bevi</span>
          <span className="absolute left-1/2 -translate-x-1/2 text-sm text-gray-500">
            Team overview · Week of {weekOf}
          </span>
          <span className="text-sm font-medium">Sarah Mitchell</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        {/* Level 1 — Rep list, ranked most help needed first */}
        <div className="space-y-4">
          {REPS.map((rep) => (
            <Link
              key={rep.id}
              to="/manager/$repId"
              params={{ repId: rep.id }}
              className="block rounded-lg bg-white border border-gray-200"
              style={{ borderLeft: `4px solid ${STATUS_COLOR[rep.status]}` }}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-bold leading-tight">{rep.name}</div>
                    <div className="mt-0.5 text-sm text-gray-500">{rep.territory}</div>
                  </div>
                  <RepRings rings={rep.rings} status={rep.status} size={72} />
                </div>

                <div className="mt-4">
                  <div className="text-3xl font-bold leading-none tabular-nums">
                    {rep.calls}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">calls this week</div>
                  <div
                    className="mt-0.5 text-xs font-medium"
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
