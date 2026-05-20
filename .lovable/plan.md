## Goal

The current `src/assets/bevi-logo.png` (used by `BeviMark`) has a solid black background, so it shows as a black square over glass/nav surfaces instead of sitting flush on the page. Strip the background so the gradient B + dot tail float on transparency.

## Change

1. Run `imagegen--edit_image` on the existing `src/assets/bevi-logo.png` with `transparent_background: true`, writing back to `src/assets/bevi-logo.png` (PNG, transparent).
2. Do the same for `public/favicon.png` so the browser tab icon is also transparent (looks correct in both light and dark tab bars).
3. Leave `public/og-image.jpg` alone — social cards need an opaque background; the dark navy backdrop there is intentional.

No code changes needed — `BeviMark.tsx` already renders the PNG via `<img>` and will pick up the transparent version automatically. No layout, sizing, or styling changes.

## Verification

- Reload `/` and confirm the mark in the top nav sits on the glass panel with no black box around it.
- Check the favicon in the browser tab.
- Spot-check `/dashboard` and `/mobile` where the mark also renders.
