# CLAUDE.md — BEVI

Guidance for Claude Code working in this repo. Part 1 is the business and product picture. Part 2 is how to operate safely in this codebase.

---

# PART 1 — THE BUSINESS

## What BEVI is

**BEVI = "Between Visits Intelligence."** It is post-visit intelligence for field sales reps: one messy post-visit note in, five commercial outputs out, in about 90 seconds.

The thesis, in the product's own words: *"You don't lose the deal in the venue. You lose it in the 90 seconds after."* Reps don't forget the meeting — they lose momentum in the gap between follow-ups. BEVI sits in that gap.

Positioning line: **"Win the next call."**

The category claim is deliberately narrow and should be preserved in any copy work:

> A CRM stores the account. A transcriber captures the words. **BEVI interprets the next move.**

Named as adjacent-but-not-competing (the "sits above" strip): Salesforce, Otter, Rhino CRM, Teams, Power BI. BEVI is not trying to replace the CRM or the transcriber — it is the judgement layer between them.

## Who it serves

Field **BDMs** and territory reps in **liquor, beverage, hospitality and FMCG** — on-premise and off-premise, Australian market (A$, "Australian professional tone" is specified in the AI prompt). Customers are venues: pubs, bistros, bottle shops, bars, hotels, restaurants, rooftops, function rooms.

The product is saturated in trade vocabulary and this is a feature, not incidental — it is what makes output credible to a working rep. Terms the system reasons in: front of well, pour cost, margin pressure, ROS (rate of sale), ranging / range review / range deck, SKUs, case deal, fridge placement, promo mechanics, price list, masterfile, account plan, order cycle, sample pack, tasting, back-bar training, volume vs premium trade-offs, pricing support, discount authority, eligibility windows.

**Do not genericise this into generic B2B SaaS language.** The domain specificity is the moat.

## Commercial stage — read this before proposing anything

Founder-led (Matt), currently **pre-revenue and pre-launch**. Running an internal pilot with colleagues, iterating by use case. Two things are still genuinely open:

- **Whether the market is "all field reps" or "just our business."** Do not assume a broad SaaS trajectory in suggestions; it may end up an internal tool. Both outcomes are live.
- **Pricing is aspirational, not live commerce.** The tiers on the pricing page (Free Test Run A$0 · Founding 50 A$32/user/mo · Field Pro A$44/user/mo · Team Pilot A$750/mo for 20 seats) are a stated intent for launch, not revenue being collected today. Don't treat them as fixed, and don't build billing against them without asking.

The gating condition for launch is **functional correctness** — "till ready to launch with all bugs ironed out." That makes production reliability the dominant near-term priority over new features or polish.

## The product model — core concepts

Four concepts carry the whole product. Understand these before changing anything in `src/lib/trial.functions.ts` or the data model.

**1. The visit.** One field call to one venue. Captures `raw_note` (messy, often dictated), optional `supporting_context` (pasted emails, masterfile rows), and the full generated `ai_output` JSON. Rated good / needs_edit by the rep — a deliberate feedback loop.

**2. Account memory.** The single most important and most easily misunderstood concept. It is **not** a visit log and **not** a case file. It is a *rolling front-of-call briefing* — what the rep reads in the 30 seconds before walking in. Deliberately constrained to ~6–8 short lines / 120–160 words, under headings: Overview, Venue type, Buying style, What sells, Sales triggers, Recent deals/chats, Watch-outs, Next focus. It is regenerated each visit and the rep explicitly clicks **"Adopt as new memory"** to accept it — a human stays in the loop. Any change that lets memory grow unbounded or become a transcript archive breaks the product.

**3. The five outputs.** Next best move (with commercial posture Suggest/Recommend/Push/Hold + confidence) · CRM note · follow-up email · missed opportunity · account signals. Plus, for paid/authenticated use: updated account memory and targeted deals.

**4. Targeted deals.** Uploaded price lists, promo decks and range cards are parsed at upload into a structured deals catalog. BEVI picks 1–3 that genuinely fit *this* account and writes a `pitch_line` the rep can say at the end of the call. Grounding rule: deals may **only** come from the supplied catalog, must cite `source_file`, and return `[]` when nothing fits.

## The AI system prompt is the product IP

`SYSTEM_PROMPT` in `src/lib/trial.functions.ts` is the core asset — more so than any UI. It defines BEVI's judgement, not just its formatting. Treat edits to it as product changes requiring the user's explicit sign-off, never as incidental refactors.

Its operating philosophy, which any change must stay faithful to:

- Long-term account growth beats short-term pressure. **Do not force a sale if the context does not support it.**
- Be supportive and suggestive, but challenge the rep when they missed something.
- Recommend the next best *practice*, not just the next sale.
- If information is thin, set `needs_more_info` and ask up to 3 practical questions rather than fake confidence.
- Prior visit history is ground truth for trajectory; uploaded documents are authoritative for products, pricing and promo mechanics — cite the file name, never invent SKUs, prices or promo terms.
- Framing question it applies before deciding: *"What would a top 1% field BDM do here to win long-term in this customer's market?"*

Hard "never" list includes: inventing pricing or supply guarantees, suggesting discounts beyond given authority, pushing volume the note doesn't support, ranging products unlikely to sell in context, implying knowledge it wasn't given — and **never push alcohol irresponsibly**. That last one is a responsible-service guardrail; do not weaken it.

## Surfaces and flows

**Public:** `/` landing · `/how-it-works` (includes `#pricing`) · `/try` — the unauthenticated demo, which runs the real system prompt with a demo suffix, saves nothing, and shows two deliberately locked tiles (account memory, targeted deals) as the upgrade hook.

**Authenticated:** `/dashboard` command centre (ranks today's next moves by confidence + posture + recency; flags accounts with ≥2 risk flags) · `/trial` — **the core workspace** where a visit is actually logged, dictated, enriched with files and generated · `/mobile` one-handed carpark view · `/visit/$id` saved pack · `/admin` user/account admin.

**MCP server:** BEVI is also exposed as an MCP server (`list_accounts`, `get_account`, `list_visits`, `create_account`, `log_visit`), so it can be driven from other agent tools.

**Removed — do not reintroduce:** a `/conversation/$id` route backed by hardcoded mock generic-B2B-SaaS data (Northwind Robotics, Helios Freight, a fabricated "$2.84M pipeline") survived from the project's original generic build and was deleted. If you meet it in git history or an old branch, it is not product — don't restore it, and don't use it as a reference for how BEVI works.

---

# PART 2 — OPERATING IN THIS REPO

## Verification comes first — state it before you start

**This is the top rule. It outranks speed.** A live beta with real colleagues is running on this codebase; a broken build or a disturbed UI is a credibility cost, not just a bug.

**Before making any change, say how you will verify it.** One line, up front, in the same message where you propose or begin the work. Not "I'll test it after" — the actual mechanism: *"I'll confirm this by loading the tokenised preview and checking the /try flow generates + console is clean."*

**If you cannot verify it, say so before doing the work, not after.** Do not proceed on hope and hand back something unverified with a hedge attached. Stop and agree a better way of operating first — that might mean installing dependencies, adding a script, testing a different layer, or the user checking something manually. An honest "I can't prove this works, here's what I'd need" is worth more than a confident guess.

**Then actually loop back and check.** After the change, re-run the verification you named and report what you observed. Re-grep after removals. Re-read what you edited if it was hand-modified. Never say "done" on the basis that the edit tool reported success — that only proves text changed, not that anything works.

### What verification is actually available here

Know these before promising anything:

- **No local build or typecheck.** `node_modules` is not installed in worktrees, so `tsc`, `vite build` and `eslint` cannot run locally. Never claim a local typecheck. If a change needs one, install deps first or use the signal below.
- **Lovable's sync is the build signal.** Lovable rebuilds on push to `main`. Call `get_project` and check `latest_commit_sha` matches your commit, `status` is `ready`, and `error` is null. That is real evidence the project compiles.
- **The tokenised preview is the functional test, and it is safe.** `get_project` returns an `embed_url` containing a `__lovable_token`. Load that in the Browser pane to exercise the synced build. **Preview ≠ published** — testing here does not touch the live site, so prefer it for everything. (The bare preview URL without the token bounces to a Lovable login; use `embed_url` and note the token expires, so refetch it.)
- **Browser checks that matter:** `read_console_messages` with `onlyErrors` for runtime breakage, `get_page_text` / `read_page` for content and structure, and driving the real flow (fill the form, click the button) for anything touching an external API.
- **Grep before and after** for any removal or rename, to prove nothing still references it.

### Protecting the live UI/UX

The user's explicit concern: changes must not disturb the functionality or look of the app that is live.

- **Check consumers before editing anything shared** — `src/routes/__root.tsx`, `src/styles.css`, `TopNav`, `features/shared/primitives`, and the AI system prompt are all load-bearing across many surfaces. Grep for usages first; a "small" edit there is not small.
- **Prefer additive and isolated changes** over edits to shared surfaces when both would work.
- **After anything that could affect rendering**, load the preview and confirm: no console errors, the key routes still render (`/`, `/try`, `/how-it-works`), and the thing you changed looks right. Removals should degrade cleanly — e.g. a deleted route should 404, not crash.
- **Scope the diff to the request.** If you notice unrelated problems, report them rather than fixing them in the same change.

### Standing instruction — the audit phrase

If the user says any version of:

> *"please go back and verify all your work so far. Make sure you used the best practices, were efficient and didn't introduce any issues"*

…treat it as a directive to **stop producing new work and audit what already exists.** Re-read the actual current state of every file touched (don't rely on memory of what you intended), verify each change against the mechanisms above, and report honestly — including anything you cannot confirm, anything unverified, and anything you'd do differently. Finding and admitting a real problem is a success here; a clean "all good" that wasn't actually checked is a failure.

The user reaching for this phrase is a signal the loop has gotten too noisy. Take it as feedback to verify more thoroughly up front, not just to run one audit.

## V1 and V2 are different things — keep them separate

These are two distinct tracks with different purposes. Conflating them has already caused a production incident (see below).

**V1 — the working product.** This repo's `main`, synced to the Lovable project **"BEVI: Sales Clarity"** (`5282df77-1c77-4b51-b681-b8b573d7377c`), published at **bevicrm.lovable.app → bevipvi.com**. This is the live beta real colleagues are using. **Functionality is proven here**, driven by use-case beta testing and bug fixing. Treat it as production: correctness first, minimal surface area, no speculative changes.

**V2 — the aspirational end-state.** The separate Lovable project **"BEVI CRM V2"** (`b6e34a33-04f2-45eb-a95c-96b266cca915`), unpublished. V2 is the **brand and experience target**: landing pages, look and feel, workflow shape, CTAs. It is *not* where functionality gets proven.

**The intended flow between them:** V1 perfects the functionality through beta testing → once functionality is settled, **V1 informs V2's final form**. V2 is the destination, V1 is how you learn what belongs there. Work on brand/experience direction belongs in V2; work on making the product actually work belongs in V1. Do not merge V2 marketing work into V1's `main` without an explicit instruction.

## Live-deployment rules

- `main` is what the Lovable project syncs from. **Lovable's "Publish" is a separate manual step from git sync** — code can be on `main`, and visible in Lovable's preview, without being live. Never infer one state from the other; check both.
- **Before reasoning about what's live, look at what's actually deployed** — fetch `get_project` and view the rendered site. Do not infer the live version from commit messages, branch names, diffs, or the Lovable project's auto-generated `description` field (that description is stale and describes an old "octopus / ambient intelligence" concept that is not the current product — ignore it).
- Most commits are auto-generated "Changes" from Lovable's own agent and are **not** cleanly scoped to one concern. A single commit range has mixed an unrelated real bug fix in with a marketing rebuild. Never assume a commit boundary equals a feature boundary.
- `main` is GitHub-protected (pushes currently succeed via owner bypass). Treat every direct push to `main` as deliberate and narrate it; never do it silently.
- **Ask before deploying to production**, even when a fix is clearly correct.
- Check `.lovable/plan.md` early — prior sessions leave real planning context there.

## Incidents worth not repeating

**The V1/V2 branding revert.** A session tried to separate "V1" from "V2" by reading git history and reverting to an inferred merge-base. The inference was wrong — the assumed "clean V1" commit already contained the supposedly-V2 content (present since the project's creation), and the actual live site was newer than the revert target. Result: an unnecessary production change that had to be manually undone.
**Rule:** when the user raises a "which version is live / don't lose this" concern, ask them to *point at* the safe version — a screenshot, a date, a commit, or "whatever's live right now." Do not reconstruct the boundary from history.

**The AI generation outage.** Visit generation failed with "AI service error" on every call. Root cause was an abandoned experiment to add a Claude/Anthropic provider switch: Lovable's gateway has no Anthropic passthrough, so `anthropic/claude-sonnet-5` was never valid. It was patched in one call site and left inconsistent in others, so `demo.functions.ts` and `library.functions.ts` sat on a stale model ID.
**Rules:** (a) all AI calls go through the **Lovable AI Gateway** only — there is no direct-provider path, don't reintroduce one; (b) the model ID must be **consistent across every call site** — currently `google/gemini-3.6-flash` for generation, deal extraction and the demo, plus `openai/gpt-4o-transcribe` for dictation. A partial fix across call sites is how this broke in the first place.

## Technical facts worth knowing

TanStack Start (server functions) on Cloudflare Workers · Supabase for auth, Postgres with owner-scoped RLS, and a private `library` storage bucket · synced from Lovable.

Tables: `accounts` (incl. the `memory` text field) · `visits` · `library_files` (with pre-extracted `deals` jsonb; `account_id` null = global file, set = pinned to one venue) · `profiles` · `user_roles` (`admin` | `user`).

Document text extraction is **local, not model-based**: `unpdf`, `mammoth`, `xlsx`, `jszip`. Images are stored but not text-extracted.

Retrieval budgets in `generateVisitIntelligence` — last 5 visits, up to 40 files, 15k chars/file, 60k total, 200 deal lines. These exist to control cost and context size; changing them has both quality and billing consequences.
