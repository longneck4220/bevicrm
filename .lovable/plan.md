## What I found

The dev server is healthy and `/` returns a full 200 response with the landing page HTML and copy intact. The actual runtime issue is a **React hydration mismatch** thrown by `src/features/shared/ParticleField.tsx`: it calls `Math.random()` inside `useMemo` during render, so the server-rendered particle positions never match the client-rendered ones. React logs:

> "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up."

When this happens on the landing hero, React can bail out of hydrating that subtree, which on slower preview refreshes shows up as a blank / "preview not built" screen until the client takes over.

## Fix

Make `ParticleField` deterministic so SSR and client agree.

1. Replace `Math.random()` with a small seeded PRNG (mulberry32) keyed off `count` (and an optional `seed` prop), so the particle array is identical on server and client.
2. Keep the existing visual look — same count, same size/opacity ranges, same motion — only the numeric source changes.
3. No other files need changing. `OctopusOrb` is already deterministic. The landing page, mobile, and how-it-works pages all consume `ParticleField` and benefit automatically.

## Out of scope

- No design changes, no new dependencies, no route changes.
- Not touching SSR wrapper, auth, or Supabase.

## Technical detail

`ParticleField.tsx` becomes:

```ts
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

Particles are generated with `mulberry32(seed ?? count * 9301 + 49297)` instead of `Math.random()`. Output stays in the same ranges, so the visuals are indistinguishable.
