## Render account-search dropdown in a portal

The previous z-index fix didn't work because the sibling "New account" `GlassCard` uses `backdrop-filter` (via `.glass` / `gradient-border`), which establishes its own stacking context. Sibling stacking contexts paint in DOM order regardless of the dropdown's `z-50` when the parent search card's positioned context can't propagate above a later sibling's backdrop layer.

The bulletproof fix is to render the dropdown into a **React portal** appended to `document.body`, anchored to the search input via `getBoundingClientRect()`. This escapes every parent stacking context.

### Changes (single file: `src/features/trial/TrialPage.tsx`)

1. Import `createPortal` from `react-dom`.
2. In `AccountSearch`:
   - Add a ref on the search-input wrapper.
   - Track `anchor` state `{ top, left, width }` computed from the wrapper's bounding rect.
   - Recompute on `open`, on `window` `resize` and `scroll` (capture phase, passive).
   - Wrap the existing dropdown JSX in `createPortal(<div style={{position:'fixed', top, left, width, zIndex: 60}}>...</div>, document.body)`.
3. Keep current styling tokens (`bg-background/80 backdrop-blur-xl`, cyan accents, dividers) — no visual changes other than now sitting above everything.
4. Revert the `relative z-30 overflow-visible` on the parent `GlassCard` to just `relative` (the portal makes z-index moot).
5. Outside-click handler keeps working: include both the wrapper ref AND the portal node ref in its check, so clicking inside the dropdown doesn't close it.

No data, routing, or other component changes.
