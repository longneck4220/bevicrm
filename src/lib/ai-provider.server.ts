/**
 * Server-only AI provider switch.
 *
 * Two backends for JSON generation:
 *  - "anthropic": direct Anthropic Messages API (needs ANTHROPIC_API_KEY, billed by Anthropic)
 *  - "lovable":   Lovable AI Gateway chat completions (Gemini, billed in Lovable credits)
 *
 * Selection order: explicit `provider` argument -> AI_PROVIDER env -> "lovable".
 * Falls back to "lovable" when Anthropic is selected but no key is configured.
 */

export type AiProvider = "anthropic" | "lovable";

const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-5";
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

export function resolveProvider(requested?: AiProvider): AiProvider {
  const envChoice = (process.env.AI_PROVIDER ?? "").trim().toLowerCase();
  const choice: AiProvider =
    requested ?? (envChoice === "anthropic" ? "anthropic" : "lovable");
  if (choice === "anthropic" && !process.env.ANTHROPIC_API_KEY) {
    console.warn("[ai-provider] anthropic requested but ANTHROPIC_API_KEY missing — using Lovable gateway");
    return "lovable";
  }
  return choice;
}

async function callAnthropic(system: string, user: string): Promise<unknown> {
  const apiKey = process.env.ANTHROPIC_API_KEY!;
  const model = (process.env.ANTHROPIC_MODEL ?? "").trim() || DEFAULT_ANTHROPIC_MODEL;

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: `${system}\n\nRespond with a single valid JSON object and nothing else. No markdown fences, no commentary.`,
      messages: [
        { role: "user", content: user },
        // Prefill forces the model to continue a JSON object.
        { role: "assistant", content: "{" },
      ],
    }),
  });

  if (!resp.ok) throw mapStatus(resp.status, "Anthropic", await resp.text());

  const payload = (await resp.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const text = (payload.content ?? [])
    .filter((b) => b?.type === "text" && typeof b.text === "string")
    .map((b) => b.text as string)
    .join("");

  // Re-attach the prefilled opening brace.
  return extractJson(text.trimStart().startsWith("{") ? text : `{${text}`);
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

/** Generate a JSON object from a system + user prompt using the selected provider. */
export async function generateVisitJson<T>(args: {
  system: string;
  user: string;
  provider?: AiProvider;
}): Promise<T> {
  const provider = resolveProvider(args.provider);
  const result =
    provider === "anthropic"
      ? await callAnthropic(args.system, args.user)
      : await callLovable(args.system, args.user);
  return result as T;
}
