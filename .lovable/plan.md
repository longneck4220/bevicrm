# Role-based access: admin, manager, rep

Three roles decide where people land after signing in and which screens they can open. Roles stay in the existing secure permissions list (not on the profile record), so nobody can promote themselves.

## Roles

- `rep` — the default for every new sign-up. Sees the rep dashboard and the visit-note flow.
- `manager` — sees the team overview at `/manager`.
- `admin` — sees everything, including the admin page.

Everyone currently marked as the old generic "user" role is treated as a rep. Your admin account stays admin.

## Where people land after signing in

| Role | Lands on |
| --- | --- |
| admin | `/admin` |
| manager | `/manager` |
| rep (or no role yet) | `/dashboard` (rep view) |

If someone followed a link to a specific page before signing in, they still go to that page when their role allows it.

## Who can open what

- `/manager` — manager and admin. A rep who types the address is sent to their own dashboard.
- `/admin` — admin only. Anyone else is sent to their own view.
- `/dashboard` and the visit-note flow — rep and admin. A manager who lands there is sent to `/manager`.
- While the role is still loading, the page shows the existing "Loading…" state rather than flashing the wrong screen.

## Admin page additions (existing dark BEVI styling)

Two new blocks on the current `/admin` page, above the users and accounts list:

1. **User management table** — Email · Role · Date joined, with a dropdown per row to switch someone between rep, manager and admin. The change saves the moment it's picked, with inline confirmation and an error message if it fails. You cannot remove your own admin role (prevents locking yourself out).
2. **Invite a manager** — one email field and a "Send invite" button that emails a sign-in link. Confirmation text appears beneath: "Invite sent to [email]". The invited person starts as a rep; you assign manager from the table above once they appear.

The page header already shows the signed-in identity through the top bar; a sign-out control is confirmed present on every view.

## Sign out everywhere

- Rep views: already available in the top bar and menu — unchanged.
- Admin page: uses the same top bar — unchanged.
- Manager pages: the global top bar is hidden there, so a small "Sign out" link is added to the right of the manager name in the manager header bar.

## Technical notes

- Migration: extend the `app_role` enum with `manager` and `rep`; update `handle_new_user()` to insert `rep` for new sign-ups; add a `set_user_role` security-definer function (admin-only, guarded by `has_role`) that replaces a user's role row. Existing `user` rows are migrated to `rep`.
- `use-auth.tsx` gains a `role` value ("admin" | "manager" | "rep" | null) derived from the existing `user_roles` read, plus `roleLoading`; `isAdmin` is kept for current callers.
- Add a small shared helper `homeForRole(role)` used by `login.tsx` (password + Google/Apple paths), `reset-password.tsx` and `_public.tsx` so all redirects agree.
- Guards live in the route layouts: `src/routes/_authenticated.tsx` keeps the session check; per-area checks go in `manager.tsx`, `admin.tsx` and `dashboard.tsx`/`trial.tsx` via a shared `<RequireRole allow={[...]}>` wrapper that redirects with `<Navigate>`. The dev-only `/manager` bypass is preserved.
- New server functions in `src/lib/admin.functions.ts`: `adminSetUserRole({ userId, role })` and `adminInviteManager({ email })` — both re-verify admin via `has_role` before using the service-role client (`inviteUserByEmail`). Role list in `listUsersForAdmin` returns each user's single role instead of only `is_admin`.
- Verification: typecheck, production build, and Playwright sign-in as an admin plus a rep-role account to confirm the redirects and blocks.
