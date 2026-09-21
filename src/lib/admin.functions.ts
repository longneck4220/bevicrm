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

export type RepProfileOption = {
  userId: string;
  displayName: string | null;
  email: string | null;
  role: AppRole;
};

/**
 * Lightweight roster for the import preview: lets the UI check each rep name
 * in an uploaded file against a real BEVI account before anything is written.
 */
export const listRepProfiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("user_id, display_name, email")
      .order("display_name", { ascending: true });
    if (pErr) throw new Error("Failed to load users");

    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const rolesByUser = new Map<string, string[]>();
    for (const r of roles ?? []) {
      rolesByUser.set(r.user_id, [...(rolesByUser.get(r.user_id) ?? []), r.role as string]);
    }

    const users: RepProfileOption[] = (profiles ?? []).map((p) => ({
      userId: p.user_id,
      displayName: p.display_name,
      email: p.email,
      role: pickRole(rolesByUser.get(p.user_id) ?? []) ?? "rep",
    }));
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
  repName: z.string().max(200).optional().default(""),
  accountName: z.string().min(1).max(200),
  suburb: z.string().max(200).optional().default(""),
  callDate: z.string().optional().default(""),
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
  /** Notes already stored for that account and date — re-imports don't duplicate. */
  skipped: number;
  accountsCreated: string[];
  accountsMatched: number;
  failed: { row: number; reason: string }[];
  /** IDs of every account that received a call_notes row in this batch — feeds generateMemoryDrafts. */
  accountIds: string[];
  /** Per-rep outcome: matched to a BEVI account, or left under the importer. */
  repAssignments: { repName: string; matched: boolean; userId: string | null; notes: number }[];
  /** Existing outlets moved from the importer to their rep in this batch. */
  reassignedAccounts: number;
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
      .select("id, name, suburb, owner_id");
    if (existingErr) throw new Error("Failed to load existing accounts");

    const keyOf = (name: string, suburb: string) =>
      `${name.trim().toLowerCase()}|${suburb.trim().toLowerCase()}`;
    const byKey = new Map<string, { id: string; suburb: string | null; ownerId: string }>();
    for (const a of existingAccounts ?? []) {
      byKey.set(keyOf(a.name, a.suburb ?? ""), {
        id: a.id,
        suburb: a.suburb,
        ownerId: a.owner_id,
      });
    }

    // Every outlet must end up owned by the rep the file names, so the rep sees
    // it the moment they sign in. Reps who don't have a BEVI login yet get a
    // holding account created for them, keyed on their name.
    const repNames = [...new Set(data.rows.map((r) => r.repName.trim()).filter(Boolean))];
    const repOwners = await resolveRepOwners(supabaseAdmin, repNames);

    let imported = 0;
    let skipped = 0;
    let accountsMatched = 0;
    let reassignedAccounts = 0;
    const accountsCreated: string[] = [];
    const failed: { row: number; reason: string }[] = [];
    const touchedAccountIds = new Set<string>();
    const notesPerRep = new Map<string, number>();

    for (const row of data.rows) {
      try {
        // An unreadable or missing date must not cost us the note — the row is
        // still imported, just without a call date.
        const callDate = parseDdMmYyyy(row.callDate);
        const repName = row.repName.trim();
        const rep = repName ? repOwners.get(normaliseRepName(repName)) : undefined;
        const ownerId = rep?.userId ?? context.userId;

        const key = keyOf(row.accountName, row.suburb);
        let account = byKey.get(key);
        if (!account) {
          const { data: created, error: createErr } = await supabaseAdmin
            .from("accounts")
            .insert({
              name: row.accountName.trim(),
              suburb: row.suburb.trim() || null,
              owner_id: ownerId,
              memory: "",
            })
            .select("id, suburb, owner_id")
            .single();
          if (createErr || !created)
            throw new Error(createErr?.message ?? "Could not create account");
          account = { id: created.id, suburb: created.suburb, ownerId: created.owner_id };
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
          // Outlets imported before rep assignment existed sit under the
          // importer; hand them to their rep now.
          if (rep && account.ownerId !== ownerId && account.ownerId === context.userId) {
            await supabaseAdmin
              .from("accounts")
              .update({ owner_id: ownerId })
              .eq("id", account.id);
            account.ownerId = ownerId;
            reassignedAccounts++;
          }
        }

        // The ongoing top-up file re-sends history alongside new calls, so an
        // identical note for the same account and date is skipped instead of
        // stored twice.
        let dupeQuery = supabaseAdmin
          .from("call_notes")
          .select("id")
          .eq("account_id", account.id)
          .eq("raw_note", row.rawNote)
          .limit(1);
        dupeQuery = callDate ? dupeQuery.eq("call_date", callDate) : dupeQuery.is("call_date", null);
        const { data: dupes } = await dupeQuery;
        if (dupes && dupes.length > 0) {
          skipped++;
          continue;
        }

        const { error: noteErr } = await supabaseAdmin.from("call_notes").insert({
          owner_id: account.ownerId,
          account_id: account.id,
          rep_name: repName,
          call_date: callDate,
          raw_note: row.rawNote,
        });
        if (noteErr) throw new Error(noteErr.message);

        touchedAccountIds.add(account.id);
        imported++;
        if (repName) notesPerRep.set(repName, (notesPerRep.get(repName) ?? 0) + 1);
      } catch (e) {
        failed.push({
          row: row.rowNumber,
          reason: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    const repAssignments = [...notesPerRep.entries()].map(([repName, notes]) => {
      const rep = repOwners.get(normaliseRepName(repName));
      return {
        repName,
        matched: Boolean(rep),
        userId: rep?.userId ?? null,
        created: rep?.created ?? false,
        notes,
      };
    });

    return {
      imported,
      skipped,
      accountsCreated,
      accountsMatched,
      failed,
      accountIds: [...touchedAccountIds],
      repAssignments,
      reassignedAccounts,
    };
  });

function normaliseRepName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** "Mark Pinel" -> "mark.pinel@reps.bevipvi.com" — a holding login until the rep signs up for real. */
function placeholderEmailFor(name: string) {
  const slug =
    normaliseRepName(name)
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "") || "rep";
  return `${slug}@reps.bevipvi.com`;
}

type ResolvedRep = { userId: string; created: boolean };

/**
 * Maps each rep name in an import to a real BEVI user id. Matches on profile
 * display name first, then the local part of their email; anyone still
 * unmatched gets a confirmed holding login so their outlets are owned by them
 * from day one and appear as soon as they sign in.
 */
async function resolveRepOwners(
  supabaseAdmin: Awaited<
    typeof import("@/integrations/supabase/client.server")
  >["supabaseAdmin"],
  repNames: string[],
): Promise<Map<string, ResolvedRep>> {
  const resolved = new Map<string, ResolvedRep>();
  if (repNames.length === 0) return resolved;

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("user_id, display_name, email");

  const byName = new Map<string, string>();
  for (const p of profiles ?? []) {
    if (p.display_name) byName.set(normaliseRepName(p.display_name), p.user_id);
    if (p.email) {
      const local = p.email.split("@")[0] ?? "";
      byName.set(normaliseRepName(local.replace(/[._-]+/g, " ")), p.user_id);
      byName.set(normaliseRepName(p.email), p.user_id);
    }
  }

  for (const name of repNames) {
    const norm = normaliseRepName(name);
    const existing = byName.get(norm);
    if (existing) {
      resolved.set(norm, { userId: existing, created: false });
      continue;
    }
    const email = placeholderEmailFor(name);
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      password: crypto.randomUUID() + crypto.randomUUID(),
      user_metadata: { full_name: name.trim(), display_name: name.trim(), placeholder_rep: true },
    });
    if (error || !created?.user) {
      // Already exists (or can't be created) — fall back to a lookup by email.
      const { data: again } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("email", email)
        .maybeSingle();
      if (again?.user_id) resolved.set(norm, { userId: again.user_id, created: false });
      continue;
    }
    byName.set(norm, created.user.id);
    resolved.set(norm, { userId: created.user.id, created: true });
  }

  return resolved;
}

const GenerateMemoryDraftsInput = z.object({
  accountIds: z.array(z.string().uuid()).min(1).max(200),
});

export type GenerateMemoryDraftsResult = {
  draftsGenerated: number;
};

const MEMORY_DRAFT_SYSTEM = `You are building an account memory for a field sales rep in the liquor industry. Below are historical call notes for this account, ordered oldest to newest. Summarise what is known into a concise account memory: who the key contact is and their role, what has been ordered or distributed, what objections or blockers have appeared, and what the current status and next best move is. Be specific and factual. Do not invent anything not present in the notes. Return JSON: {"memory": "<plain text, 150 words maximum>"}.`;

/**
 * Runs after a CSV import completes (see CsvImportSection): drafts an initial
 * accounts.memory_draft from imported call_notes for accounts that don't
 * already have real memory. Never writes accounts.memory itself — the rep
 * reviews and confirms the draft on the pre-visit page.
 */
export const generateMemoryDrafts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => GenerateMemoryDraftsInput.parse(data))
  .handler(async ({ data, context }): Promise<GenerateMemoryDraftsResult> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { generateVisitJson } = await import("@/lib/ai-provider.server");

    let draftsGenerated = 0;

    for (const accountId of data.accountIds) {
      try {
        const { data: account, error: accErr } = await supabaseAdmin
          .from("accounts")
          .select("id, memory")
          .eq("id", accountId)
          .maybeSingle();
        if (accErr || !account || (account.memory ?? "").trim().length > 0) continue;

        const { data: notes, error: notesErr } = await supabaseAdmin
          .from("call_notes")
          .select("raw_note, call_date, rep_name")
          .eq("account_id", accountId)
          .order("call_date", { ascending: true });
        if (notesErr || !notes || notes.length === 0) continue;

        const notesBlock = notes
          .map((n) => `[${n.call_date}] (rep: ${n.rep_name}) ${n.raw_note}`)
          .join("\n");

        const parsed = await generateVisitJson<{ memory: string }>({
          system: MEMORY_DRAFT_SYSTEM,
          user: `Historical call notes for this account:\n"""\n${notesBlock}\n"""`,
        });
        const draft = (parsed.memory ?? "").trim();
        if (!draft) continue;

        const { error: updateErr } = await supabaseAdmin
          .from("accounts")
          .update({ memory_draft: draft })
          .eq("id", accountId);
        if (updateErr) throw new Error(updateErr.message);

        draftsGenerated++;
      } catch (e) {
        console.error("[memory draft] failed for account", accountId, e);
      }
    }

    return { draftsGenerated };
  });
