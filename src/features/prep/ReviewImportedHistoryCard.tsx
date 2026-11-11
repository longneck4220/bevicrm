import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/features/shared/primitives";
import { Button } from "@/components/ui/button";
import { MemoryComparison } from "./MemoryComparison";
import { updateAccountMemory, clearAccountMemoryDraft } from "@/lib/trial.functions";

const dismissKey = (accountId: string) => `bevi:memory-draft-dismissed:${accountId}`;

/**
 * Surfaces an AI-drafted memory built from imported call notes (see the CSV
 * import's generateMemoryDrafts step) so the rep can confirm or edit it
 * before it becomes the account's real memory, including ongoing updates.
 */
export function ReviewImportedHistoryCard({
  accountId,
  currentMemory,
  memoryDraft,
}: {
  accountId: string;
  currentMemory: string;
  memoryDraft: string;
}) {
  const qc = useQueryClient();
  const saveMemory = useServerFn(updateAccountMemory);
  const clearDraft = useServerFn(clearAccountMemoryDraft);

  const [draft, setDraft] = useState(memoryDraft);
  const [dismissed, setDismissed] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(dismissKey(accountId)) === memoryDraft);
  }, [accountId, memoryDraft]);

  const confirm = useMutation({
    mutationFn: async () => {
      const source = draft.trim() === memoryDraft.trim() ? "ai_adopted" : "manual_edit";
      await saveMemory({ data: { accountId, memory: draft, source } });
      await clearDraft({ data: { accountId } });
    },
    onSuccess: async () => {
      setSaved(true);
      await qc.invalidateQueries({ queryKey: ["account-briefing", accountId] });
      await qc.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  function skip() {
    sessionStorage.setItem(dismissKey(accountId), memoryDraft);
    setDismissed(true);
  }

  if (dismissed) return null;
  if (saved) return <p role="status" className="my-6 text-sm text-signal-positive">Account memory updated.</p>;

  return (
    <GlassCard className="mb-6 p-6">
      <h2 className="text-base font-medium text-foreground">Imported account memory update</h2>
      <div className="mt-4">
        <MemoryComparison current={currentMemory} proposed={draft} />
      </div>
      <label htmlFor={`memory-edit-${accountId}`} className="mt-5 block text-sm font-medium text-foreground">Edit proposed memory</label>
      <textarea
        id={`memory-edit-${accountId}`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={6}
        disabled={confirm.isPending}
        className="mt-2 w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground leading-relaxed focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60"
      />
      {confirm.isError && (
        <p role="alert" className="mt-2 text-sm text-signal-risk">
          Could not save that memory. Please try again.
        </p>
      )}
      <div className="mt-4 flex items-center gap-2">
        <Button
          onClick={() => confirm.mutate()}
          disabled={confirm.isPending || !draft.trim()}
          className="min-h-11 shadow-none"
        >
          {confirm.isPending ? "Saving…" : "Confirm memory"}
        </Button>
        <Button
          variant="outline"
          onClick={skip}
          disabled={confirm.isPending}
          className="min-h-11 shadow-none"
        >
          Skip for now
        </Button>
      </div>
    </GlassCard>
  );
}
