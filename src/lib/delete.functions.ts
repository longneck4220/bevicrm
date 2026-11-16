import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { typedTextMatches } from "@/lib/typed-confirm";

/**
 * Self-service deletes for a signed-in rep. Venue deletes run on the caller's
 * own RLS client plus an explicit owner check, so one rep can never delete
 * another rep's venue even if RLS were loosened later.
 */

async function loadOwnVenue(
  supabase: SupabaseClient<Database>,
  userId: string,
  accountId: string,
) {
  const { data, error } = await supabase
    .from("accounts")
    .select("id, name, owner_id")
    .eq("id", accountId)
    .maybeSingle();
  if (error) {
    console.error("[delete venue] lookup failed", error);
    throw new Error("Could not find that venue. Nothing was deleted.");
  }
  if (!data) return null;
  if (data.owner_id !== userId)
    throw new Error("You can only delete your own venues.");
  return data;
}

export const getMyVenueDeleteImpact = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z.object({ accountId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { countAccountContents } = await import("@/lib/purge.server");
    const venue = await loadOwnVenue(
      context.supabase,
      context.userId,
      data.accountId,
    );
    if (!venue) throw new Error("That venue no longer exists.");
    return countAccountContents(context.supabase, [venue.id]);
  });

export const deleteMyVenue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        accountId: z.string().uuid(),
        confirmName: z.string().max(300),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { deletePinnedFiles } = await import("@/lib/purge.server");
    const venue = await loadOwnVenue(
      context.supabase,
      context.userId,
      data.accountId,
    );
    // Already deleted (for example a double tap): nothing left to do.
    if (!venue) return { ok: true };

    if (!typedTextMatches(data.confirmName, venue.name)) {
      throw new Error(
        "The venue name you typed does not match. Nothing was deleted.",
      );
    }

    await deletePinnedFiles(context.supabase, [venue.id]);
    const { error } = await context.supabase
      .from("accounts")
      .delete()
      .eq("id", venue.id)
      .eq("owner_id", context.userId);
    if (error) {
      console.error("[delete venue] delete failed", error);
      throw new Error("Could not delete that venue. Try again.");
    }
    return { ok: true };
  });

export const getMyLoginDeleteImpact = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } =
      await import("@/integrations/supabase/client.server");
    const { countUserContents } = await import("@/lib/purge.server");
    return countUserContents(supabaseAdmin, context.userId);
  });

export const deleteMyLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z.object({ confirmEmail: z.string().max(320) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } =
      await import("@/integrations/supabase/client.server");
    const { isLastAdmin, purgeUserData } = await import("@/lib/purge.server");

    const { data: found, error: lookupError } =
      await supabaseAdmin.auth.admin.getUserById(context.userId);
    if (lookupError || !found?.user) {
      console.error("[deleteMyLogin] lookup failed", lookupError);
      throw new Error("Could not look up your login. Nothing was deleted.");
    }
    if (!typedTextMatches(data.confirmEmail, found.user.email ?? "")) {
      throw new Error(
        "The email you typed does not match. Nothing was deleted.",
      );
    }
    if (await isLastAdmin(supabaseAdmin, context.userId)) {
      throw new Error(
        "You are the last admin. Make someone else an admin before deleting your login.",
      );
    }

    await purgeUserData(supabaseAdmin, context.userId);
    return { ok: true };
  });
