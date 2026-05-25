## Fix Account search dropdown stacking + polish styling

The dropdown currently slides under the "New account" card because both `GlassCard`s establish their own stacking contexts (backdrop-blur + opaque background), and the search card has no elevated z-index relative to its sibling.

### Changes (single file: `src/features/trial/TrialPage.tsx`)

1. **Stacking fix**
   - Wrap the Accounts `GlassCard` (the search one) in a container with `relative z-30` so its absolutely-positioned dropdown overlays the sibling "New account" card.
   - Add `z-40` to the dropdown panel itself (currently `z-20`) for safety.
   - If `GlassCard` clips with `overflow-hidden`, also pass a wrapper class to let the popover escape — verified by skim, but I'll confirm in build and add `overflow-visible` if needed.

2. **Design-aesthetic polish on the dropdown** (match the rest of the app: deep glass + cyan accent, no off-palette dark hex)
   - Replace the hard-coded `bg-[#0e1117]/95` with a token-driven surface: `bg-background/80 backdrop-blur-xl border-white/10` plus a subtle `shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]` and `ring-1 ring-white/5`.
   - Highlight row uses `bg-white/[0.06]` (matches existing hover patterns) and the active-account left bar uses `border-[var(--brand-cyan)]` (already there — keep).
   - Search input border on focus already uses `--brand-cyan`; keep.
   - Tighten the popover: `rounded-xl`, `mt-1.5`, divide rows with `divide-y divide-white/5`.

No behavior, routing, or data changes. Plan stays scoped to the dropdown layering + visual tokens.
