/**
 * Server-only AI generation via the Lovable AI Gateway (Gemini).
 */

const DEFAULT_LOVABLE_MODEL = "google/gemini-3.6-flash";

function mapStatus(status: number, label: string, bodyText: string): Error {
  if (status === 429) return new Error("Rate limit — please try again in a moment.");
  if (status === 402) return new Error("AI credits exhausted. Add credits in Workspace → Usage.");
  console.error(`[${label} error]`, status, bodyText.slice(0, 1000));
  return new Error("AI service error. Please try again later.");
}

function extractJson(raw: string): unknown {
  const text = raw.trim();
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
  }
  throw new Error("AI returned non-JSON output");
}

async function callLovable(system: string, user: string): Promise<unknown> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEFAULT_LOVABLE_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!resp.ok) throw mapStatus(resp.status, "AI gateway", await resp.text());

  const payload = await resp.json();
  const content: string = payload?.choices?.[0]?.message?.content ?? "";
  return extractJson(content);
}

/** Generate a JSON object from a system + user prompt via the Lovable AI Gateway. */
export async function generateVisitJson<T>(args: { system: string; user: string }): Promise<T> {
  const result = await callLovable(args.system, args.user);
  return result as T;
}
