# Restore the pre-V2 marketing look

You pick the checkpoint in History; I verify afterwards and re-apply anything app-side that the rollback takes with it.

## Step 1 — You choose the version (History tab)

The V2 homepage rebuild landed on 28 Jul 2026 as "Rebuilt homepage V2 marketing". So the safe pre-V2 state is the **last version dated 28 July that comes before that entry** — the run of "Changes" entries immediately above it.

Open History, hover the versions from 28 Jul, and restore the newest one whose homepage still looks like what's live at bevicrm.lovable.app right now (old hero, no "Win the next call." hero with the typing animation, no "SITS ABOVE" chip strip).

## Step 2 — I verify what came back

After you restore, I load the preview and confirm:
- `/` renders the pre-V2 homepage, no console errors
- `/try`, `/how-it-works`, `/dashboard`, `/mobile`, `/login` all still render
- build is clean

## Step 3 — I re-apply the app-side fixes the rollback undoes

A History restore rolls back the whole project, not just marketing. These landed **after** V2 and would be lost, so I re-apply them (marketing surface untouched):

1. **AI generation fix** — removal of the abandoned Anthropic/Claude switch and the consistent `google/gemini-3.6-flash` model ID across `trial.functions.ts`, `demo.functions.ts`, `library.functions.ts`. Without this, visit generation fails with "AI service error" on every call. Non-negotiable.
2. **Pricing section removal** from `/how-it-works` — only if you still want it gone.
3. **Formatting pass** (the eslint --fix run) — cosmetic, optional.

I'll check each against the restored state before touching anything, and report which were actually lost.

## What this does not do

- No database or schema change — V2 was marketing-only, so there is no data risk.
- Nothing goes live until you publish. The restore affects the preview first.

## Notes

If the version you restore turns out to be wrong, History is itself reversible — the newer versions stay listed and can be re-applied.
