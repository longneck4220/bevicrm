### Goal
On `/trial`, remove the large **Account memory** card and the left sidebar. Put the **Accounts** search card and the **New account** card side-by-side in the slot where Account memory used to be. Keep all existing functionality (search/select, add account).

### Changes — `src/features/trial/TrialPage.tsx`

1. Drop the two-column grid wrapper (`grid lg:grid-cols-[280px_minmax(0,1fr)]`) and the `<aside>` sidebar.
2. Drop the **Account memory** `GlassCard` (lines ~320–348). Also drop the related state plumbing that's now unused on this page: `memoryDraft`, `memoryDirty`, `handleSaveMemory`, the memory-related effect reset, and the `memoryDirty` save-before-generate branch in `handleGenerate`. (Server `updateAccountMemory` is still used by `handleAdoptMemory` after intelligence runs — keep that.)
3. In the main column, render a new top row:
   ```
   grid md:grid-cols-2 gap-4
     ├─ Accounts card  (existing GlassCard with AccountSearch — unchanged internals)
     └─ New account card (existing GlassCard with name/contact inputs + Add account button — unchanged internals)
   ```
4. Keep everything below unchanged in order: **File library → Supporting context → Post-visit note → Output**.
5. Header (BeviMark + "Post-visit intelligence" + H1) stays as-is.

### Out of scope
- No copy changes, no styling overhaul, no changes to LibraryPanel, AccountSearch, or the AI pipeline.
- Account memory editing UI is removed from this page; the field still exists in DB and is still updated via "Adopt memory" after generation.
