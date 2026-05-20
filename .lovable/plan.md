## Goal

Refine `BeviMark` so it reads as the same brandmark as the uploaded reference: a single sculpted "B" with an S-curve interior and a curling tail of dots flowing out of its lower-left corner. Keep it as an inline SVG so it stays crisp at every size and remains animatable.

## What's wrong with the current mark

- The B is drawn as two stacked rectangular bowls — reads as a generic typeface B, not the reference's flowing form.
- The interior negative space is two boxes; the reference is one continuous S-curve where the upper and lower bowls meet through a sweeping diagonal.
- 17 dots arranged in three concentric rings around the lower-left — reads as a scattered cluster. The reference is a single tail that curls outward, dots graduating from large (near the B) to tiny (at the tip).
- No inner shadow where the curve overlaps itself, so the mark looks flat next to the reference's dimensional shading.

## What we'll change

Single file: `src/features/shared/BeviMark.tsx`. Public API (`size`, `animated`) stays identical, so every existing usage (TopNav, dashboard, mobile, landing) picks the new mark up automatically with no other edits.

### 1. Redraw the B as one sculpted shape

Replace the current path with two layered paths:

- **Outer silhouette**: the rounded B outline — flat left spine, two full bowls on the right that meet flush in the middle (no waist pinch). This is the only shape carrying the cyan→blue→violet gradient.
- **Counter (negative space)**: a single path punched out via `fillRule="evenodd"` that draws the S-curve interior — upper counter sweeps down-right, transitions through a diagonal where the bowls meet, lower counter sweeps up-right. One continuous curve, not two boxes.

This is the structural change that makes the mark recognizable as the reference.

### 2. Add the inner shadow

A second path layered over the B fill, clipped to the silhouette, painted with a dark navy radial gradient at ~35% opacity along the inside of the S-curve. This is what gives the reference its dimensional, "two surfaces folding into each other" feel. Replaces the current cyan sheen highlight, which fights the reference's darker, moodier read.

### 3. Replace the dot cluster with a curling tail

Drop the 17-dot 3-ring layout. New layout: ~14 dots positioned along a single Archimedean-spiral path that starts near the B's lower-left corner (~radius 6) and curls down-and-left then back under (~radius 1.2 at the tip). Dot size and opacity both graduate along the curve so the tail visually "fades into mist" — matching the reference's tapering feel.

Keep the existing `motion.circle` shimmer per dot, but stagger the delay along the spiral so the highlight travels along the tail rather than twinkling randomly. Cheap visual win, same animation cost.

### 4. Gradient tuning

Shift gradient stops slightly to match the reference's color distribution:
- Cyan `#3ED8E0` stays at the top-left of the B
- Mid-tone moves from blue-600 toward a deeper indigo (`#1E3A8A`-ish) so the body has more weight
- Violet endpoint pushes a touch darker (`#4C1D95`) for the bottom-right falloff

Dot gradient stays cyan→violet so the tail visually echoes the body.

## Verification

1. Render `BeviMark` at three sizes used in the app — 14px (mobile footer), 20px (TopNav, dashboard inline), 40px+ (landing/hero) — and screenshot each.
2. Crop the reference and the rendered mark side-by-side at matching sizes; check S-curve counter, tail trajectory, and gradient direction.
3. Confirm at 14px the tail still reads as a tail (dots don't merge or disappear) — adjust min-radius if needed.
4. No other files change; existing layouts should be unaffected.

## Out of scope

- Color tokens in `src/styles.css` — gradient lives inside the SVG.
- Replacing the SVG with the uploaded raster (rejected option).
- Any copy, layout, or routing changes.
