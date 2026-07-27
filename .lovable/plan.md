## Goal

Let visit intelligence run on Anthropic Claude, with a switch so you can flip back to the current Gemini model without code changes.

## Important context

Lovable's AI gateway catalog has no Anthropic models, and there is no "custom connector" that adds models to it. So Claude has to be called directly at `api.anthropic.com` using your own Anthropic API key. That means Claude usage is billed by Anthropic, not Lovable credits.

## What gets built

1. **Secret**: request `ANTHROPIC_API_KEY` (from console.anthropic.com → API Keys) via the secure secret form. Server-side only.

2. **New server-only helper** `src/lib/ai-provider.server.ts`
   - `generateVisitJson({ system, user })` — one function, two backends:
     - `anthropic`: POST `https://api.anthropic.com/v1/messages` with `x-api-key`, `anthropic-version: 2023-06-01`, system prompt as top-level `system`, and a JSON-only instruction plus prefilled `{` assistant turn to force clean JSON.
     - `lovable`: the existing gateway `/v1/chat/completions` call with `google/gemini-3.6-flash` and `response_format: json_object`.
   - Returns parsed JSON, and maps errors consistently (429 rate limit, 402/credit or Anthropic billing, other → generic "AI service error", with full detail logged server-side only).
   - Falls back to the Lovable gateway automatically if Claude is selected but `ANTHROPIC_API_KEY` is missing, so the app never hard-breaks.

3. **Model switch** (no code edits to change models)
   - Env vars read inside the handler: `AI_PROVIDER` (`anthropic` | `lovable`, default `lovable`) and `ANTHROPIC_MODEL` (default `claude-sonnet-4-5`).
   - Optional per-request override: `generateVisitIntelligence` input gains an optional `provider` field so a caller can force one backend; the env default applies when it's absent.

4. **Wire into `generateVisitIntelligence`** (`src/lib/trial.functions.ts` lines ~388–418)
   - Replace the inline gateway fetch with a call to the helper. Prompt building, prior-visit recall, deals, DB insert and return shape all stay exactly as they are.
   - `/try` demo, transcription (Whisper) and every other AI call are untouched — they stay on the Lovable gateway.

5. **Verify**: run one real generation through the route on Claude and read the response, confirming valid JSON in the existing `AiOutput` shape, then confirm the switch back to Gemini still works.

## Technical notes

- Anthropic returns `content[0].text`, not `choices[0].message.content`, and has no `response_format` — hence the JSON-forcing prompt + assistant prefill.
- Helper lives in a `.server.ts` file so the key never enters the client bundle; `process.env` is read inside the handler, not at module scope.
- Claude model IDs are not validated by Lovable, so `ANTHROPIC_MODEL` is a plain string you control.
