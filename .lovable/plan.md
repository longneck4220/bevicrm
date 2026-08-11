# Landing page top bar + "Get a BEVI" email capture

## What changes

### 1. Sticky top bar (marketing pages only)
- BEVI logo stays on the left, anchored to the very top of the page (full-width bar, no floating card inset).
- Right side gets exactly three controls, in order:
  1. **Get a BEVI** — filled teal pill button (primary action, opens the email-capture modal)
  2. **Sign in** — outlined/ghost button routing to the existing `/login`
  3. **Hamburger** — opens an accordion/sheet menu
- Bar compresses on scroll (72px → 56px) with a hairline border appearing, backdrop blur, per the design system. Motion respects `prefers-reduced-motion`.
- Mobile: same three controls; the hamburger holds all navigation.

### 2. Hamburger menu
Accordion/sheet listing the pages already built:
- Home
- How it works
- Try a visit note
- Dashboard (only when signed in)
- Mobile (only when signed in)
- Admin (only for admins)
- Sign in / Sign out

### 3. "Get a BEVI" email capture modal
- Click opens a centred modal: short heading, one email field, one filled submit button.
- On success it swaps to a confirmation state ("You're on the list" — we'll email `<address>` as soon as your invite is ready), with a Done button, matching the reference flow.
- Validation: trimmed, valid email, max 255 chars, client-side plus server-side. Duplicate submissions are accepted quietly (no "already exists" leak).
- Errors show inline; nothing raw from the backend is shown.

### 4. Lead storage + future Google Sheet/Gmail hookup
- New `waitlist_signups` table in the backend: id, email (unique, lowercased), source, user_agent-free metadata (referrer/utm optional), created_at.
- Public submit path is a server function — no anonymous write access to the table directly; RLS locked down, admins can read.
- Admin page gains a **Waitlist** section: list of signups with a **Download CSV** button.
- A secured export endpoint (`/api/public/waitlist/export`, protected by a shared secret header) is added so a separate Gmail/Google Sheets/Apps Script workflow can pull the same CSV later. I'll request the shared secret when we build it.

## Technical notes
- Nav work lives in a new `src/features/shared/TopNav.tsx` refactor plus a `GetBeviDialog` component; existing `TopNav` usage in `__root.tsx` is preserved.
- Modal uses the existing shadcn dialog primitives; success state is local component state.
- Migration creates the table with explicit GRANTs (service_role full, no anon/authenticated write), RLS enabled, admin-read policy via `has_role`.
- Insert goes through a `createServerFn` using the service-role client after Zod validation, so the public form never needs table-level grants.
- CSV export builds text server-side; admin route is behind the existing `_authenticated` + admin gate.
- No changes to Dashboard, Mobile, Trial, or Login internals beyond the nav.
