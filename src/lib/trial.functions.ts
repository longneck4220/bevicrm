import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GenerateInput = z.object({
  accountId: z.string().uuid(),
  rawNote: z.string().min(1).max(12000),
  supportingContext: z.string().max(400000).optional().default(""),
  provider: z.enum(["anthropic", "lovable"]).optional(),
});

const TranscribeInput = z.object({
  base64: z.string().min(1),
  mime: z.string().min(1).max(100),
});

export const transcribeAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => TranscribeInput.parse(d))
  .handler(async ({ data }): Promise<{ text: string }> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    // Decode base64 -> bytes -> Blob (Workers runtime supports atob + Blob)
    const bin = atob(data.base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    if (bytes.byteLength < 512) throw new Error("Recording was empty. Please try again.");
    if (bytes.byteLength > 25 * 1024 * 1024)
      throw new Error("Recording is over 25 MB. Try shorter clips.");

    // Pick a filename extension that matches the actual container so the
    // upstream model doesn't reject with "Audio file might be corrupted".
    const mime = (data.mime || "").split(";")[0].trim().toLowerCase();
    const extMap: Record<string, string> = {
      "audio/webm": "webm",
      "audio/ogg": "ogg",
      "audio/mp4": "mp4",
      "audio/x-m4a": "m4a",
      "audio/mpeg": "mp3",
      "audio/wav": "wav",
      "audio/x-wav": "wav",
    };
    const ext = extMap[mime] ?? "webm";
    const blob = new Blob([bytes], { type: mime || "audio/webm" });

    const form = new FormData();
    form.append("model", "openai/gpt-4o-transcribe");
    form.append("file", blob, `recording.${ext}`);

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (resp.status === 429) throw new Error("Rate limit — please try again in a moment.");
    if (resp.status === 402)
      throw new Error("AI credits exhausted. Add credits in Workspace → Usage.");
    if (!resp.ok) {
      const txt = await resp.text();
      console.error("[STT gateway error]", resp.status, txt.slice(0, 500));
      throw new Error("Transcription failed. Please try again.");
    }
    const payload = await resp.json();
    const text: string = payload?.text ?? "";
    return { text: text.trim() };
  });

export const SYSTEM_PROMPT = `You are BEVI, a post-visit intelligence agent for field BDMs and field sales teams.

BEVI's product role:
BEVI turns messy post-visit notes into CRM-ready follow-up, account memory, and the next best commercial move.

Working positioning:
Win the next call.

You are purpose-built to the customer's industry and market. For this first targeted pilot, apply a liquor, beverage, hospitality, and FMCG field-sales lens.

You behave like a top 1% field BDM operating in that targeted pilot market.

Your role is to turn a messy post-visit note into practical commercial intelligence the rep can use immediately.

Core output distinction:
- The CRM note is a formal business-facing reconstruction of the visit for CRM entry. It must not simply repeat the raw note. Rewrite messy notes into clear labelled lines covering contact, objective/context, outcome/result, opportunity, order/commercial detail, objections/risks, agreed follow-up, and next step. Add useful commercial structure and reasonable sales interpretation, but mark uncertainty instead of inventing facts.
- Account memory is not a visit note and not a full case file. It is a quick front-of-call briefing for the rep opening the account page. Synthesize the existing account memory, prior visit history, and current visit into a concise, purpose-focused account brief. Keep only the need-to-know facts that help the rep prepare, speak to the customer, and choose the next move. Preserve richer detail only when it is urgent, commercially material, or needed for a live sales pitch.

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
- When reference documents are on file (price lists, promo decks, range cards, account plans, masterfiles), treat them as the authoritative source for products, pricing, and promo mechanics. Cite the file name when you use a fact from one. Never invent SKUs, prices, or promo terms that are not in the documents or the rep's note.

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

CRM note requirements:
- Write as a polished CRM-ready note in separate labelled lines, not a loose paragraph.
- Improve the raw note with business language and sales judgement where supported by evidence.
- Include practical KPI/commercial markers where available: products discussed, order status, volume/value indicators, discount/promo dependency, outlet fit, risk level, opportunity quality, follow-up owner, and timing.
- If a key field is unknown, write "Not captured" rather than guessing.
- Use the rep's messy phrasing only as source material; reconstruct it into a clean record a manager could read.

Account memory requirements:
- updated_account_memory must be a concise rep-facing account brief, not a copy of the current visit note and not a long historical file.
- Format it as short labelled lines using these headings where known: Overview, Venue type, Buying style, What sells, Sales triggers, Recent deals/chats, Watch-outs, Next focus.
- Keep it scannable at a glance: normally 6-8 short lines total, maximum about 120-160 words.
- Prioritise stable, useful account intelligence: general account overview, venue type, buyer/contact style, what sells well, what triggers sales, recurring objections, current risks, recent deals/chats, and the next focus for the rep.
- Do not list every product discussed. Mention specific products only if they are currently important: strong seller, urgent follow-up, agreed deal, active objection, supply/pricing risk, or a major pitch.
- Use prior visit history and current memory as background intelligence, but compress it into what the rep needs before or during the next call. Reconcile contradictions by keeping the latest signal only when it is more reliable.

Before deciding, silently ask:
What would a top 1% field BDM do here to win long-term in this customer's market?

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
  "updated_account_memory": string,
  "targeted_deals": [
    {
      "product": string,
      "deal": string,
      "window": string,
      "eligibility": string,
      "why_relevant": string,
      "pitch_line": string,
      "source_file": string
    }
  ]
}

Rules for targeted_deals:
- Only include deals that come directly from the "Active deals catalog" supplied below. Never invent products, prices, dates, or eligibility.
- Pick the 1-3 deals most relevant to THIS account based on account memory, prior visit history, buying style, and the current note. Skip if nothing is a genuine fit — return [].
- "pitch_line" must be a single Australian-professional sentence the rep can say at the end of the visit to introduce the deal.
- "why_relevant" must reference the specific account signal (e.g. "they range Bundaberg Rum and asked about case pricing on 22 May").
- "window" is the promo dates ("from X until Y"), or "ongoing" if not specified.
- "source_file" is the file name the deal came from.`;

export type TargetedDeal = {
  product: string;
  deal: string;
  window: string;
  eligibility: string;
  why_relevant: string;
  pitch_line: string;
  source_file: string;
};

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
  targeted_deals?: TargetedDeal[];
};

export const generateVisitIntelligence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => GenerateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: account, error: accErr } = await supabase
      .from("accounts")
      .select("id, name, contact, memory")
      .eq("id", data.accountId)
      .single();
    if (accErr || !account) {
      if (accErr) console.error("[DB error] fetch account", accErr);
      throw new Error("Account not found");
    }

    // Auto-recall: last 5 prior visits for this account (RLS scopes to current user)
    const { data: priorVisits, error: priorErr } = await supabase
      .from("visits")
      .select("created_at, ai_output")
      .eq("account_id", data.accountId)
      .order("created_at", { ascending: false })
      .limit(5);
    if (priorErr) console.error("[DB error] fetch prior visits", priorErr);

    const historyBlock = (() => {
      const rows = (priorVisits ?? [])
        .map((v) => {
          const ai = v.ai_output as AiOutput | null;
          if (!ai) return null;
          const date = new Date(v.created_at as string).toISOString().slice(0, 10);
          const summary = (ai.combined_crm_note ?? "").slice(0, 800);
          const sig = ai.commercial_signals ?? {
            buying_style: "",
            risk_flags: [],
            margin_pressure: "",
            opportunity_signals: [],
          };
          const risks = (sig.risk_flags ?? []).join("; ");
          const opps = (sig.opportunity_signals ?? []).join("; ");
          return `[${date}] Summary: ${summary} | Buying style: ${sig.buying_style ?? ""} | Risk flags: ${risks} | Margin pressure: ${sig.margin_pressure ?? ""} | Opportunities: ${opps}`;
        })
        .filter((s): s is string => Boolean(s));
      return rows.length ? rows.join("\n") : "(no prior visits)";
    })();

    // Auto-include reference documents on file (account-pinned + global), already parsed at upload.
    const PER_FILE_CAP = 15_000;
    const TOTAL_CAP = 60_000;
    const { data: libFiles, error: libErr } = await supabase
      .from("library_files")
      .select("id, name, file_type, account_id, extracted_text, deals, created_at")
      .or(`account_id.eq.${data.accountId},account_id.is.null`)
      .order("created_at", { ascending: false })
      .limit(40);
    if (libErr) console.error("[DB error] fetch library_files", libErr);

    const referenceDocsBlock = (() => {
      const rows = (libFiles ?? []).filter((f) => (f.extracted_text ?? "").trim().length > 0);
      // account-pinned first, then global; each group already newest-first from the query
      rows.sort((a, b) => {
        const ap = a.account_id ? 0 : 1;
        const bp = b.account_id ? 0 : 1;
        return ap - bp;
      });
      const included: string[] = [];
      const overflow: string[] = [];
      let used = 0;
      for (const f of rows) {
        const scope = f.account_id ? "pinned" : "global";
        const raw = (f.extracted_text ?? "").trim();
        const sliced =
          raw.length > PER_FILE_CAP
            ? raw.slice(0, PER_FILE_CAP) + `\n…[truncated ${raw.length - PER_FILE_CAP} chars]`
            : raw;
        if (used + sliced.length > TOTAL_CAP) {
          overflow.push(`${f.name} (${scope})`);
          continue;
        }
        included.push(`--- File: ${f.name} (${scope}, ${f.file_type}) ---\n${sliced}`);
        used += sliced.length;
      }
      if (!included.length && !overflow.length) return "(no reference documents on file)";
      let block = included.join("\n\n");
      if (overflow.length) {
        block += `\n\nAlso on file (not included — over budget, ask the rep to attach manually if needed): ${overflow.join(", ")}`;
      }
      return block;
    })();

    // Structured deals catalog (pre-extracted at upload) — primary source for end-of-call deal pitches.
    const dealsBlock = (() => {
      type DealRow = {
        product: string;
        discount: string;
        starts_on: string | null;
        ends_on: string | null;
        eligibility: string;
        notes: string;
      };
      const lines: string[] = [];
      for (const f of libFiles ?? []) {
        const arr = (f.deals as unknown as DealRow[] | null) ?? [];
        if (!Array.isArray(arr) || !arr.length) continue;
        const scope = f.account_id ? "pinned" : "global";
        for (const d of arr) {
          if (!d?.product || !d?.discount) continue;
          const window = [d.starts_on, d.ends_on].filter(Boolean).join(" → ") || "ongoing";
          lines.push(
            `- [${scope}] ${d.product} — ${d.discount} | window: ${window} | eligibility: ${d.eligibility || "n/a"}${d.notes ? ` | notes: ${d.notes}` : ""} (source: ${f.name})`,
          );
        }
        if (lines.length > 200) break;
      }
      return lines.length ? lines.join("\n") : "(no structured deals on file)";
    })();

    const userPrompt = `Account: ${account.name}
Contact: ${account.contact ?? "(unknown)"}

Current account memory:
"""
${account.memory || "(empty)"}
"""

Prior visit history (most recent first, last 5 visits) — use to track trajectory, recurring objections, and what has already been tried. Do not repeat prior recommendations verbatim; build on them:
"""
${historyBlock}
"""

Reference documents on file for this account (pinned to this account + global price/promo/range files). Treat these as the authoritative source for products, prices, and promo mechanics. Cite the file name when you use a fact from one:
"""
${referenceDocsBlock}
"""

Active deals catalog (pre-extracted from uploaded price lists, promo decks, range cards). Use this as the ONLY source for the "targeted_deals" output. Pick deals that genuinely fit this account's profile, history, and current note — leave empty if nothing fits:
"""
${dealsBlock}
"""

Supporting context the rep pasted in for this visit (previous emails, extra notes, one-off attachments):
"""
${data.supportingContext || "(none)"}
"""

Rep's post-visit note (may be messy, dictated, partial):
"""
${data.rawNote}
"""

Generate the BEVI output JSON now. Reconstruct the CRM note into labelled CRM-ready lines, and synthesize updated_account_memory as a concise front-of-call account brief using current memory + prior visit history + this note. The memory should help the rep quickly understand the account before opening or entering the next call. Do not copy the raw note or CRM note verbatim into account memory, and do not include detailed product history unless it is currently important.`;

    const { generateVisitJson } = await import("@/lib/ai-provider.server");
    const parsed = await generateVisitJson<AiOutput>({
      system: SYSTEM_PROMPT,
      user: userPrompt,
      provider: data.provider,
    });

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

export type MemoryVersion = {
  id: string;
  memory: string;
  source: string;
  visit_id: string | null;
  created_at: string;
};

/**
 * Saves a new account memory, snapshotting the value it replaces first so the
 * previous state is always recoverable (append-only history table).
 */
export const updateAccountMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        accountId: z.string().uuid(),
        memory: z.string().max(20000),
        visitId: z.string().uuid().optional(),
        source: z.enum(["ai_adopted", "manual_edit", "restore"]).optional().default("ai_adopted"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: account, error: accErr } = await supabase
      .from("accounts")
      .select("id, memory")
      .eq("id", data.accountId)
      .single();
    if (accErr || !account) {
      if (accErr) console.error("[DB error] fetch account for memory update", accErr);
      throw new Error("Account not found");
    }

    if ((account.memory ?? "") !== data.memory) {
      const { error: snapErr } = await supabase.from("account_memory_versions").insert({
        account_id: data.accountId,
        owner_id: userId,
        memory: account.memory ?? "",
        source: data.source,
        visit_id: data.visitId ?? null,
      });
      if (snapErr) {
        console.error("[DB error] snapshot account memory", snapErr);
        throw new Error("Could not save memory history. Nothing was changed.");
      }
    }

    const { error } = await supabase
      .from("accounts")
      .update({ memory: data.memory, updated_at: new Date().toISOString() })
      .eq("id", data.accountId);
    if (error) {
      console.error("[DB error] update account memory", error);
      throw new Error("Could not update account memory. Please try again.");
    }
    return { ok: true };
  });

export const listAccountMemoryVersions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ accountId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<MemoryVersion[]> => {
    const { data: rows, error } = await context.supabase
      .from("account_memory_versions")
      .select("id, memory, source, visit_id, created_at")
      .eq("account_id", data.accountId)
      .order("created_at", { ascending: false })
      .limit(25);
    if (error) {
      console.error("[DB error] list memory versions", error);
      throw new Error("Could not load memory history.");
    }
    return (rows ?? []) as MemoryVersion[];
  });

/** Restores a prior snapshot, first snapshotting the current value. */
export const restoreAccountMemoryVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ versionId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ accountId: string; memory: string }> => {
    const { supabase, userId } = context;

    const { data: version, error: verErr } = await supabase
      .from("account_memory_versions")
      .select("id, account_id, memory")
      .eq("id", data.versionId)
      .single();
    if (verErr || !version) {
      if (verErr) console.error("[DB error] fetch memory version", verErr);
      throw new Error("Memory version not found");
    }

    const { data: account, error: accErr } = await supabase
      .from("accounts")
      .select("id, memory")
      .eq("id", version.account_id)
      .single();
    if (accErr || !account) {
      if (accErr) console.error("[DB error] fetch account for restore", accErr);
      throw new Error("Account not found");
    }

    if ((account.memory ?? "") !== version.memory) {
      const { error: snapErr } = await supabase.from("account_memory_versions").insert({
        account_id: version.account_id,
        owner_id: userId,
        memory: account.memory ?? "",
        source: "restore",
      });
      if (snapErr) {
        console.error("[DB error] snapshot before restore", snapErr);
        throw new Error("Could not save memory history. Nothing was changed.");
      }
    }

    const { error } = await supabase
      .from("accounts")
      .update({ memory: version.memory, updated_at: new Date().toISOString() })
      .eq("id", version.account_id);
    if (error) {
      console.error("[DB error] restore account memory", error);
      throw new Error("Could not restore account memory. Please try again.");
    }
    return { accountId: version.account_id, memory: version.memory };
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
      .insert({
        name: data.name,
        contact: data.contact || null,
        memory: "",
        owner_id: context.userId,
      })
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
    return (data ?? []).map(
      (v: {
        id: string;
        account_id: string;
        created_at: string;
        rating: string | null;
        ai_output: unknown;
        accounts:
          | { name: string; contact: string | null }
          | { name: string; contact: string | null }[]
          | null;
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
      },
    );
  });

export const getVisit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("visits")
      .select(
        "id, account_id, created_at, rating, raw_note, supporting_context, ai_output, accounts:account_id(name, contact, memory)",
      )
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
