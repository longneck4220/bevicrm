### What's happening
In `src/features/shared/TopNav.tsx`, the email and the Admin badge are wrapped in the same `<span>` that has `truncate max-w-[160px]`. CSS truncation applies to the whole span's text, so "Admin" gets clipped to "AD…".

### Fix
Split into two siblings inside a flex container:
- `<span>` (truncates) → email only
- `<span>` (no truncate, `shrink-0`) → Admin pill, rendered only when `isAdmin`

Result: the email truncates with an ellipsis if too long; the Admin pill always renders in full.

No other changes.