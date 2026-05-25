
## Goal

Replace the demo data on `/dashboard` with the real visits you've recorded in the Trial flow, and give every past call its own permanent page you can return to.

## What changes

### 1. New server function: `listVisits`
In `src/lib/trial.functions.ts`, add an auth-protected server fn that returns the signed-in user's visits joined with account info, newest first. Returns: `id`, `account_id`, `account_name`, `account_contact`, `created_at`, `rating`, and the parsed `ai_output` (next_best_move, commercial_signals, etc.).

### 2. Rebuild `/dashboard` against real data
`src/features/dashboard/DashboardPage.tsx` becomes a live view of your recorded visits:

- **Header** — keep "Sales Intelligence Dashboard" H1; subline becomes a live count ("12 visits logged · 4 high-confidence moves").
- **Today's next moves** — top 4 visits ranked by recency + `next_best_move.confidence` (High > Medium > Low) + `commercial_posture` (Push/Recommend ranked above Hold/Suggest). Each card shows account name, the recommendation, the specific ask, confidence, posture, and a link to the visit detail page.
- **Priority accounts** — accounts grouped from your visits, sorted by risk derived from latest visit's `risk_flags` count (high if ≥2, medium if 1, low if 0). Click → trial page with that account preselected.
- **Recent visits** (replaces "Follow ups due") — chronological log of every visit: date, account, one-line recommendation, rating chip, "Open →" to detail page.
- **Empty state** — if no visits yet, friendly card pointing to `/mobile` or `/trial` to record the first one.

Uses `useQuery` + `listVisits`, with the `_authenticated` gate already in place.

### 3. New route: visit detail page
- Route file: `src/routes/_authenticated/visit.$id.tsx`
- Component: `src/features/visit/VisitDetailPage.tsx`

Shows the full saved intelligence for one past call: account header, when recorded, the next best move block, commercial signals (buying style, risk flags, margin, opportunities), the combined CRM note, the follow-up email (copyable), missed opportunity, and the raw note + supporting context collapsed. Includes "Back to dashboard" and "Open account in Trial" links.

Backed by a `getVisit(id)` server fn that fetches one visit (RLS already scopes to owner).

### 4. Mobile companion uses real "today's stops"
`src/features/mobile/MobileCompanionPage.tsx` swaps the demo `conversations` array for the 3 most recent real visits via the same `listVisits` fn. Each card links to `/visit/$id` instead of the demo conversation route.

## What stays the same

- No schema changes — `visits` + `accounts` already store everything we need.
- Trial recording flow untouched.
- Visual design, tokens, glass cards, and gradients all preserved.
- The old demo `/conversation/$id` route stays for now (not removed in this pass).

## Technical notes

- All reads go through `createServerFn` + `requireSupabaseAuth`; no client-side `supabase.from(...)` calls added to the dashboard.
- Sort/ranking is computed client-side from the returned list — no extra DB indexes needed.
- `ai_output` is typed as `AiOutput | null` and the UI safely handles older visits where it might be missing.
