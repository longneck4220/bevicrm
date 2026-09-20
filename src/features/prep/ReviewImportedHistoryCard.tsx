import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/features/shared/primitives";
import { updateAccountMemory, clearAccountMemoryDraft } from "@/lib/trial.functions";

const dismissKey = (accountId: string) => `bevi:memory-draft-dismissed:${accountId}`;

/**
 * Surfaces an AI-drafted memory built from imported call notes (see the CSV
 * import's generateMemoryDrafts step) so the rep can confirm or edit it
 * before it becomes the account's real memory. Only rendered by the caller
 * when accounts.memory is empty and memory_draft is populated.
 */
export function ReviewImportedHistoryCard({
  accountId,
  memoryDraft,
}: {
  accountId: string;
  memoryDraft: string;
}) {
  const qc = useQueryClient();
  const saveMemory = useServerFn(updateAccountMemory);
  const clearDraft = useServerFn(clearAccountMemoryDraft);

  const [draft, setDraft] = useState(memoryDraft);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(dismissKey(accountId)) === "1");
  }, [accountId]);

  const confirm = useMutation({
    mutationFn: async () => {
      const source = draft.trim() === memoryDraft.trim() ? "ai_adopted" : "manual_edit";
      await saveMemory({ data: { accountId, memory: draft, source } });
      await clearDraft({ data: { accountId } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["account-briefing", accountId] }),
  });

  function skip() {
    sessionStorage.setItem(dismissKey(accountId), "1");
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <GlassCard className="mb-6 p-6">
      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">
        Account memory draft
      </div>
      <p className="mt-1 text-sm text-white/50">
        Built from your imported call history. Review, edit if needed, then confirm.
      </p>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={6}
        disabled={confirm.isPending}
        className="mt-4 w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white leading-relaxed focus:border-[var(--brand-cyan)] focus:outline-none disabled:opacity-60"
      />
      {confirm.isError && (
        <p className="mt-2 text-sm text-[var(--signal-risk)]">
          Could not save that memory. Please try again.
        </p>
      )}
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => confirm.mutate()}
          disabled={confirm.isPending || !draft.trim()}
          className="rounded-lg px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          style={{ background: "var(--gradient-signal)" }}
        >
          {confirm.isPending ? "Saving…" : "Confirm memory"}
        </button>
        <button
          onClick={skip}
          disabled={confirm.isPending}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/85 hover:bg-white/5 disabled:opacity-50"
        >
          Skip for now
        </button>
      </div>
    </GlassCard>
  );
}
