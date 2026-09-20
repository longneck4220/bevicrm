import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { pickRole, type AppRole } from "@/lib/roles";

async function assertAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

export type AdminAccount = {
  id: string;
  name: string;
  contact: string | null;
  created_at: string;
  updated_at: string;
  visit_count: number;
  has_memory: boolean;
};

export type AdminUser = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  is_admin: boolean;
  role: AppRole;
  account_count: number;
  accounts: AdminAccount[];
};

export const listUsersForAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email, display_name, created_at")
      .order("created_at", { ascending: true });
    if (pErr) throw new Error("Failed to load users");

    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const rolesByUser = new Map<string, string[]>();
    for (const r of roles ?? []) {
      rolesByUser.set(r.user_id, [...(rolesByUser.get(r.user_id) ?? []), r.role as string]);
    }

    const { data: accounts, error: aErr } = await supabaseAdmin
      .from("accounts")
      .select("id, name, contact, owner_id, memory, created_at, updated_at")
      .order("created_at", { ascending: true });
    if (aErr) throw new Error("Failed to load accounts");

    const { data: visits } = await supabaseAdmin.from("visits").select("account_id");
    const visitCounts = new Map<string, number>();
    for (const v of visits ?? []) {
      visitCounts.set(v.account_id, (visitCounts.get(v.account_id) ?? 0) + 1);
    }

    const accountsByOwner = new Map<string, AdminAccount[]>();
    for (const a of accounts ?? []) {
      const list = accountsByOwner.get(a.owner_id) ?? [];
      list.push({
        id: a.id,
        name: a.name,
        contact: a.contact,
        created_at: a.created_at,
        updated_at: a.updated_at,
        visit_count: visitCounts.get(a.id) ?? 0,
        has_memory: !!(a.memory && a.memory.trim().length > 0),
      });
      accountsByOwner.set(a.owner_id, list);
    }

    const users: AdminUser[] = (profiles ?? []).map((p) => {
      const accs = accountsByOwner.get(p.user_id) ?? [];
      const role = pickRole(rolesByUser.get(p.user_id) ?? []) ?? "rep";
      return {
        user_id: p.user_id,
        email: p.email,
        display_name: p.display_name,
        created_at: p.created_at,
        is_admin: role === "admin",
        role,
        account_count: accs.length,
        accounts: accs,
      };
    });

    return { users };
  });

export const adminSetUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(["admin", "manager", "rep"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    // The database function re-checks admin rights and refuses to strip your
    // own admin role, so nobody can lock themselves out.
    const { error } = await context.supabase.rpc("set_user_role", {
      _user_id: data.userId,
      _role: data.role,
    });
    if (error) {
      throw new Error(
        error.message.includes("Cannot remove your own admin role")
          ? "You cannot remove your own admin role."
          : "Could not update that role.",
      );
    }
    return { ok: true, role: data.role as AppRole };
  });

export const adminInviteManager = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z.object({ email: z.string().email(), redirectTo: z.string().optional() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.trim().toLowerCase();
    const redirectTo =
      data.redirectTo && data.redirectTo.startsWith("https://") ? data.redirectTo : undefined;
    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo });
    if (error) {
      throw new Error(
        error.message.toLowerCase().includes("already")
          ? "That email already has an account — set their role in the table above."
          : "Could not send the invite. Check the address and try again.",
      );
    }
    return { ok: true, email };
  });

export const adminDeleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ accountId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("accounts").delete().eq("id", data.accountId);
    if (error) throw new Error("Failed to delete account");
    return { ok: true };
  });

const CallNoteImportRow = z.object({
  rowNumber: z.number().int().positive(),
  repName: z.string().min(1).max(200),
  accountName: z.string().min(1).max(200),
  suburb: z.string().max(200).optional().default(""),
  callDate: z.string().min(1),
  rawNote: z.string().min(1).max(12000),
});

const ImportCallNotesInput = z.object({
  rows: z.array(CallNoteImportRow).min(1).max(500),
});

/** Parses a "DD/MM/YYYY" string into an ISO date, rejecting anything that isn't a real calendar date. */
function parseDdMmYyyy(input: string): string | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(input.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const iso = `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
  const check = new Date(`${iso}T00:00:00Z`);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() + 1 !== month ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return iso;
}

export type ImportCallNotesResult = {
  imported: number;
  accountsCreated: string[];
  accountsMatched: number;
  failed: { row: number; reason: string }[];
};

/**
 * Bulk-imports historical call notes for the admin's CSV import flow. Called
 * in batches from the client (see CsvImportSection) so the UI can show real
 * per-batch progress instead of one opaque request. Never touches
 * accounts.memory or public.visits — imported notes are raw and unprocessed.
 */
export const importCallNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => ImportCallNotesInput.parse(data))
  .handler(async ({ data, context }): Promise<ImportCallNotesResult> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existingAccounts, error: existingErr } = await supabaseAdmin
      .from("accounts")
      .select("id, name, suburb");
    if (existingErr) throw new Error("Failed to load existing accounts");

    const keyOf = (name: string, suburb: string) =>
      `${name.trim().toLowerCase()}|${suburb.trim().toLowerCase()}`;
    const byKey = new Map<string, { id: string; suburb: string | null }>();
    for (const a of existingAccounts ?? []) {
      byKey.set(keyOf(a.name, a.suburb ?? ""), { id: a.id, suburb: a.suburb });
    }

    let imported = 0;
    let accountsMatched = 0;
    const accountsCreated: string[] = [];
    const failed: { row: number; reason: string }[] = [];

    for (const row of data.rows) {
      try {
        const callDate = parseDdMmYyyy(row.callDate);
        if (!callDate) {
          throw new Error(`Invalid date "${row.callDate}" — expected DD/MM/YYYY`);
        }

        const key = keyOf(row.accountName, row.suburb);
        let account = byKey.get(key);
        if (!account) {
          const { data: created, error: createErr } = await supabaseAdmin
            .from("accounts")
            .insert({
              name: row.accountName.trim(),
              suburb: row.suburb.trim() || null,
              owner_id: context.userId,
              memory: "",
            })
            .select("id, suburb")
            .single();
          if (createErr || !created)
            throw new Error(createErr?.message ?? "Could not create account");
          account = { id: created.id, suburb: created.suburb };
          byKey.set(key, account);
          accountsCreated.push(row.accountName.trim());
        } else {
          accountsMatched++;
          if (!account.suburb && row.suburb.trim()) {
            await supabaseAdmin
              .from("accounts")
              .update({ suburb: row.suburb.trim() })
              .eq("id", account.id);
            account.suburb = row.suburb.trim();
          }
        }

        const { error: noteErr } = await supabaseAdmin.from("call_notes").insert({
          owner_id: context.userId,
          account_id: account.id,
          rep_name: row.repName.trim(),
          call_date: callDate,
          raw_note: row.rawNote,
        });
        if (noteErr) throw new Error(noteErr.message);

        imported++;
      } catch (e) {
        failed.push({
          row: row.rowNumber,
          reason: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    return { imported, accountsCreated, accountsMatched, failed };
  });
