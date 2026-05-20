## Context

`BeviMark` is already imported in every shell surface: `TopNav` (site header), `LandingPage` (hero), `TrialPage` (header), `DashboardPage` (section heading), `MobileCompanionPage` (footer). The new transparent PNG is cropped to its non-square bounding box (the dot tail extends out the lower-left), so the current `BeviMark` — which forces `width = height = size` — squishes it slightly and undersizes the visible mark.

There is no dedicated "sidebar" component or "login" page in the project. The closest matches are:
- **Sidebar** → the left "Accounts" column inside `TrialPage` (no logo there today).
- **Login** → the `Sign in` link in `TopNav` (no dedicated screen).

I'll treat the request as "make the transparent logo render correctly everywhere it appears, and add it to the trial sidebar header for parity." If you actually want a new dedicated login page or a different sidebar, say so and I'll split that off.

## Changes

### 1. `BeviMark.tsx` — respect intrinsic aspect ratio

Stop forcing a square box. Render with `height: size`, `width: auto`, so the cropped PNG keeps its true proportions and the visible mark fills the intended height across every surface. Keep the existing API (`size`, `animated`) so no callers change.

### 2. `TopNav.tsx` — header polish

- Bump `BeviMark` from `size={36}` → `size={32}` (the new mark reads bigger because the tail clears the bounding box, so a slightly smaller height balances the wordmark).
- Keep the wordmark and tagline as-is.

### 3. `TrialPage.tsx` — sidebar header

- Add a small `<BeviMark size={18} animated={false} />` next to the "Accounts" sidebar header at line ~240 so the sidebar gets brand presence (currently just a `SignalLabel`).
- Leave the page-header mark at `size={40}`.

### 4. `DashboardPage.tsx` — section heading

- Leave existing `size={20}` usage — already correct.

### 5. `MobileCompanionPage.tsx` — footer

- Leave existing `size={14}` — already correct.

No changes to landing hero, mobile, routing, or copy.

## Verification

- Reload `/`, `/trial`, `/dashboard`, `/mobile` and confirm the mark sits crisply on the glass surfaces with no black box.
- Confirm the TopNav logo aligns with the BEVI wordmark baseline.
- Confirm the trial sidebar shows the small mark next to "Accounts".
