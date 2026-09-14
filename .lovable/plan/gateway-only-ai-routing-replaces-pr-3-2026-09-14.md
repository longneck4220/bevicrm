# Gateway-only AI routing (replaces PR #3)

## Recommendation

Do not merge PR #3. It branched off an old version of the project and now conflicts with everything that landed since. The three problems it was written to fix are still real, but they are small and can be fixed directly on the current code in one pass — with a build actually run and verified, which the PR author could not do.

Confirmed on the current code just now:

- The direct-to-Anthropic path is still there, and it is still selectable from the incoming request (a `provider` field on the visit-note request), not only from a server setting.
- One AI call site (document/deal reading in the file library) is still on the old model name `google/gemini-2.5-flash`, while the main path uses `google/gemini-3.6-flash`. That is the same "fixed in one place, not everywhere" split that caused the original outage.
- `AI_PROVIDER` and `ANTHROPIC_API_KEY` are both still set on this project, so the Anthropic path can still be chosen today.

## What I will change

1. Remove the direct-to-Anthropic route entirely. Every AI call goes through Lovable's AI Gateway — one code path, the original working design, no second differently-behaving route to add lag or drift.
2. Remove the request-level provider override so nothing coming in from a browser can pick where an AI call goes.
3. Put every AI call on the same current model, defined in one place so a future model change is a single edit.
4. Leave the audio transcription call as is — it already goes through the gateway.
5. Run a real typecheck and production build, then generate one real visit note end to end and confirm the full output comes back.

## Effect you should expect

Visit-note generation runs on Lovable's AI Gateway and is billed in Lovable credits, not Anthropic. If generation is currently going to Anthropic/Claude, that stops. This is the behaviour you asked for, and it is worth naming out loud since it is a billing change as well as a fix.

The unused `AI_PROVIDER`, `ANTHROPIC_API_KEY`, and `ANTHROPIC_MODEL` settings become dead once the code no longer reads them. I will leave them in place rather than delete them, so nothing else that might reference them breaks; say the word and I will remove them in a follow-up.

## Technical detail

- `src/lib/ai-provider.server.ts`: drop `callAnthropic`, `resolveProvider`, `AnthropicAuthError`, the `anthropicDisabled` flag, and the `AiProvider` type. Keep `extractJson` and `mapStatus`. `generateVisitJson` takes `{ system, user }` only and calls the gateway. Export a single `AI_MODEL` constant.
- `src/lib/trial.functions.ts`: remove `provider: z.enum([...])` from the input schema and the `provider: data.provider` pass-through.
- `src/lib/library.functions.ts`: replace the literal `"google/gemini-2.5-flash"` with the shared `AI_MODEL` import.
- `src/lib/demo.functions.ts`: no change needed beyond the signature (already gateway-only).
- Verification: `bunx tsgo --noEmit`, `bun run build`, then one live generation through `/try`.
