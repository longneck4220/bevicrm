## Goal

"Try a Visit Note" currently points at `/trial`, which sits behind login, so a first-time visitor bounces to the sign-in screen. Instead, send them to a public, no-signup demo that runs a real AI pass on a venue name + note and shows a polished, slightly lighter version of the real output — nothing saved, no account required.

## What gets built

**1. New public route `/try`** (`src/routes/try.tsx` + `src/features/try/TryDemoPage.tsx`)
- Same visual language as the app (glass cards, particle field, signal labels).
- Inputs: **Venue name** and **Post-visit note** (textarea), plus 2–3 one-click sample notes so a visitor can see output without typing.
- One button: "Generate intelligence". Loading state mirrors the real trial page.
- Output cards, in the real hierarchy:
  1. Next Best Move (recommendation, reason, specific ask, posture + confidence)
  2. Commercial Signals (buying style, risk flags, margin pressure, opportunity signals)
  3. CRM Note (with copy button, using the existing robust clipboard helper)
  4. Follow-up Email (subject + body, copy button)
  5. Missed Opportunity
  - Deliberately excluded from the demo (they're the "memory" payoff that requires an account): Account Memory and Targeted Deals — each shown as a locked/teaser tile with a line like "Account memory builds from your second visit onwards" and a CTA.
- Bottom CTA block: "Nothing here was saved. Create an account to keep account memory, files and deal pitches" → links to `/login`, then on to `/trial`.

**2. New public server function `generateDemoIntelligence`** (`src/lib/demo.functions.ts`)
- No `requireSupabaseAuth`, no database reads or writes at all.
- Reuses the existing BEVI system prompt (exported from `trial.functions.ts` so there is one source of truth) with a short demo suffix: no account memory, no prior visits, no reference documents, return empty `targeted_deals`.
- Input validation: venue name ≤ 120 chars, note 20–4,000 chars; anything longer is truncated rather than sent.
- Same Gemini call + JSON parse + 429/402 error handling as the real function; errors surface as friendly in-page messages.
- Abuse control appropriate to a public endpoint: strict input caps, one in-flight request per client (button disabled while running), and a client-side cooldown between generations.

**3. Repoint the public CTAs**
- `LandingPage.tsx` (hero) and `HowItWorksPage.tsx` (hero, pricing cards, closing CTA) change `to="/trial"` → `to="/try"`.
- Logged-in surfaces stay as they are: `DashboardPage`, `MobileCompanionPage`, `VisitDetailPage` keep linking to `/trial`.
- Add `/try` to `sitemap[.]xml.ts` with its own `head()` metadata (title, description, og/twitter, canonical).

## Technical notes

- `/try` is a public route, so no `requireSupabaseAuth` middleware anywhere in its chain and no loader calling a protected function — the demo function is called from the component on click via `useServerFn`.
- `SYSTEM_PROMPT` moves to an exported const (or a shared `src/lib/bevi-prompt.ts`) so demo and real trial never drift.
- The demo reuses the existing `AiOutput` type; the page just renders a subset of it.
- No schema changes, no migrations, no new tables.
