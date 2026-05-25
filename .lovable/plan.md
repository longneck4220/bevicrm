## Why upload is failing today

Extraction runs in the browser. PDF uses `pdfjs-dist` with a CDN worker — in the sandboxed preview the worker fetch is blocked, so PDFs throw an "authentication / authority" style error. Excel/PPTX/Word can also fail silently on large files or unusual MIME types. Moving extraction to the server makes it reliable and consistent across PDF, XLSX, PPTX, DOCX.

## What gets built

### 1. Backend — file library (Lovable Cloud)

**Storage bucket** `library` (private). Files stored under `{owner_id}/{file_id}.{ext}`.

**Table** `library_files`:
- `id`, `owner_id`, `account_id` (nullable — null = global library, set = pinned to account)
- `name`, `file_type` enum: `pdf | xlsx | pptx | docx | other`
- `storage_path`, `size_bytes`, `mime_type`
- `extracted_text` (text, indexed for search)
- `created_at`, `updated_at`

RLS: owner-or-admin SELECT / INSERT / UPDATE / DELETE, matching existing `accounts` / `visits` pattern. Storage policies scoped to `auth.uid()` as first path segment.

### 2. Server functions (`src/lib/library.functions.ts`)

- `uploadLibraryFile` — receives `{ name, mime, base64, accountId? }`, decodes, uploads to Storage via `supabaseAdmin`, runs extraction by type, inserts row, returns DTO. Extraction libs (all Worker-safe): `unpdf` (PDF), `mammoth` (DOCX), `xlsx` (XLSX/XLS/CSV), `jszip` + XML regex (PPTX slide text), plain decode (TXT/MD/JSON).
- `listLibraryFiles` — `{ type?, accountId?, search? }` → filtered list (global + account-pinned).
- `deleteLibraryFile` — removes storage object + row.
- `getLibraryFileText` — returns `extracted_text` for attaching to a visit.

### 3. Frontend — Trial page

Replace the current ad-hoc upload area inside "Supporting context" with a **Library panel**:

```text
┌─ Library ──────────────────────────────────────────┐
│  [All] [PDF] [Excel] [PPTX] [Word]   🔍 search…    │
│  ────────────────────────────────────────────────  │
│  ● Q3 Promo Deck.pdf          [Attach] [⋯]        │
│  ● Pricing Sheet 2026.xlsx    [Attach] [⋯]        │
│  ● Activation brief.docx      [Attach] [⋯]        │
│  ＋ Upload                                         │
└────────────────────────────────────────────────────┘
```

- Type chips filter instantly (the "fast CTA").
- "Attach" appends that file's extracted text to the current visit's `supportingContext` and shows it as a chip (same chip UI as today).
- Upload flow: pick file → base64-encode in browser → call `uploadLibraryFile` → server extracts → row appears in list. Toggle "Pin to {account}" before upload to scope it.
- Removes the broken client-side `extractFileText` path; that file gets deleted along with `pdfjs-dist` / `mammoth` / `xlsx` client deps (xlsx + mammoth move to server `package.json`).

### 4. Quick-pick CTAs

Above the library list, render type chips that double as "Recently used by type" quick-attach:
`[Promo deck ▾] [Pricing ▾] [Brief ▾] [Masterfile ▾]` — clicking a chip with one match attaches instantly; otherwise opens the filtered list.

## Technical notes

- Base64 upload through server fn keeps a single auth boundary (no signed-URL round trip needed at this scale). 20 MB cap enforced server-side.
- PPTX extraction = unzip → concat text in `ppt/slides/slide*.xml` via regex on `<a:t>` nodes. Good enough for AI context.
- `unpdf` is the Worker-compatible PDF text extractor (replaces broken `pdfjs-dist` worker setup).
- All errors return friendly strings; raw lib errors only go to server logs (matches existing pattern in `trial.functions.ts`).
- New table + bucket follow the existing RLS pattern (`auth.uid() = owner_id OR has_role(uid, 'admin')`).

## Out of scope

- File preview/download UI (can add later via signed URLs).
- Sharing files between users.
- Re-extracting on demand.
