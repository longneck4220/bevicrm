import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequest } from "@tanstack/react-start/server";
import { SYSTEM_PROMPT, type AiOutput } from "@/lib/trial.functions";

const DAILY_LIMIT_PER_VISITOR = 5;
// Used only when no client IP header is present. Shared by everyone in that
// situation, so it is much higher: a missing header must not lock all visitors out.
const DAILY_LIMIT_UNKNOWN_VISITOR = 200;
const UNKNOWN_VISITOR = "unknown";

const DemoInput = z.object({
  venue: z.string().trim().min(1).max(120),
  rawNote: z.string().trim().min(20).max(4000),
});

const DEMO_SUFFIX = `

DEMO MODE:
- There is no saved account memory, no prior visit history and no reference documents for this account.
- Do not reference files, prior visits or stored memory that were not supplied.
- Always return "targeted_deals": [] (no price or promo files are on file in demo mode).
- Still produce your strongest, most practical output from the note alone.`;

function getClientIp(): string | null {
  const headers = getRequest().headers;
  const direct = headers.get("cf-connecting-ip");
  if (direct) return direct.trim();
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || null;
}

async function sha256Hex(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Counts this generation against the visitor's UTC-day allowance and throws once
 * it is used up. Stored as a hash so the raw IP is never saved.
 */
async function enforceDemoLimit(): Promise<void> {
  const ip = getClientIp();
  const day = new Date().toISOString().slice(0, 10);
  const key = await sha256Hex(`${ip ?? UNKNOWN_VISITOR}|${day}`);
  const limit = ip ? DAILY_LIMIT_PER_VISITOR : DAILY_LIMIT_UNKNOWN_VISITOR;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // demo_usage and increment_demo_usage are not in the generated types.ts yet,
  // so this one rpc call is cast narrowly rather than editing a generated file.
  const rpc = supabaseAdmin.rpc as unknown as (
    fn: string,
    args: { p_key: string; p_day: string },
  ) => Promise<{ data: number | null; error: { message: string } | null }>;
  const { data: count, error } = await rpc.call(supabaseAdmin, "increment_demo_usage", {
    p_key: key,
    p_day: day,
  });

  if (error || typeof count !== "number") {
    // Fail open: a broken counter should not take the public demo down.
    console.error("[demo] usage counter failed", error);
    return;
  }
  if (count > limit) {
    throw new Error(
      "Daily demo limit reached. Create a free account to keep generating, or come back tomorrow.",
    );
  }
}

/**
 * Public, unauthenticated demo generation. Reads nothing and writes nothing —
 * the result exists only in the visitor's browser session.
 */
export const generateDemoIntelligence = createServerFn({ method: "POST" })
  .inputValidator((d) => DemoInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured. Please try again later.");

    await enforceDemoLimit();

    const { venue, rawNote } = data;

    const userPrompt = `Account: ${venue}
Contact: (unknown)

Current account memory:
"""
(empty — this is the first recorded visit)
"""

Prior visit history:
"""
(no prior visits)
"""

Reference documents on file:
"""
(no reference documents on file)
"""

Active deals catalog:
"""
(no structured deals on file)
"""

Rep's post-visit note (may be messy, dictated, partial):
"""
${rawNote}
"""

Generate the BEVI output JSON now. Reconstruct the CRM note into labelled CRM-ready lines and keep every recommendation grounded in the note above. Return an empty array for "targeted_deals".`;

    const { generateVisitJson } = await import("@/lib/ai-provider.server");
    const parsed = await generateVisitJson<AiOutput>({
      system: SYSTEM_PROMPT + DEMO_SUFFIX,
      user: userPrompt,
    });
    parsed.targeted_deals = [];
    return { output: parsed };
  });
