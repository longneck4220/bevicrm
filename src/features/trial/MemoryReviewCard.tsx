import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { GlassCard, SignalLabel } from "@/features/shared/primitives";
import {
  updateAccountMemory,
  listAccountMemoryVersions,
  restoreAccountMemoryVersion,
  type MemoryVersion,
} from "@/lib/trial.functions";

const SOURCE_LABEL: Record<string, string> = {
  ai_adopted: "Replaced by AI memory",
  manual_edit: "Manual edit",
  restore: "Restored version",
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * ACCOUNT MEMORY card. Adopting the AI's proposed memory is a two-step,
 * reviewable action: the rep sees current vs proposed side by side, can edit the
 * proposed text (merge), and must explicitly save. Every save snapshots the
 * previous value server-side, so any prior version can be restored.
 */
export function MemoryReviewCard({
  accountId,
  currentMemory,
  proposedMemory,
  visitId,
  onSaved,
}: {
  accountId: string;
  currentMemory: string;
  proposedMemory: string;
  visitId: string | null;
  onSaved: (memory: string) => void;
}) {
  const save = useServerFn(updateAccountMemory);
  const listVersions = useServerFn(listAccountMemoryVersions);
  const restore = useServerFn(restoreAccountMemoryVersion);

  const [mode, setMode] = useState<"idle" | "review">("idle");
  const [draft, setDraft] = useState(proposedMemory);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOnce, setSavedOnce] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [versions, setVersions] = useState<MemoryVersion[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadVersions() {
    try {
      setVersions(await listVersions({ data: { accountId } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load memory history.");
    }
  }

  async function toggleHistory() {
    const next = !historyOpen;
    setHistoryOpen(next);
    if (next && versions === null) await loadVersions();
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      await save({
        data: {
          accountId,
          memory: draft,
          visitId: visitId ?? undefined,
          source: draft === proposedMemory ? "ai_adopted" : "manual_edit",
        },
      });
      onSaved(draft);
      setSavedOnce(true);
      setMode("idle");
      if (historyOpen || versions !== null) await loadVersions();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save memory.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore(versionId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await restore({ data: { versionId } });
      onSaved(res.memory);
      await loadVersions();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not restore memory.");
    } finally {
      setBusy(false);
    }
  }

  const latestVersion = versions?.[0] ?? null;

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <SignalLabel as="h2">Updated Account Memory</SignalLabel>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleHistory}
            className="min-h-[36px] text-xs px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 text-white"
          >
            {historyOpen ? "Hide history" : "History"}
          </button>
          {mode === "idle" && (
            <button
              type="button"
              onClick={() => {
                setDraft(proposedMemory);
                setError(null);
                setMode("review");
              }}
              className="min-h-[36px] text-xs px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 text-white"
            >
              Review &amp; adopt as memory
            </button>
          )}
        </div>
      </div>

      {savedOnce && mode === "idle" && (
        <div className="mb-3 flex items-center justify-between flex-wrap gap-2 rounded-md border border-[var(--brand-cyan)]/40 bg-[var(--brand-cyan)]/10 px-3 py-2">
          <span className="text-xs text-[var(--brand-cyan)]">Memory updated</span>
          {latestVersion && (
            <button
              type="button"
              disabled={busy}
              onClick={() => handleRestore(latestVersion.id)}
              className="text-xs px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/15 text-white disabled:opacity-40"
            >
              Revert to previous
            </button>
          )}
        </div>
      )}

      {mode === "idle" ? (
        <pre className="text-[13px] text-white/80 whitespace-pre-wrap font-sans leading-relaxed">
          {proposedMemory}
        </pre>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-white/60">
            Saving replaces the account memory below. Edit the proposed text to keep anything worth
            carrying forward — the previous version stays recoverable in History.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="min-w-0">
              <div className="text-xs text-white/50 mb-1">Current memory (will be replaced)</div>
              <pre className="text-[13px] text-white/70 whitespace-pre-wrap font-sans leading-relaxed rounded-md border border-white/10 bg-white/[0.03] p-3 max-h-64 overflow-y-auto">
                {currentMemory.trim() || "(empty)"}
              </pre>
            </div>
            <div className="min-w-0">
              <div className="text-xs text-white/50 mb-1">Proposed memory (editable)</div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={12}
                className="w-full text-[13px] text-white/90 rounded-md border border-white/15 bg-white/[0.04] p-3 leading-relaxed focus:outline-none focus:border-[var(--brand-cyan)]"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSave}
              disabled={busy}
              className="min-h-[44px] inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium text-primary-foreground disabled:opacity-40"
              style={{ background: "var(--gradient-signal)" }}
            >
              {busy ? "Saving…" : "Save memory"}
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              disabled={busy}
              className="min-h-[44px] px-4 py-2 rounded-xl text-sm text-white border border-white/15 hover:bg-white/10 disabled:opacity-40"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-[var(--signal-risk)]">{error}</p>}

      {historyOpen && (
        <div className="mt-4 border-t border-white/10 pt-3">
          <div className="text-xs text-white/50 mb-2">Memory history</div>
          {versions === null ? (
            <p className="text-xs text-white/50">Loading…</p>
          ) : versions.length === 0 ? (
            <p className="text-xs text-white/50">
              No previous versions yet. The first time memory is replaced, the old text is saved
              here.
            </p>
          ) : (
            <ul className="space-y-2">
              {versions.map((v) => (
                <li key={v.id} className="rounded-md border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs text-white/70">
                      {formatWhen(v.created_at)} · {SOURCE_LABEL[v.source] ?? v.source}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                        className="text-xs px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/15 text-white"
                      >
                        {expandedId === v.id ? "Hide" : "Preview"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleRestore(v.id)}
                        className="text-xs px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/15 text-white disabled:opacity-40"
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                  <pre className="mt-2 text-[12px] text-white/70 whitespace-pre-wrap font-sans leading-relaxed">
                    {expandedId === v.id
                      ? v.memory.trim() || "(empty)"
                      : (v.memory.trim() || "(empty)").slice(0, 140) +
                        (v.memory.trim().length > 140 ? "…" : "")}
                  </pre>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </GlassCard>
  );
}
