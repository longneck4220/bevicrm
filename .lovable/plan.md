## Goal

Adopt the freshly uploaded brand-book "B" mark as the canonical BeviMark asset across the site and favicon. The new artwork is cleaner, better composed, and isolated on a dark background — a strict upgrade over the current `src/assets/bevi-logo.png`.

## Steps

1. **Copy** `user-uploads://image-5.png` → `src/assets/bevi-logo.png` (overwrite existing).
2. **Remove the dark background** via `imagegen--edit_image` with `transparent_background: true`, writing back to `src/assets/bevi-logo.png` so the mark floats on glass/page surfaces.
3. **Tight-crop** the transparent PNG to its non-transparent bounding box (Python/PIL one-liner) so `BeviMark`'s height-based sizing fills the intended space.
4. **Refresh the favicon**: do the same transparent-background + tight-crop pass on a copy at `public/favicon.png`.
5. **Leave `public/og-image.jpg` alone** — social cards need the opaque dark backdrop.
6. **No code changes** — `BeviMark.tsx` already imports `@/assets/bevi-logo.png` and renders it at `height: size, width: auto`, so every surface (TopNav, trial header + sidebar, dashboard, mobile footer, landing hero) picks up the new asset automatically.

## Verification

- Reload `/`, `/trial`, `/dashboard`, `/mobile`; confirm the new mark sits on glass with no halo or black box, and looks crisp at hero (380px) and nav (32px) sizes.
- Confirm the browser-tab favicon updates.
