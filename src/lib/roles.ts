import type { User } from "@supabase/supabase-js";

export type AppRole = "admin" | "manager" | "rep";

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Admin",
  manager: "Manager",
  rep: "Rep",
};

export const ROLE_OPTIONS: AppRole[] = ["rep", "manager", "admin"];

export type RoleHome = "/admin" | "/manager" | "/dashboard";

/**
 * Where a signed-in person belongs by default. Reps (and anyone without a role
 * row yet) land on the rep dashboard.
 */
export function homeForRole(role: AppRole | null): RoleHome {
  if (role === "admin") return "/admin";
  if (role === "manager") return "/manager";
  return "/dashboard";
}

/** A user may hold several rows; the most privileged one wins. */
export function pickRole(roles: string[]): AppRole | null {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("manager")) return "manager";
  if (roles.includes("rep") || roles.includes("user")) return "rep";
  return null;
}

/** The name shown in nav headers: full name from signup metadata, else the email's local part. */
export function displayNameFor(user: User | null | undefined, fallback = "Account"): string {
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  return (
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    user?.email?.split("@")[0] ||
    fallback
  );
}

/**
 * Reads the current user's role straight after sign-in, before the auth context
 * settles. The Supabase client is imported lazily so this module stays safe to
 * import from server-function modules.
 */
export async function fetchRoleForUser(userId: string): Promise<AppRole | null> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return pickRole((data ?? []).map((r) => r.role as string));
}
