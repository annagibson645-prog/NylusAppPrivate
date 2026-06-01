# Research Nav Fix — Design

**Date:** 2026-06-01
**Status:** Approved

## Problem

Three user-reported symptoms on the research feature and dashboard:

1. The **Research tab disappears** from the desktop top nav when not on `/hubs` —
   specifically it is absent on the Dashboard.
2. The **top nav bar on `/research` is squished to the left** (no spacing, links
   crammed together) on both desktop and mobile.
3. On mobile, the research page's top nav and page header **do not pick up dark
   mode**.

## Root Cause

The app has **three separate nav components** that drifted out of sync:

- `C2Header` (inside `components/ConstellationV2.tsx`) — the Dashboard/galaxy nav.
  Its item list is hardcoded and **omits Research**. → symptom 1.
- `NavG` (`components/NavG.tsx`) — used by hubs, collisions, etc. Inline-styled,
  self-contained, theme-aware. Already includes Research.
- `Nav.tsx` (`components/Nav.tsx`) — used **only** by the two research pages.

`Nav.tsx` is built entirely on **Tailwind utility classes** (`flex gap-4 px-4
hidden sm:flex h-12`). But Tailwind is **never compiled**: `postcss.config.mjs`
registers `@tailwindcss/postcss` (Tailwind v4), yet `app/globals.css` never does
`@import "tailwindcss";`. Verified: the served CSS contains **zero** utility
classes. So every Tailwind class in `Nav.tsx` produces nothing — the nav
collapses to raw inline links crammed top-left. → symptoms 2 and 3 (layout and
breakpoint/visibility classes are dead; only inline `style` colors survive).

`NavG` and the constellation views look fine because they use inline styles, not
Tailwind utilities.

## Decision

**Option B — scoped fix.** Remove the research pages' dependency on the broken
`Nav.tsx` by switching them to the already-correct `NavG`, and add Research to
the Dashboard's `C2Header`. Do **not** globally enable Tailwind (`@import
"tailwindcss"`) in this change — that risks activating half-written utility
classes across many unrelated screens and belongs in its own pass.

## Changes

1. **`app/research/page.tsx`** and **`app/research/[slug]/page.tsx`**
   - Replace `<Nav />` with `<NavG active="Research" />`.
   - Drop the dead Tailwind padding classes added in the prior commit
     (`px-4 sm:px-10 lg:px-16 ...`). Use inline responsive padding via `clamp()`,
     e.g. `padding: "56px clamp(20px, 5vw, 64px) 160px"`.
   - Remove the now-unused `Nav` import.

2. **`components/ConstellationV2.tsx` — `C2Header` items array**
   - Insert `{ n: 'Research', idx: '03', route: '/research' }` and renumber the
     trailing items (Essays 04, Collisions 05, Sparks 06).

3. **Mobile behavior — verification only, no new code.**
   - On mobile NavG auto-hides (`@media (max-width: 767px) { .navg-root { display:
     none } }`) and the existing bottom `MobileNav` (already has Research) takes
     over.
   - The research body is `.void-page` (dark `#08070e` by default), so dark mode
     is intact once the broken top `Nav.tsx` is removed.

## Out of Scope (flagged, not fixed)

- The global "Tailwind never imported" issue still leaves `app/sources/page.tsx`,
  `app/timeline/page.tsx`, and `app/essay/[slug]/page.tsx` with dead utility
  classes. Needs a dedicated review before flipping Tailwind on.
- `components/Nav.tsx` becomes unused after this change; deleting it is optional
  cleanup, not required here.

## Verification

- Preview at 1280px: Dashboard top nav shows Research; `/research` top nav (NavG)
  is properly spaced.
- Preview at 375px: `/research` shows the bottom MobileNav with Research, dark
  background intact, no squished top bar.
