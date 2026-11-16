import { useEffect, useState, type FormEvent } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { typedTextMatches } from "@/lib/typed-confirm";

export type DeleteImpact = {
  loading: boolean;
  /** Plain-English lines such as "3 visits". Empty means nothing else is deleted. */
  lines: string[];
  error: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** What the person must type exactly, for example a venue name or an email. */
  expectedText: string;
  expectedLabel: string;
  impact: DeleteImpact;
  pending: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
};

/**
 * Second-confirmation dialog for destructive deletes. The Delete button stays
 * disabled until the exact name is typed and the impact counts have loaded.
 */
export function TypedConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  expectedText,
  expectedLabel,
  impact,
  pending,
  errorMessage,
  onConfirm,
}: Props) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  const canDelete =
    typedTextMatches(typed, expectedText) &&
    !impact.loading &&
    !impact.error &&
    !pending;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (canDelete) onConfirm();
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => !pending && onOpenChange(next)}
    >
      <AlertDialogContent className="w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto border-white/10 bg-[#0F172A] text-white">
        <form onSubmit={submit} className="grid gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription className="text-white/65">
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-100">
            {impact.loading && "Checking what will be deleted…"}
            {impact.error && impact.error}
            {!impact.loading && !impact.error && (
              <>
                <div className="font-medium">This will permanently delete:</div>
                {impact.lines.length === 0 ? (
                  <div className="mt-1">Nothing else is attached.</div>
                ) : (
                  <ul className="mt-1 list-disc pl-5">
                    {impact.lines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          <label className="grid gap-1.5 text-sm text-white/80">
            <span>
              Type{" "}
              <strong className="break-all text-white">{expectedText}</strong>{" "}
              to confirm
            </span>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              aria-label={`Type the ${expectedLabel} to confirm`}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="off"
              className="min-h-[44px] rounded-lg border border-white/15 bg-white/5 px-3 text-[15px] text-white placeholder:text-white/35 focus:border-red-400 focus:outline-none"
            />
          </label>

          {errorMessage && (
            <p role="alert" className="text-sm text-red-300">
              {errorMessage}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={pending}
              className="min-h-[44px] rounded-lg border border-white/15 px-4 text-sm font-medium text-white/85 hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canDelete}
              className="min-h-[44px] rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? "Deleting…" : "Delete permanently"}
            </button>
          </div>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
