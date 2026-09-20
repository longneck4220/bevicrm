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
