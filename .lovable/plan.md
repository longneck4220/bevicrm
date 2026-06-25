Remove the metrics strip (Conversations parsed / Signals surfaced / Avg. response window / Deals advanced) from the landing page. The numbers are placeholder data and add no value.

### Changes
- `src/features/landing/LandingPage.tsx`: delete the stats section (the third `<section>` containing the four-stat grid with sparkline SVGs) and any helper data/imports used only by it.

No other pages reference these stats.