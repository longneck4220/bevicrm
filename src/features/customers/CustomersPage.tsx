import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Mail, MapPin, Pencil, Phone, Plus, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { GlassCard } from "@/features/shared/primitives";
import { useAuth } from "@/hooks/use-auth";
import {
  createCustomer,
  listCustomers,
  updateCustomerDetails,
  type CustomerRow,
} from "@/lib/accounts.functions";
import { DeleteCustomerButton } from "./DeleteCustomerButton";

const SEARCH_DEBOUNCE_MS = 200;

const inputClass =
  "w-full min-h-[44px] rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-[15px] text-white placeholder:text-white/35 outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--brand-cyan,#18B4A6)]";
const labelClass = "mb-1.5 block text-[13px] font-medium text-white/70";
const iconButtonClass =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white";

type FormValues = {
  name: string;
  contact: string;
  suburb: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

const EMPTY_FORM: FormValues = {
  name: "",
  contact: "",
  suburb: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

function formFromCustomer(c: CustomerRow): FormValues {
  return {
    name: c.name,
    contact: c.contact ?? "",
    suburb: c.suburb ?? "",
    phone: c.phone ?? "",
    email: c.email ?? "",
    address: c.address ?? "",
    notes: c.notes ?? "",
  };
}

function matchesSearch(c: CustomerRow, needle: string): boolean {
  if (!needle) return true;
  const haystack = [c.name, c.contact, c.suburb, c.phone, c.email, c.address]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

/** One sheet for both adding (customer = null) and editing a customer. */
function CustomerSheet({
  open,
  customer,
  onClose,
  onSaved,
}: {
  open: boolean;
  customer: CustomerRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const createFn = useServerFn(createCustomer);
  const updateFn = useServerFn(updateCustomerDetails);

  useEffect(() => {
    if (open) setForm(customer ? formFromCustomer(customer) : EMPTY_FORM);
  }, [open, customer]);

  const save = useMutation({
    mutationFn: async () => {
      if (customer) await updateFn({ data: { id: customer.id, ...form } });
      else await createFn({ data: form });
    },
    onSuccess: () => {
      onSaved();
      onClose();
    },
  });

  // Reset a leftover error each time the sheet is opened.
  useEffect(() => {
    if (open) save.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, customer]);

  function setField(key: keyof FormValues, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || save.isPending) return;
    save.mutate();
  }

  const title = customer ? "Edit customer" : "Add customer";

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => !next && !save.isPending && onClose()}
    >
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[92vh] max-w-xl overflow-y-auto rounded-t-2xl border-white/10 bg-[#0F172A] text-white"
      >
        <SheetTitle className="text-white">{title}</SheetTitle>
        <SheetDescription className="text-white/60">
          {customer
            ? "Update this customer's details."
            : "Only a name is required."}
        </SheetDescription>
        <form onSubmit={submit} className="mt-4 grid gap-3.5 pb-4">
          <Field label="Name">
            <input
              required
              maxLength={200}
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Contact person">
            <input
              maxLength={200}
              value={form.contact}
              onChange={(e) => setField("contact", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Suburb">
            <input
              maxLength={120}
              value={form.suburb}
              onChange={(e) => setField("suburb", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Phone">
            <input
              type="tel"
              inputMode="tel"
              maxLength={40}
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              inputMode="email"
              maxLength={254}
              autoCapitalize="none"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Address">
            <input
              maxLength={300}
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Notes">
            <textarea
              rows={4}
              maxLength={2000}
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              className={inputClass}
            />
          </Field>

          {save.isError && (
            <p role="alert" className="text-sm text-[#F87171]">
              {save.error.message.startsWith("[")
                ? "Please check the details and try again."
                : save.error.message}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={save.isPending}
              className="min-h-[44px] rounded-lg border border-white/15 px-5 text-sm font-medium text-white/85 hover:bg-white/5 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={save.isPending || !form.name.trim()}
              className="min-h-[44px] rounded-lg px-5 text-sm font-semibold text-[#0A1020] disabled:opacity-60"
              style={{ background: "var(--gradient-signal)" }}
            >
              {save.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function CustomerRowItem({
  customer,
  isAdmin,
  currentUserId,
  onOpen,
  onDeleted,
}: {
  customer: CustomerRow;
  isAdmin: boolean;
  currentUserId: string | undefined;
  onOpen: () => void;
  onDeleted: () => void;
}) {
  const subtitle = [customer.suburb, customer.contact]
    .filter(Boolean)
    .join(" · ");
  const phoneHref = customer.phone
    ? `tel:${customer.phone.replace(/[^\d+]/g, "")}`
    : null;
  const mapHref = customer.address
    ? `https://maps.google.com/?q=${encodeURIComponent(customer.address)}`
    : null;
  const adminDeletingOthers = isAdmin && customer.owner_id !== currentUserId;

  return (
    <GlassCard className="flex items-center gap-1 p-1.5 pl-3">
      <button
        type="button"
        onClick={onOpen}
        title="Edit customer"
        aria-label={`Edit ${customer.name}`}
        className="flex min-h-[56px] min-w-0 flex-1 flex-col justify-center text-left"
      >
        <span className="truncate text-[15px] font-semibold text-white">
          {customer.name}
        </span>
        {subtitle && (
          <span className="truncate text-[13px] text-white/60">{subtitle}</span>
        )}
        {isAdmin && customer.owner_name && (
          <span className="truncate text-[12px] text-[#2DD4C4]">
            Rep: {customer.owner_name}
          </span>
        )}
      </button>
      {phoneHref && (
        <a
          href={phoneHref}
          title="Call"
          aria-label={`Call ${customer.name}`}
          className={iconButtonClass}
        >
          <Phone className="h-[18px] w-[18px]" />
        </a>
      )}
      {customer.email && (
        <a
          href={`mailto:${customer.email}`}
          title="Email"
          aria-label={`Email ${customer.name}`}
          className={iconButtonClass}
        >
          <Mail className="h-[18px] w-[18px]" />
        </a>
      )}
      {mapHref && (
        <a
          href={mapHref}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in maps"
          aria-label={`Open ${customer.name} in maps`}
          className={iconButtonClass}
        >
          <MapPin className="h-[18px] w-[18px]" />
        </a>
      )}
      <button
        type="button"
        onClick={onOpen}
        title="Edit"
        aria-label={`Edit ${customer.name}`}
        className={iconButtonClass}
      >
        <Pencil className="h-[18px] w-[18px]" />
      </button>
      <DeleteCustomerButton
        venue={{ id: customer.id, name: customer.name }}
        useAdminDelete={adminDeletingOthers}
        onDeleted={onDeleted}
      />
    </GlassCard>
  );
}

export function CustomersPage() {
  const { user, role } = useAuth();
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();
  const listFn = useServerFn(listCustomers);
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerRow | null>(null);

  const customers = useQuery({
    queryKey: ["customers"],
    queryFn: () => listFn(),
  });

  useEffect(() => {
    const timer = setTimeout(
      () => setSearch(searchText.trim().toLowerCase()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [searchText]);

  const visible = useMemo(
    () => (customers.data ?? []).filter((c) => matchesSearch(c, search)),
    [customers.data, search],
  );

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["customers"] });
  }

  function openSheet(customer: CustomerRow | null) {
    setEditing(customer);
    setSheetOpen(true);
  }

  return (
    <main className="mx-auto max-w-3xl px-5 pb-20 pt-24 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[32px] leading-tight text-white sm:text-[40px]">
          Customer accounts
        </h1>
        <button
          type="button"
          onClick={() => openSheet(null)}
          title="Add customer"
          aria-label="Add customer"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#0A1020]"
          style={{ background: "var(--gradient-signal)" }}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div className="sticky top-14 z-30 -mx-5 mt-4 bg-[#0A1020]/90 px-5 py-2 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/45"
          />
          <input
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search name, contact, suburb, phone, email, address"
            aria-label="Search customers"
            className={`${inputClass} pl-10`}
          />
        </div>
      </div>

      <div className="mt-3 grid gap-2.5" aria-live="polite">
        {customers.isLoading && (
          <p className="py-8 text-center text-sm text-white/50">Loading…</p>
        )}
        {customers.isError && (
          <div className="py-8 text-center text-sm text-[#F87171]" role="alert">
            {customers.error.message}{" "}
            <button
              type="button"
              onClick={() => customers.refetch()}
              className="underline"
            >
              Try again
            </button>
          </div>
        )}
        {customers.data && customers.data.length === 0 && (
          <p className="py-8 text-center text-sm text-white/60">
            No customers yet. Tap the plus button to add your first one.
          </p>
        )}
        {customers.data &&
          customers.data.length > 0 &&
          visible.length === 0 && (
            <p className="py-8 text-center text-sm text-white/60">
              No customers match that search.
            </p>
          )}
        {visible.map((c) => (
          <CustomerRowItem
            key={c.id}
            customer={c}
            isAdmin={isAdmin}
            currentUserId={user?.id}
            onOpen={() => openSheet(c)}
            onDeleted={refresh}
          />
        ))}
      </div>

      <CustomerSheet
        open={sheetOpen}
        customer={editing}
        onClose={() => setSheetOpen(false)}
        onSaved={refresh}
      />
    </main>
  );
}
