## Goal

Replace the open trial-mode database with proper email/password authentication, per-user profiles, and an admin/user role system. Admins manage everything; regular users see only the data they own.

## Database changes (single migration)

**1. `profiles` table**
- `id` (PK), `user_id` (unique, references auth.users), `display_name`, `email`, `created_at`, `updated_at`
- RLS: users can select/update their own row; admins can select all
- Trigger `handle_new_user()` auto-inserts a profile row on signup

**2. `app_role` enum + `user_roles` table** (separate table per security best-practice — never store roles on profiles)
- enum: `admin`, `user`
- `user_roles`: `id`, `user_id`, `role`, unique(user_id, role)
- `has_role(_user_id, _role)` SECURITY DEFINER function — avoids RLS recursion
- Trigger assigns default `user` role on signup
- RLS: only admins can insert/update/delete roles; users can read their own

**3. Lock down `accounts` and `visits`**
- Add `owner_id uuid NOT NULL` referencing auth.users (backfill existing rows to a placeholder, then enforce)
- Drop the existing "trial open" permissive policies
- New RLS:
  - SELECT/UPDATE/DELETE: `auth.uid() = owner_id OR has_role(auth.uid(), 'admin')`
  - INSERT: `auth.uid() = owner_id`

**4. Auth config**
- Auto-confirm email enabled (per user choice)
- Signups enabled, anonymous disabled, HIBP password check enabled

## Frontend changes

**Auth pages**
- `src/routes/login.tsx` — sign-in + sign-up tabs (email/password). Uses `supabase.auth.signInWithPassword` / `signUp` with `emailRedirectTo: window.location.origin`.
- `src/routes/_authenticated.tsx` — pathless layout: `beforeLoad` redirects to `/login` if no session; renders `<Outlet />`.

**Auth context**
- `src/hooks/use-auth.tsx` — wraps `onAuthStateChange` (set up BEFORE `getSession`), exposes `user`, `session`, `isAdmin`, `signOut`. Provider mounted in `__root.tsx`.
- Cache invalidation: call `router.invalidate()` + `queryClient.invalidateQueries()` on auth state change.

**Route protection**
- Move `/dashboard`, `/mobile`, `/trial` (and any other gated pages) under `src/routes/_authenticated/`.
- Keep `/` (landing) and `/login` public.

**Data layer**
- Every `accounts` / `visits` insert sets `owner_id: user.id`.
- Queries rely on RLS — no manual `.eq('owner_id', ...)` filter needed but added for clarity.
- Existing trial flows that wrote without a user need a signed-in user; gate the trial CTA behind login or convert it to a signup prompt.

**Header**
- Add sign-in / sign-out button + user email in `TopNav`. Admin badge when `isAdmin`.

## Bootstrapping the first admin

After migration, you sign up normally, then I'll show you a one-line SQL snippet (run in Cloud → Database) to promote your `user_id` to admin. We do NOT seed an admin in the migration (no user exists yet).

## Verification

- Sign up → confirm profile + `user` role rows created automatically.
- Sign in → `/dashboard`, `/mobile`, `/trial` accessible; signed-out users get redirected to `/login`.
- Create an account/visit → confirm `owner_id` is set and another test user cannot see it.
- Promote yourself to admin → confirm you can see all rows.
- Run Supabase linter; resolve any warnings tied to the new tables.

## Out of scope

- Google / social login (you chose email-only)
- Password reset flow (can add later — would need a `/reset-password` route)
- Email branding / custom auth email templates
