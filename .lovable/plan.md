# Plan: Auto-apply library files to every BEVI generation

The library already extracts text from PDF / XLSX / PPTX / DOCX at upload time and stores it on `library_files.extracted_text`. Today that text only reaches BEVI when the rep manually clicks "Attach" on each file before generating. This plan makes it automatic.

## Behavior

When `generateVisitIntelligence` runs for an account, server-side it pulls in:

1. **Account-pinned files** — every `library_files` row with `account_id = <this account>` (e.g. that venue's range card, account plan, pricing letter).
2. **Global files** — every `library_files` row with `account_id IS NULL` (e.g. master price list, current promo deck, range deck) — these apply to every account.

These are injected into the BEVI prompt as a new "Reference documents on file" section, between prior visit history and the rep's pasted supporting context. The rep's manually-attached files (from the existing Attach button) still work and remain additive.

## Token / cost guardrails

PDFs and decks can be long. To keep the prompt bounded:

- Cap per-file text at **15,000 chars** (truncate with a `…[truncated]` marker).
- Cap total auto-included text at **60,000 chars** across all files combined. Account-pinned files are added first; global files fill remaining budget. Anything over the budget is listed by name only ("not included — over budget").
- Skip rows where `extracted_text` is empty.
- Order: account-pinned first (newest first), then global (newest first).

Gemini 2.5 Flash via Lovable AI handles this easily; estimated extra cost is a few cents per visit at the cap, and most accounts will be well under it.

## Change set

**File:** `src/lib/trial.functions.ts` → `generateVisitIntelligence` handler

After the prior-visits fetch, add a query:
```ts
const { data: libFiles } = await supabase
  .from("library_files")
  .select("id, name, file_type, account_id, extracted_text, created_at")
  .or(`account_id.eq.${data.accountId},account_id.is.null`)
  .order("created_at", { ascending: false })
  .limit(40);
```
RLS already restricts to the current user's rows.

Build a `referenceDocsBlock` string by:
1. Sorting account-pinned first.
2. Walking files; for each with non-empty `extracted_text`, slice to 15,000 chars, append `--- File: <name> (<pinned|global>) ---\n<text>` until the 60,000-char budget is exhausted.
3. List remaining filenames under `Also on file (not included — over budget): <name1>, <name2>, ...` so BEVI knows they exist and can ask the rep to attach manually.
4. Empty case → `(no reference documents on file)`.

Inject into `userPrompt` between the prior-visit history and the supporting-context section.

**System prompt tweak** (`SYSTEM_PROMPT` operating philosophy):
> - When reference documents are on file (price lists, promo decks, range cards, account plans), treat them as the authoritative source for products, pricing, and promo mechanics. Cite the file name when you use a fact from it. Never invent SKUs, prices, or promo terms that are not in the documents or the rep's note.

## Out of scope

- No new tables, no schema migration.
- No UI changes — this is purely backend prompt enrichment. (The library panel and manual Attach button stay as-is for cases where the rep wants to pin a one-off file just for this visit.)
- No semantic search / embeddings — flat text injection is enough at this scale. If the library grows past a few hundred docs per account we'd revisit with a retrieval step, but that's a later problem.

## Verification

- Upload a PDF price list pinned to an account → run a generation with a thin note → confirm BEVI references products/prices from the PDF.
- Upload a global promo deck (no account) → run a generation on any account → confirm BEVI references the promo.
- Upload enough text to exceed the 60k budget → confirm the over-budget file appears in the "Also on file" list and the prompt stays bounded.
