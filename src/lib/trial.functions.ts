import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GenerateInput = z.object({
  accountId: z.string().uuid(),
  rawNote: z.string().min(1).max(8000),
  supportingContext: z.string().max(20000).optional().default(""),
});

const SYSTEM_PROMPT = `You are BEVI, a post-visit intelligence agent for Queensland spirits/beverage hospitality field sales reps.

Your job: turn one messy post-visit note into useful, commercially honest sales intelligence.

Rules:
- Never invent pricing, discounts, supply commitments, or quantities.
- Be concise, practical, and commercially literate.
- Match the rep's tone: direct, low-bullshit, Australian on-trade hospitality.
- If the note is too thin (under ~10 words or missing what was discussed/result), set "needs_more_info" to true and provide up to 3 short clarifying questions.
- Otherwise generate the full intelligence pack.

Return ONLY JSON matching this exact schema:
{
  "needs_more_info": boolean,
  "clarifying_questions": string[],            // 0-3 short questions if needs_more_info=true, else []
  "next_best_move": {
    "recommendation": string,                  // 1-2 sentences, the move itself
    "reason": string,                          // why this fits the venue/contact right now
    "specific_ask": string,                    // exact ask the rep can use next visit/call
    "commercial_posture": "Suggest" | "Recommend" | "Push" | "Hold",
    "confidence": "Low" | "Medium" | "High"
  },
  "combined_crm_note": string,                 // single open-text block with these labelled lines, exact labels, each on its own line:
                                               // Contact: ...
                                               // Objective: ...
                                               // Result: ...
                                               // Opportunities: ...
                                               // Other items of note: ...
                                               // Orders placed: ...    (use "N/A" or "No sale" if none)
                                               // Follow-up to-dos: ...
  "follow_up_email": {
    "subject": string,
    "body": string                             // friendly, short, rep-voice; no pricing or commitments unless they appeared in the note
  },
  "missed_opportunity": string,                // one fair challenge: something the rep could have explored but didn't. If nothing fair to flag, return "".
  "updated_account_memory": string             // a refreshed memory block (replaces existing); keep what's still true, add new durable facts about the venue/contact. No transient details.
}`;

type AiOutput = {
  needs_more_info: boolean;
  clarifying_questions: string[];
  next_best_move: {
    recommendation: string;
    reason: string;
    specific_ask: string;
    commercial_posture: string;
    confidence: string;
  };
  combined_crm_note: string;
  follow_up_email: { subject: string; body: string };
  missed_opportunity: string;
  updated_account_memory: string;
};

export const generateVisitIntelligence = createServerFn({ method: "POST" })
  .inputValidator((d) => GenerateInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const { data: account, error: accErr } = await supabaseAdmin
      .from("accounts")
      .select("id, name, contact, memory")
      .eq("id", data.accountId)
      .single();
    if (accErr || !account) throw new Error("Account not found");

    const userPrompt = `Account: ${account.name}
Contact: ${account.contact ?? "(unknown)"}

Current account memory:
"""
${account.memory || "(empty)"}
"""

Supporting context the rep pasted in (previous emails, range/promo docs, masterfile excerpts, etc.):
"""
${data.supportingContext || "(none)"}
"""

Rep's post-visit note (may be messy, dictated, partial):
"""
${data.rawNote}
"""

Generate the BEVI output JSON now.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (resp.status === 429) throw new Error("Rate limit — please try again in a moment.");
    if (resp.status === 402) throw new Error("AI credits exhausted. Add credits in Workspace → Usage.");
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`AI gateway error ${resp.status}: ${txt.slice(0, 300)}`);
    }
    const payload = await resp.json();
    const content: string = payload?.choices?.[0]?.message?.content ?? "";
    let parsed: AiOutput;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("AI returned non-JSON output");
    }

    // Persist visit
    const { data: visit, error: visitErr } = await supabaseAdmin
      .from("visits")
      .insert({
        account_id: account.id,
        raw_note: data.rawNote,
        supporting_context: data.supportingContext ?? "",
        ai_output: parsed as never,
      })
      .select("id, created_at")
      .single();
    if (visitErr) throw new Error(visitErr.message);

    return { output: parsed, visitId: visit.id, createdAt: visit.created_at };
  });

export const updateAccountMemory = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ accountId: z.string().uuid(), memory: z.string().max(20000) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("accounts")
      .update({ memory: data.memory, updated_at: new Date().toISOString() })
      .eq("id", data.accountId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const rateVisit = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ visitId: z.string().uuid(), rating: z.enum(["good", "needs_edit"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("visits")
      .update({ rating: data.rating })
      .eq("id", data.visitId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createAccount = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        name: z.string().min(1).max(200),
        contact: z.string().max(200).optional().default(""),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("accounts")
      .insert({ name: data.name, contact: data.contact || null, memory: "" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });
