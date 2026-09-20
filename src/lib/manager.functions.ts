import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AiOutput } from "./trial.functions";
import { pickRole } from "./roles";
import type { Status } from "@/features/manager/data";

const DEFAULT_WEEKLY_TARGET = 40;
const postureRank: Record<string, number> = { Push: 4, Recommend: 3, Suggest: 2, Hold: 1 };

function accountRisk(latest: AiOutput | null): "low" | "medium" | "high" {
  const flags = latest?.commercial_signals?.risk_flags?.length ?? 0;
  if (flags >= 2) return "high";
  if (flags === 1) return "medium";
  return "low";
}

function accountMomentum(
  sortedVisits: { ai_output: AiOutput | null }[],
): "accelerating" | "steady" | "stalling" {
  if (sortedVisits.length < 2) return "steady";
  const latest =
    postureRank[
      sortedVisits[sortedVisits.length - 1].ai_output?.next_best_move?.commercial_posture ?? ""
    ] ?? 0;
  const prev =
    postureRank[
      sortedVisits[sortedVisits.length - 2].ai_output?.next_best_move?.commercial_posture ?? ""
    ] ?? 0;
  if (latest > prev) return "accelerating";
  if (latest < prev) return "stalling";
  return "steady";
}

export type ManagerAccountItem = {
  name: string;
  status: Status;
  summary: string;
  action: string;
};

export type ManagerRep = {
  id: string;
  name: string;
  email: string | null;
  status: Status;
  accountCount: number;
  callsThisWeek: number;
  target: number;
  /** 0..1 — share of this rep's visits that didn't need more info from the rep. */
  notesQuality: number;
  /** 0..1 — share of multi-visit accounts that are accelerating or holding steady, not stalling. */
  progression: number;
  attention: ManagerAccountItem[];
  onTrack: ManagerAccountItem[];
};

/**
 * Real-data equivalent of the manager section's original mock (see
 * features/manager/data.ts). Any manager or admin can see every rep — there's
 * no per-manager team assignment in the schema yet, and with only a handful
 * of reps today a flat list covers it. Numbers shown are only ones with a
 * real source: calls this week, notes quality (was the AI ever left without
 * enough info), and account momentum (risk flags + posture trend) — nothing
 * here is fabricated to fill a metric the app doesn't actually track.
 */
export const listTeamOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ reps: ManagerRep[] }> => {
    const [{ data: isManager }, { data: isAdmin }] = await Promise.all([
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "manager" }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    ]);
    if (!isManager && !isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: profiles }, { data: roles }, { data: accounts }, { data: visits }] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("user_id, display_name, email"),
        supabaseAdmin.from("user_roles").select("user_id, role"),
        supabaseAdmin.from("accounts").select("id, name, owner_id"),
        supabaseAdmin
          .from("visits")
          .select("id, account_id, owner_id, created_at, ai_output")
          .order("created_at", { ascending: true }),
      ]);

    const rolesByUser = new Map<string, string[]>();
    for (const r of roles ?? []) {
      rolesByUser.set(r.user_id, [...(rolesByUser.get(r.user_id) ?? []), r.role as string]);
    }
    const repProfiles = (profiles ?? []).filter(
      (p) => (pickRole(rolesByUser.get(p.user_id) ?? []) ?? "rep") === "rep",
    );

    const accountsByOwner = new Map<string, { id: string; name: string }[]>();
    for (const a of accounts ?? []) {
      const list = accountsByOwner.get(a.owner_id) ?? [];
      list.push({ id: a.id, name: a.name });
      accountsByOwner.set(a.owner_id, list);
    }

    const visitsByAccount = new Map<string, { created_at: string; ai_output: AiOutput | null }[]>();
    for (const v of visits ?? []) {
      const list = visitsByAccount.get(v.account_id) ?? [];
      list.push({ created_at: v.created_at, ai_output: (v.ai_output as AiOutput | null) ?? null });
      visitsByAccount.set(v.account_id, list);
    }

    const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

    const reps: ManagerRep[] = repProfiles.map((p) => {
      const repAccounts = accountsByOwner.get(p.user_id) ?? [];
      let callsThisWeek = 0;
      let totalVisits = 0;
      let needsMoreInfoCount = 0;
      let accelOrSteady = 0;
      let scoredAccounts = 0;
      const attention: ManagerAccountItem[] = [];
      const onTrack: ManagerAccountItem[] = [];
      let worstRisk: "low" | "medium" | "high" = "low";

      for (const acc of repAccounts) {
        const accVisits = (visitsByAccount.get(acc.id) ?? []).sort((a, b) =>
          a.created_at.localeCompare(b.created_at),
        );
        totalVisits += accVisits.length;
        for (const v of accVisits) {
          if (v.created_at >= weekAgo) callsThisWeek++;
          if (v.ai_output?.needs_more_info) needsMoreInfoCount++;
        }
        if (accVisits.length === 0) continue;

        const latest = accVisits[accVisits.length - 1];
        const risk = accountRisk(latest.ai_output);
        if (risk === "high") worstRisk = "high";
        else if (risk === "medium" && worstRisk !== "high") worstRisk = "medium";

        const momentum = accountMomentum(accVisits);
        if (accVisits.length >= 2) {
          scoredAccounts++;
          if (momentum !== "stalling") accelOrSteady++;
        }

        const nbm = latest.ai_output?.next_best_move;
        const item: ManagerAccountItem = {
          name: acc.name,
          status: risk === "high" ? "red" : risk === "medium" ? "amber" : "green",
          summary:
            nbm?.recommendation ||
            latest.ai_output?.combined_crm_note?.slice(0, 140) ||
            "No AI summary yet — this visit needs more detail.",
          action:
            risk === "high"
              ? "Multiple open risk flags — check in with the rep on this account."
              : momentum === "stalling"
                ? "Momentum has slowed since the last visit — ask what's changed."
                : "On track — no action needed.",
        };
        if (risk === "low" && momentum !== "stalling") onTrack.push(item);
        else attention.push(item);
      }

      const status: Status =
        totalVisits === 0
          ? "amber"
          : worstRisk === "high"
            ? "red"
            : worstRisk === "medium"
              ? "amber"
              : "green";

      return {
        id: p.user_id,
        name: p.display_name || p.email?.split("@")[0] || "Rep",
        email: p.email,
        status,
        accountCount: repAccounts.length,
        callsThisWeek,
        target: DEFAULT_WEEKLY_TARGET,
        notesQuality: totalVisits > 0 ? 1 - needsMoreInfoCount / totalVisits : 0,
        progression: scoredAccounts > 0 ? accelOrSteady / scoredAccounts : 0,
        attention,
        onTrack,
      };
    });

    const statusRank: Record<Status, number> = { red: 0, amber: 1, green: 2 };
    reps.sort((a, b) => statusRank[a.status] - statusRank[b.status]);

    return { reps };
  });
