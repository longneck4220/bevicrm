## Goal

Surface the existing **How BEVI Works** page so visitors can reach it without signing in, and add it to the landing page navigation/CTA flow.

## Changes

1. **Move the route out of the auth gate**
   - Delete `src/routes/_authenticated/how-it-works.tsx`.
   - Create `src/routes/how-it-works.tsx` with the same `head()` metadata (title, description, OG/Twitter, canonical) and `component: HowItWorksPage`.
   - Routes auto-regenerate; nothing else to wire.

2. **Link it from the landing page**
   - In `src/features/landing/LandingPage.tsx`, add a secondary CTA in the hero next to "Try a Visit Note" → `<Link to="/how-it-works">How it works →</Link>` styled to match the existing ghost button.
   - Add a "How it works" link in the footer/secondary nav area if present.

3. **Top nav exposure for logged-out users**
   - `src/features/shared/TopNav.tsx` already lists `/how-it-works` in `baseLinks`; confirm it renders for unauthenticated users too (it does — links render regardless of auth). No change needed beyond verifying the route is now public.

4. **Sitemap + SEO**
   - Add `{ path: "/how-it-works", changefreq: "monthly", priority: "0.8" }` to `src/routes/sitemap[.]xml.ts` so the public page is indexable.

5. **Internal "Try" CTAs on the page**
   - `HowItWorksPage` links to `/trial` (auth-gated). Leave as-is — unauthenticated clicks will redirect to login via `_authenticated` layout, which is the desired conversion flow.

## Out of scope

- No content rewrite of the How It Works page itself.
- No design system changes.
- No new auth/role logic.
