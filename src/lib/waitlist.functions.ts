import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const joinSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  source: z.string().trim().max(60).optional(),
  referrer: z.string().trim().max(500).optional(),
  utm: z.string().trim().max(300).optional(),
});

export const joinWaitlist = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => joinSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("waitlist_signups").upsert(
      {
        email: data.email,
        source: data.source ?? "get-a-bevi",
        referrer: data.referrer ?? null,
        utm: data.utm ?? null,
      },
      { onConflict: "email", ignoreDuplicates: true },
    );
    if (error) {
      console.error("waitlist insert failed", error.message);
      throw new Error("Could not save your email. Please try again.");
    }
    return { ok: true as const };
  });

export type WaitlistRow = {
  id: string;
  email: string;
  source: string;
  referrer: string | null;
  utm: string | null;
  created_at: string;
};

export const listWaitlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WaitlistRow[]> => {
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr || !isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("waitlist_signups")
      .select("id, email, source, referrer, utm, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Failed to load waitlist");
    return data ?? [];
  });
