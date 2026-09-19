import { Link, useParams } from "@tanstack/react-router";
import { getRep, STATUS_COLOR, type AccountItem } from "./data";
import { RepRings } from "./RepRings";

function AccountCard({ account }: { account: AccountItem }) {
  return (
    <div
      className="rounded-lg bg-white border border-gray-200"
      style={{ borderLeft: `4px solid ${STATUS_COLOR[account.status]}` }}
    >
      <div className="p-4">
        <div className="flex items-baseline gap-2">
          <span className="font-bold">{account.name}</span>
          <span className="text-sm text-gray-500">· {account.venueType}</span>
        </div>
        <p className="mt-1.5 text-sm leading-snug text-gray-700">{account.summary}</p>
        <p className="mt-2 text-sm leading-snug">
          <span className="font-medium text-gray-500">Manager action: </span>
          <span className="text-gray-900">{account.action}</span>
        </p>
      </div>
    </div>
  );
}

export function RepDetailPage() {
  const { repId } = useParams({ from: "/_authenticated/manager/$repId" });
  const rep = getRep(repId);

  if (!rep) {
    return (
      <div className="min-h-screen bg-white p-8 text-gray-900">
        <Link to="/manager" className="text-sm text-gray-500 hover:text-gray-900">
          ← Back to team
        </Link>
        <p className="mt-6 text-sm text-gray-500">Rep not found.</p>
      </div>
    );
  }

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
        <div className="mx-auto flex h-14 max-w-3xl items-center px-5">
          <Link
            to="/manager"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            ← Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        {/* Rep header: name + smaller rings */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold leading-tight">{rep.name}</h1>
            <div className="mt-0.5 text-sm text-gray-500">{rep.territory}</div>
          </div>
          <RepRings rings={rep.rings} status={rep.status} size={56} />
        </div>

        {/* Section 1: Needs attention */}
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Needs attention
          </h2>
          <div className="mt-3 space-y-3">
            {rep.attention.map((a) => (
              <AccountCard key={a.name} account={a} />
            ))}
          </div>
        </section>

        {/* Section 2: On track */}
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            On track
          </h2>
          {rep.onTrack.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">
              No accounts currently on track
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {rep.onTrack.map((a) => (
                <AccountCard key={a.name} account={a} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
