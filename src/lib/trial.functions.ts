import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GenerateInput = z.object({
  accountId: z.string().uuid(),
  rawNote: z.string().min(1).max(12000),
  supportingContext: z.string().max(400000).optional().default(""),
});

const SYSTEM_PROMPT = `You are BEVI, a post-visit intelligence agent for Queensland spirits and beverage hospitality field sales reps.

BEVI's product role:
Otter records. Salesforce remembers. BEVI converts next-move behaviour.

Working positioning:
Making conversations commercial conversions.

You behave like a top 1% liquor, spirits, and beverage hospitality field sales rep in Queensland, Australia.

Your role is to turn a messy post-visit note into practical commercial intelligence the rep can use immediately.

Input may include:
- current account memory
- pasted prior conversations
- pasted customer emails
- pasted or uploaded document context
- PDF, PPTX, DOCX, Excel, CSV, product list, price list, range deck, promo plan, account plan, or masterfile context
- current post-visit note

You understand:
- venue operations
- liquor and spirits field sales
- margin pressure
- volume versus premium trade-offs
- staff capability
- cocktail list complexity
- venue timing and service pressure
- supplier relationships
- rapport building
- when to push and when to hold
- the difference between a real opportunity and a forced sales idea
- how to use product lists, price files, promo decks, account plans, range decks, and sales masterfiles as supporting context without inventing facts

Operating philosophy:
- Long-term account growth beats short-term pressure.
- Do not force a sale if the context does not support it.
- Be balanced and commercially minded.
- Be supportive and suggestive, but challenge the rep when they missed something important.
- Recommend the next best practice, not just the next sale.
- If there is not enough information, recommend the next best question or trust-building action.
- Treat prior visit history as ground truth for trajectory. Reference what has already been tried, what objections have recurred, and how the relationship is evolving — but do not invent details not present in the history.

Never:
- invent pricing, product commitments, supply guarantees
- suggest discounts unless the user provided discount authority/data, and never above the data given
- push high-volume orders unless the note says volume is possible
- suggest ranging products unlikely to sell in the account context
- overpromise stock, service, timelines, support, pricing, or outcomes
- imply BEVI knows facts that were not in the note or account memory
- invent facts from a document that was not provided
- treat old document or masterfile data as current unless the user confirms it
- push alcohol irresponsibly

If the current visit note is too thin:
- do not pretend confidence is higher than it is
- set "needs_more_info" true and ask up to 3 practical follow-up questions (one at a time in product UX)
- focus questions on contact, objective, result, opportunity, objections, orders, and next step

Style:
- concise, direct, commercially useful, Australian professional tone
- short friendly follow-up email; match the rep's voice if known, otherwise short/friendly/professional
- avoid generic AI phrasing

Before deciding, silently ask:
What would a top 1% Queensland liquor field sales rep do here to win long-term?

Return ONLY JSON matching this exact schema:
{
  "needs_more_info": boolean,
  "clarifying_questions": string[],
  "next_best_move": {
    "recommendation": string,
    "reason": string,
    "specific_ask": string,
    "commercial_posture": "Suggest" | "Recommend" | "Push" | "Hold",
    "confidence": "Low" | "Medium" | "High"
  },
  "commercial_signals": {
    "buying_style": string,
    "risk_flags": string[],
    "margin_pressure": string,
    "opportunity_signals": string[]
  },
  "combined_crm_note": string,
  "follow_up_email": {
    "subject": string,
    "body": string
  },
  "missed_opportunity": string,
  "updated_account_memory": string
}`;

export type AiOutput = {
  needs_more_info: boolean;
  clarifying_questions: string[];
  next_best_move: {
    recommendation: string;
    reason: string;
    specific_ask: string;
    commercial_posture: string;
    confidence: string;
  };
  commercial_signals: {
    buying_style: string;
    risk_flags: string[];
    margin_pressure: string;
    opportunity_signals: string[];
  };
  combined_crm_note: string;
  follow_up_email: { subject: string; body: string };
  missed_opportunity: string;
  updated_account_memory: string;
};

export const generateVisitIntelligence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => GenerateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const { data: account, error: accErr } = await supabase
      .from("accounts")
      .select("id, name, contact, memory")
      .eq("id", data.accountId)
      .single();
    if (accErr || !account) {
      if (accErr) console.error("[DB error] fetch account", accErr);
      throw new Error("Account not found");
    }

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
      console.error("[AI gateway error]", resp.status, txt.slice(0, 1000));
      throw new Error("AI service error. Please try again later.");
    }
    const payload = await resp.json();
    const content: string = payload?.choices?.[0]?.message?.content ?? "";
    let parsed: AiOutput;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("AI returned non-JSON output");
    }

    const { data: visit, error: visitErr } = await supabase
      .from("visits")
      .insert({
        account_id: account.id,
        owner_id: userId,
        raw_note: data.rawNote,
        supporting_context: data.supportingContext ?? "",
        ai_output: parsed as never,
      })
      .select("id, created_at")
      .single();
    if (visitErr) {
      console.error("[DB error] insert visit", visitErr);
      throw new Error("Could not save visit. Please try again.");
    }

    return { output: parsed, visitId: visit.id, createdAt: visit.created_at };
  });

export const updateAccountMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ accountId: z.string().uuid(), memory: z.string().max(20000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("accounts")
      .update({ memory: data.memory, updated_at: new Date().toISOString() })
      .eq("id", data.accountId);
    if (error) {
      console.error("[DB error] update account memory", error);
      throw new Error("Could not update account memory. Please try again.");
    }
    return { ok: true };
  });

export const rateVisit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ visitId: z.string().uuid(), rating: z.enum(["good", "needs_edit"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("visits")
      .update({ rating: data.rating })
      .eq("id", data.visitId);
    if (error) {
      console.error("[DB error] update visit rating", error);
      throw new Error("Could not save rating. Please try again.");
    }
    return { ok: true };
  });

export const createAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        name: z.string().min(1).max(200),
        contact: z.string().max(200).optional().default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("accounts")
      .insert({ name: data.name, contact: data.contact || null, memory: "", owner_id: context.userId })
      .select("id")
      .single();
    if (error) {
      console.error("[DB error] create account", error);
      throw new Error("Could not create account. Please try again.");
    }
    return { id: row.id };
  });

export type VisitListItem = {
  id: string;
  account_id: string;
  account_name: string;
  account_contact: string | null;
  created_at: string;
  rating: string | null;
  ai_output: AiOutput | null;
};

export const listVisits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VisitListItem[]> => {
    const { data, error } = await context.supabase
      .from("visits")
      .select("id, account_id, created_at, rating, ai_output, accounts:account_id(name, contact)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      console.error("[DB error] list visits", error);
      throw new Error("Could not load visits. Please try again.");
    }
    return (data ?? []).map((v: {
      id: string;
      account_id: string;
      created_at: string;
      rating: string | null;
      ai_output: unknown;
      accounts: { name: string; contact: string | null } | { name: string; contact: string | null }[] | null;
    }) => {
      const acct = Array.isArray(v.accounts) ? v.accounts[0] : v.accounts;
      return {
        id: v.id,
        account_id: v.account_id,
        account_name: acct?.name ?? "(unknown)",
        account_contact: acct?.contact ?? null,
        created_at: v.created_at,
        rating: v.rating,
        ai_output: (v.ai_output as AiOutput | null) ?? null,
      };
    });
  });

export const getVisit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("visits")
      .select("id, account_id, created_at, rating, raw_note, supporting_context, ai_output, accounts:account_id(name, contact, memory)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) {
      console.error("[DB error] get visit", error);
      throw new Error("Could not load visit.");
    }
    if (!row) return null;
    const acct = Array.isArray(row.accounts) ? row.accounts[0] : row.accounts;
    return {
      id: row.id,
      account_id: row.account_id,
      account_name: acct?.name ?? "(unknown)",
      account_contact: acct?.contact ?? null,
      account_memory: acct?.memory ?? "",
      created_at: row.created_at,
      rating: row.rating as string | null,
      raw_note: row.raw_note as string,
      supporting_context: row.supporting_context as string,
      ai_output: (row.ai_output as AiOutput | null) ?? null,
    };
  });
