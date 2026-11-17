import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Customer accounts (venues) with contact details, for the Customers page.
 *
 * Every query runs on the caller's own RLS client, so a rep only ever sees and
 * changes their own venues; admins are covered by the existing admin policies.
 * Account memory (`memory`, `memory_draft`) is never selected or written here:
 * it only changes when the rep clicks "Adopt as new memory".
 */

// The phone, email, address and notes columns come from the migration
// 20261117000000_account_contact_details.sql, and the generated types file has
// not been regenerated for them yet. Until it is, the client is used untyped
// here, so the new columns compile. Remove this cast once types.ts catches up.
function untyped(client: unknown): SupabaseClient {
  return client as SupabaseClient;
}

const CUSTOMER_COLUMNS =
  "id, name, contact, suburb, phone, email, address, notes, owner_id, updated_at";

export type CustomerRow = {
  id: string;
  name: string;
  contact: string | null;
  suburb: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  owner_id: string;
  /** Only filled in for admins, who see every rep's venues. */
  owner_name: string | null;
  updated_at: string;
};

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .default("")
    .transform((value) => value || null);

const optionalEmail = z
  .string()
  .trim()
  .max(254)
  .optional()
  .default("")
  .refine(
    (value) => value === "" || z.string().email().safeParse(value).success,
    {
      message: "That email address does not look right.",
    },
  )
  .transform((value) => value || null);

const customerFields = {
  name: z.string().trim().min(1, "A name is required.").max(200),
  contact: optionalText(200),
  suburb: optionalText(120),
  // Phone numbers are typed many ways (+61, brackets, spaces), so only a length cap.
  phone: optionalText(40),
  email: optionalEmail,
  address: optionalText(300),
  notes: optionalText(2000),
};

export const createCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object(customerFields).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await untyped(context.supabase)
      .from("accounts")
      .insert({
        name: data.name,
        contact: data.contact,
        suburb: data.suburb,
        phone: data.phone,
        email: data.email,
        address: data.address,
        notes: data.notes,
        memory: "",
        owner_id: context.userId,
      })
      .select("id")
      .single();
    if (error || !row) {
      console.error("[createCustomer] insert failed", error);
      throw new Error("Could not add that customer. Please try again.");
    }
    return { id: row.id as string };
  });

export const updateCustomerDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), ...customerFields }).parse(d),
  )
  .handler(async ({ data, context }) => {
    // Explicit allowlist: only these seven columns can ever be changed here.
    const changes = {
      name: data.name,
      contact: data.contact,
      suburb: data.suburb,
      phone: data.phone,
      email: data.email,
      address: data.address,
      notes: data.notes,
    };
    // RLS lets only the owner or an admin update a row. A row the caller may
    // not touch matches nothing, so no returned row means "not allowed or gone".
    const { data: updated, error } = await untyped(context.supabase)
      .from("accounts")
      .update(changes)
      .eq("id", data.id)
      .select("id");
    if (error) {
      console.error("[updateCustomerDetails] update failed", error);
      throw new Error("Could not save those changes. Please try again.");
    }
    if (!updated || updated.length === 0) {
      throw new Error(
        "That customer could not be found, or it is not yours to edit.",
      );
    }
    return { ok: true };
  });

export const listCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CustomerRow[]> => {
    const { data, error } = await untyped(context.supabase)
      .from("accounts")
      .select(CUSTOMER_COLUMNS)
      .order("name", { ascending: true })
      .limit(5000);
    if (error) {
      console.error("[listCustomers] select failed", error);
      throw new Error("Could not load your customers. Please try again.");
    }
    const rows = (data ?? []) as Omit<CustomerRow, "owner_name">[];

    // RLS already limits a rep to their own rows. Only an admin sees other
    // people's venues, and only then are owner names looked up.
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) return rows.map((r) => ({ ...r, owner_name: null }));

    const { supabaseAdmin } =
      await import("@/integrations/supabase/client.server");
    const ownerIds = [...new Set(rows.map((r) => r.owner_id))];
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, display_name, email")
      .in("user_id", ownerIds);
    if (profileError) {
      console.error("[listCustomers] owner lookup failed", profileError);
      throw new Error("Could not load your customers. Please try again.");
    }
    const nameByUser = new Map(
      (profiles ?? []).map((p) => [
        p.user_id,
        p.display_name || p.email || "Unknown rep",
      ]),
    );
    return rows.map((r) => ({
      ...r,
      owner_name: nameByUser.get(r.owner_id) ?? "Unknown rep",
    }));
  });
