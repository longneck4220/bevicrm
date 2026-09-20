import { Link, useParams } from "@tanstack/react-router";
import { getRep, STATUS_COLOR, type AccountItem } from "./data";
import { RepRings, RingLegend } from "./RepRings";
import { ManagerHeader } from "./ManagerHeader";

function AccountCard({ account }: { account: AccountItem }) {
  return (
    <div
      className="rounded-xl border border-border bg-surface"
      style={{ borderLeft: `4px solid ${STATUS_COLOR[account.status]}` }}
    >
      <div className="p-4">
        <div className="flex items-baseline gap-2">
          <span className="font-bold">{account.name}</span>
          <span className="text-sm text-muted-foreground">· {account.venueType}</span>
        </div>
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
  const rep = getRep(repId);

  if (!rep) {
    return (
      <div className="min-h-screen bg-background p-8 text-foreground">
        <Link to="/manager" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to team
        </Link>
        <p className="mt-6 text-sm text-muted-foreground">Rep not found.</p>
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
              <div className="mt-0.5 text-sm text-muted-foreground">{rep.territory}</div>
            </div>
            <div className="flex items-center gap-3">
              <RepRings rings={rep.rings} status={rep.status} size={56} />
              <RingLegend />
            </div>
          </div>

          {/* Section 1: Needs attention */}
          <section className="mt-8">
            <SectionHeader>Needs attention</SectionHeader>
            <div className="mt-3 space-y-3">
              {rep.attention.map((a) => (
                <AccountCard key={a.name} account={a} />
              ))}
            </div>
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
