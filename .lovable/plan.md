## Replace Priority Accounts list with a searchable Rolodex

Swap the current vertical list of priority accounts on the dashboard for a compact, type-to-find "rolodex" — keeping the same glass aesthetic, just denser and search-driven.

### UX

- Section header stays: `SignalLabel` "Priority accounts" with a small count chip on the right (`12 accounts`).
- Below the header, a single `GlassCard` containing:
  - **Search bar** at the top — full-width, borderless input over a subtle inner surface, with a small search glyph on the left and a muted placeholder: *"Type a venue or contact…"*. Auto-focuses on `/` keypress.
  - **Results panel** beneath it — a scrollable area (max-height ~320px, custom thin scrollbar) showing matched accounts as tight one-line rows:
    - `RiskDot` · venue name · muted contact name · muted relative date · `→`
    - Hover: faint white/[0.03] background, cursor pointer, navigates to `/visit/$id` (latest visit for that account).
  - **Empty search state** (no query): show the top 6 priority accounts (current ranking) as the default rolodex view, with a tiny muted hint "Showing top priorities — start typing to search all".
  - **No-match state**: centered muted line "No venues match '<query>'".

### Matching

- Case-insensitive substring match against `account_name` and `account_contact`.
- One row per account (dedupe by `account_id`, keep latest visit).
- When searching: results sorted by name asc. When idle: current risk-ranked top 6.

### Technical notes

- File touched: `src/features/dashboard/DashboardPage.tsx` only. No server, schema, or other component changes.
- Add `useState` for `query`, derive `allAccounts` (dedup map of visits by account, same as today) once with `useMemo`.
- Derive `displayed` = query ? filtered+sorted : `priorityAccounts.slice(0,6)`.
- Use shadcn `Input` (already in project) styled with existing token classes; no new deps.
- Keep `RiskDot`, `GlassCard`, `SignalLabel`, `formatDate`, `visitRisk` helpers as-is.
- Keyboard: `Enter` in the search box navigates to the first result (via `useNavigate`).
