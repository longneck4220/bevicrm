# Plan: Automatic Nth-visit recall for BEVI

Augment the existing curated `accounts.memory` blob with automatic, invisible recall of the **last 5 visits** for the same account, fed into every new BEVI generation. No UI changes — purely backend prompt enrichment.

## Change

**File:** `src/lib/trial.functions.ts` → `generateVisitIntelligence` handler

Before calling the AI gateway, fetch the 5 most recent prior visits for `data.accountId` (owned by the current user, ordered by `created_at desc`), and inject a new section into the user prompt.

### Query
```ts
const { data: priorVisits } = await supabase
  .from("visits")
  .select("created_at, ai_output")
  .eq("account_id", data.accountId)
  .order("created_at", { ascending: false })
  .limit(5);
```
RLS already scopes to `auth.uid() = owner_id`.

### Distilled per-visit payload
For each prior visit, extract only:
- `created_at` (ISO date)
- `ai_output.combined_crm_note`
- `ai_output.commercial_signals` (buying_style, risk_flags, margin_pressure, opportunity_signals)

Skip visits with null `ai_output`. Truncate each `combined_crm_note` to ~800 chars to bound tokens.

### Prompt injection
New section in `userPrompt`, placed **between current account memory and supporting context**:

```
Prior visit history (most recent first, last 5 visits) — use to track trajectory, recurring objections, and what has already been tried. Do not repeat prior recommendations verbatim; build on them:
"""
[2026-06-01] Summary: ... | Buying style: ... | Risk flags: ... | Margin pressure: ... | Opportunities: ...
[2026-05-20] ...
"""
```

If there are no prior visits, render `(no prior visits)` so the model behavior stays consistent.

### Prompt guidance tweak
Add one line to `SYSTEM_PROMPT` operating philosophy:
> - Treat prior visit history as ground truth for trajectory. Reference what has already been tried, what objections have recurred, and how the relationship is evolving — but do not invent details not present in the history.

## Out of scope
- No UI changes (user chose "keep it invisible").
- No new tables, no schema migration.
- Raw notes and next-best-move outcomes are excluded per user's selection.
- `listVisits` / `getVisit` unchanged.

## Verification
- Trigger a generation on an account with ≥1 prior visit; confirm via server logs / output quality that BEVI references trajectory.
- Trigger on a fresh account; confirm it still works with `(no prior visits)`.
