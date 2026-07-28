import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { SYSTEM_PROMPT, type AiOutput } from "@/lib/trial.functions";

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

/**
 * Public, unauthenticated demo generation. Reads nothing and writes nothing —
 * the result exists only in the visitor's browser session.
 */
export const generateDemoIntelligence = createServerFn({ method: "POST" })
  .inputValidator((d) => DemoInput.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured. Please try again later.");

    const venue = data.venue.slice(0, 120);
    const rawNote = data.rawNote.slice(0, 4000);

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

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + DEMO_SUFFIX },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (resp.status === 429)
      throw new Error("BEVI is busy right now — please try again in a moment.");
    if (resp.status === 402)
      throw new Error("The demo is temporarily unavailable. Try again soon.");
    if (!resp.ok) {
      const txt = await resp.text();
      console.error("[demo AI gateway error]", resp.status, txt.slice(0, 1000));
      throw new Error("AI service error. Please try again later.");
    }

    const payload = await resp.json();
    const content: string = payload?.choices?.[0]?.message?.content ?? "";
    let parsed: AiOutput;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("BEVI returned an unexpected response. Please try again.");
    }
    parsed.targeted_deals = [];
    return { output: parsed };
  });
