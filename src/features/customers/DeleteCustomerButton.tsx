import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2 } from "lucide-react";
import { TypedConfirmDeleteDialog } from "@/components/TypedConfirmDeleteDialog";
import { impactLines } from "@/lib/delete-impact";
import {
  adminDeleteAccount,
  adminGetAccountDeleteImpact,
} from "@/lib/admin.functions";
import { deleteMyVenue, getMyVenueDeleteImpact } from "@/lib/delete.functions";

/**
 * Icon-only delete for a customer row. It reuses the existing typed-name
 * dialog and the existing delete server functions; it only chooses which pair
 * to call. An admin deleting someone else's venue must go through the admin
 * functions, because deleteMyVenue refuses venues the caller does not own.
 */
export function DeleteCustomerButton({
  venue,
  useAdminDelete,
  onDeleted,
}: {
  venue: { id: string; name: string };
  /** True only when an admin is deleting a venue owned by another rep. */
  useAdminDelete: boolean;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const myImpactFn = useServerFn(getMyVenueDeleteImpact);
  const myDeleteFn = useServerFn(deleteMyVenue);
  const adminImpactFn = useServerFn(adminGetAccountDeleteImpact);
  const adminDeleteFn = useServerFn(adminDeleteAccount);

  const impact = useQuery({
    queryKey: ["customer-delete-impact", venue.id, useAdminDelete],
    queryFn: () =>
      useAdminDelete
        ? adminImpactFn({ data: { accountId: venue.id } })
        : myImpactFn({ data: { accountId: venue.id } }),
    enabled: open,
    gcTime: 0,
  });

  const remove = useMutation({
    mutationFn: (typedName: string) =>
      useAdminDelete
        ? adminDeleteFn({
            data: { accountId: venue.id, confirmName: typedName },
          })
        : myDeleteFn({ data: { accountId: venue.id, confirmName: typedName } }),
    onSuccess: () => {
      setOpen(false);
      onDeleted();
    },
  });

  return (
    <>
      <button
        type="button"
        title="Delete customer"
        aria-label={`Delete ${venue.name}`}
        onClick={() => {
          remove.reset();
          setOpen(true);
        }}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-red-300/80 hover:bg-red-500/10 hover:text-red-300"
      >
        <Trash2 className="h-[18px] w-[18px]" />
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
        onConfirm={(typed) => remove.mutate(typed)}
      />
    </>
  );
}
