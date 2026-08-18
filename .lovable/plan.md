# Protect account memory from silent overwrite

Today "Adopt as new memory" writes the AI's proposed memory straight over the account's accumulated memory. No preview, no confirmation, no way back. This plan makes every memory change reviewable, editable, and reversible.

## What the rep will see

1. **Review before saving.** "Adopt as new memory" opens a review step instead of saving immediately:
   - Left: the account's **current memory** (what will be replaced).
   - Right: the **proposed memory**, in an editable field so the rep can merge — keep lines from the old memory, delete anything wrong, tweak wording.
   - Buttons: **Save memory** (primary) and **Cancel**. Nothing is written until Save is pressed.
2. **History and undo.** A "History" view on the memory card lists previous versions with date and who changed them. Each entry can be previewed and **restored** with one click. Restoring is itself recorded as a new version, so nothing is ever lost.
3. **Confirmation state.** After saving, the card shows "Memory updated" plus a "Revert to previous" shortcut for the immediately prior version.

## Technical notes

**Schema (new migration)**

New table `public.account_memory_versions`:
- `account_id` (references `public.accounts`), `owner_id`, `memory` (the snapshot text), `source` (`ai_adopted` | `manual_edit` | `restore`), `visit_id` (nullable, links the version to the visit that produced it), `created_at`.
- GRANTs for `authenticated` and `service_role`; RLS with owner-or-admin read/insert policies matching the existing `accounts` and `visits` pattern. No update/delete policy — versions are append-only.

**Server functions (`src/lib/trial.functions.ts`)**
- Rework `updateAccountMemory` so a single call: reads the account's current memory, inserts it as a version snapshot (if not already the latest snapshot), then updates `accounts.memory`. This makes the previous state recoverable even for the first-ever change.
- Add `listAccountMemoryVersions({ accountId })` — recent versions, newest first, capped.
- Add `restoreAccountMemoryVersion({ versionId })` — snapshots the current value, then writes the chosen version back, with `source = 'restore'`.
- All three use `requireSupabaseAuth`; RLS keeps the rep to their own accounts (admins retain existing access).

**UI (`src/features/trial/TrialPage.tsx`)**
- Replace the direct `onAdoptMemory` save with a review panel inside the ACCOUNT MEMORY card: two-column current/proposed on desktop, stacked on mobile, editable textarea for the proposed side, explicit Save/Cancel.
- Add a collapsible History list fed by `listAccountMemoryVersions`, each row with preview text and a Restore action.
- Keep local `accounts` state in sync after save/restore so the account picker and memory display update without a reload.
- Styling stays in existing design tokens (surface + hairline borders, single filled button per view, 44px touch targets).

**Not changing**: the AI prompt, generation flow, dashboard, or public `/try` demo.
