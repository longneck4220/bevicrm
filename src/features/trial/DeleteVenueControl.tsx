import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2 } from "lucide-react";
import { TypedConfirmDeleteDialog } from "@/components/TypedConfirmDeleteDialog";
import { impactLines } from "@/lib/delete-impact";
import { deleteMyVenue, getMyVenueDeleteImpact } from "@/lib/delete.functions";

/**
 * Deliberately small and out of the way: deleting a venue is rare, and every
 * path to it goes through the typed-name dialog.
 */
export function DeleteVenueControl({
  venue,
  onDeleted,
}: {
  venue: { id: string; name: string };
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const impactFn = useServerFn(getMyVenueDeleteImpact);
  const deleteFn = useServerFn(deleteMyVenue);

  const impact = useQuery({
    queryKey: ["my-venue-delete-impact", venue.id],
    queryFn: () => impactFn({ data: { accountId: venue.id } }),
    enabled: open,
    gcTime: 0,
  });

  const remove = useMutation({
    mutationFn: () =>
      deleteFn({ data: { accountId: venue.id, confirmName: venue.name } }),
    onSuccess: () => {
      setOpen(false);
      onDeleted();
    },
  });

  return (
    <>
      <button
        type="button"
        onClick={() => {
          remove.reset();
          setOpen(true);
        }}
        className="mt-2 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-xs text-red-300/80 hover:bg-red-500/10 hover:text-red-300"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete this venue
      </button>
      <TypedConfirmDeleteDialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete venue "${venue.name}"?`}
        expectedText={venue.name}
        expectedLabel="venue name"
        impact={{
          loading: impact.isLoading,
          error: impact.isError
            ? "Could not check what will be deleted."
            : null,
          lines: impact.data ? impactLines(impact.data) : [],
        }}
        pending={remove.isPending}
        errorMessage={remove.error?.message ?? null}
        onConfirm={() => remove.mutate()}
      />
    </>
  );
}
