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

    const { generateVisitJson } = await import("@/lib/ai-provider.server");
    const parsed = await generateVisitJson<AiOutput>({
      system: SYSTEM_PROMPT + DEMO_SUFFIX,
      user: userPrompt,
    });
    parsed.targeted_deals = [];
    return { output: parsed };
  });
