## Problem

Two features rely on browser APIs that fail in the environments you're using:

- **Copy CRM note / email** uses `navigator.clipboard.writeText`, which silently rejects in the Lovable preview iframe (no `clipboard-write` permission) and in some mobile browser contexts. The button flips to "Copied" (state updated before the promise rejects) but nothing lands on the clipboard.
- **Dictate** uses the Web Speech API (`webkitSpeechRecognition`). It only exists in desktop Chrome/Edge — **not Safari (any iOS device), not Firefox, and not inside the preview iframe without a `microphone` allow attribute**. On your published site opened on iPhone/iPad Safari, the button either does nothing or errors instantly.

## Fix

Keep the UI unchanged. Replace the two fragile browser calls with cross-browser paths.

### 1. Robust copy (frontend only)

Add a small `copyToClipboard(text)` helper used by both `TrialPage` (`CopyButton`) and `VisitDetailPage` (`copy(...)`):

1. Try `navigator.clipboard.writeText`.
2. On rejection / missing API, fall back to a hidden `<textarea>` + `document.execCommand('copy')` (works in iframes and older Safari).
3. If both fail, surface a visible error ("Couldn't copy — long-press to select") instead of a fake "Copied ✓".

No design change; the button just actually works.

### 2. Reliable dictation via Lovable AI (default STT)

Web Speech API is a dead end on Safari/iOS. Switch to the Lovable AI speech-to-text gateway, which works everywhere the mic does:

- **Client (`TrialPage.toggleDictation`)**: capture mic audio via Web Audio API and encode a WAV blob (per Lovable STT guidance — MediaRecorder chunks break on Safari). Toggle button text stays "🎙 Dictate" / "● Listening — tap to stop".
- **New server function `transcribeAudio`** in `src/lib/trial.functions.ts` (`.middleware([requireSupabaseAuth])`, `method: "POST"`): accepts the WAV as base64, forwards to `https://ai.gateway.lovable.dev/v1/audio/transcriptions` with `model: openai/gpt-4o-transcribe`, returns `{ text }`. Handles 402/429/403 the same way the existing `generateVisitIntelligence` does.
- On stop, upload the WAV, append the returned transcript to `rawNote` (same append semantics as today's `transcriptBaseRef`).
- Show clear errors: mic denied, empty recording, gateway 4xx/5xx.

### 3. Preview iframe caveat (documented, no code)

Even after these fixes, the Lovable preview iframe blocks microphone access. Dictation will work on `bevipvi.com` / `bevicrm.lovable.app` and in a normal browser tab of the preview URL, but not inside the in-editor preview panel. Copy will work in both after fix #1.

## Files to change

- `src/features/trial/TrialPage.tsx` — swap `toggleDictation` to record → upload → transcribe; use new copy helper in `CopyButton`.
- `src/features/visit/VisitDetailPage.tsx` — use new copy helper in `copy(...)`.
- `src/lib/clipboard.ts` (new) — `copyToClipboard` helper with fallback.
- `src/lib/trial.functions.ts` — add `transcribeAudio` server function.

No DB, RLS, or schema changes. No other UI/business-logic changes.

## Verification

- Build passes (`tsgo`).
- On `bevipvi.com`, iPhone Safari: press Dictate → grant mic → speak → stop → transcript appended to note.
- On `bevipvi.com`, desktop Chrome: Copy on a CRM note → paste into Notepad returns the exact note text.
- In preview iframe: Copy works; Dictate shows a clear "mic blocked in preview — open in a new tab" message instead of silently failing.
