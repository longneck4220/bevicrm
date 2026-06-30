import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
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

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    const adminIds = new Set((roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));

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
      return {
        user_id: p.user_id,
        email: p.email,
        display_name: p.display_name,
        created_at: p.created_at,
        is_admin: adminIds.has(p.user_id),
        account_count: accs.length,
        accounts: accs,
      };
    });

    return { users };
  });

export const adminDeleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ accountId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("accounts").delete().eq("id", data.accountId);
    if (error) throw new Error("Failed to delete account");
    return { ok: true };
  });
