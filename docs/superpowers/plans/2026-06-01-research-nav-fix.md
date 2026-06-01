# Research Nav Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Research tab appear on the Dashboard nav and fix the squished/dark-mode-broken top nav on the research pages by replacing the Tailwind-dependent `Nav.tsx` with the inline-styled `NavG`.

**Architecture:** The research pages use `Nav.tsx`, which is built entirely on Tailwind utility classes that never compile (globals.css lacks `@import "tailwindcss"`), so the nav collapses to crammed inline links with no dark-mode layout. Switch both research pages to the already-correct, inline-styled, theme-aware `NavG` (which already includes Research). Separately, add Research to the Dashboard's hardcoded `C2Header` item list inside `ConstellationV2.tsx`.

**Tech Stack:** Next.js (App Router), React, TypeScript. No Tailwind reliance in the touched code. Verification via the Claude Preview MCP (dev server already running on port 3000, serverId `83a69e40-7981-4624-8a9c-fad09ddc84ec`).

---

### Task 1: Add Research to the Dashboard nav (`C2Header`)

**Files:**
- Modify: `components/ConstellationV2.tsx:170-176`

- [ ] **Step 1: Update the `items` array in `C2Header`**

Replace the existing array (currently Dashboard 01, Hubs 02, Essays 03, Collisions 04, Sparks 05 — no Research):

```tsx
  const items: { n: string; idx: string; route?: string }[] = [
    { n: 'Dashboard', idx: '01' },
    { n: 'Hubs',      idx: '02', route: '/hubs' },
    { n: 'Essays',    idx: '03', route: '/essays' },
    { n: 'Collisions',idx: '04', route: '/collisions' },
    { n: 'Sparks',    idx: '05', route: '/sparks' },
  ];
```

with (Research inserted at 03, others renumbered):

```tsx
  const items: { n: string; idx: string; route?: string }[] = [
    { n: 'Dashboard', idx: '01' },
    { n: 'Hubs',      idx: '02', route: '/hubs' },
    { n: 'Research',  idx: '03', route: '/research' },
    { n: 'Essays',    idx: '04', route: '/essays' },
    { n: 'Collisions',idx: '05', route: '/collisions' },
    { n: 'Sparks',    idx: '06', route: '/sparks' },
  ];
```

- [ ] **Step 2: Verify Research appears on the Dashboard nav**

Run (Claude Preview MCP `preview_eval`, serverId `83a69e40-7981-4624-8a9c-fad09ddc84ec`):

```js
(() => { window.location.replace('http://localhost:3000/'); })()
```

Then after load, run:

```js
(() => [...document.querySelectorAll('.c2-nav-lbl')].map(e => e.textContent.trim()))()
```

Expected: `["Dashboard","Hubs","Research","Essays","Collisions","Sparks"]`

- [ ] **Step 3: Commit**

```bash
git add components/ConstellationV2.tsx
git commit -m "Add Research to Dashboard (C2Header) nav"
```

---

### Task 2: Switch `/research` list page from `Nav` to `NavG`

**Files:**
- Modify: `app/research/page.tsx`

Current relevant content:
- Line 3: `import Nav from "@/components/Nav";`
- Lines 17-23:
```tsx
  return (
    <>
      <Nav />
      <div className="void-page">
      <div className="void-ambient" />

      <div style={{ position: "relative", zIndex: 2, maxWidth: "1100px", margin: "0 auto" }} className="px-4 sm:px-10 lg:px-16 pt-12 sm:pt-16 pb-40">
```

- [ ] **Step 1: Replace the `Nav` import with `NavG`**

Change line 3 from:

```tsx
import Nav from "@/components/Nav";
```

to:

```tsx
import NavG from "@/components/NavG";
```

- [ ] **Step 2: Replace `<Nav />` with `<NavG active="Research" />` and drop dead Tailwind padding classes**

Replace lines 17-23 (the `return` opening through the content wrapper `<div>`) with:

```tsx
  return (
    <>
      <NavG active="Research" />
      <div className="void-page">
      <div className="void-ambient" />

      <div style={{ position: "relative", zIndex: 2, maxWidth: "1100px", margin: "0 auto", padding: "64px clamp(20px, 5vw, 64px) 160px" }}>
```

Note: the `className="px-4 sm:px-10 lg:px-16 pt-12 sm:pt-16 pb-40"` attribute is removed entirely — those utilities never compile. Spacing now lives in the inline `padding` using `clamp()`.

- [ ] **Step 3: Verify no build error and nav renders**

Run (Claude Preview MCP `preview_logs`, serverId `83a69e40-7981-4624-8a9c-fad09ddc84ec`, level `error`):
Expected: no new errors referencing `app/research/page.tsx`.

Then `preview_eval`:
```js
(() => { window.location.replace('http://localhost:3000/research'); })()
```
After load:
```js
(() => ({ navg: !!document.querySelector('.navg-root'), labels: [...document.querySelectorAll('.navg-lbl')].map(e => e.textContent.trim()) }))()
```
Expected: `navg` is `true` (desktop ≥768px) and `labels` includes `"Research"`.

- [ ] **Step 4: Commit**

```bash
git add app/research/page.tsx
git commit -m "Use NavG on /research list page; drop dead Tailwind padding"
```

---

### Task 3: Switch `/research/[slug]` detail page from `Nav` to `NavG`

**Files:**
- Modify: `app/research/[slug]/page.tsx`

Current relevant content:
- Line 6: `import Nav from "@/components/Nav";`
- Lines 65-71:
```tsx
  return (
    <>
      <Nav />
      <div className="void-page" style={{ "--domain-color": domainColor } as React.CSSProperties}>
      <div className="void-ambient" />

      <div style={{ position: "relative", zIndex: 2, maxWidth: "820px", margin: "0 auto" }} className="px-4 sm:px-10 lg:px-16 pt-10 sm:pt-14 pb-40">
```

- [ ] **Step 1: Replace the `Nav` import with `NavG`**

Change line 6 from:

```tsx
import Nav from "@/components/Nav";
```

to:

```tsx
import NavG from "@/components/NavG";
```

- [ ] **Step 2: Replace `<Nav />` with `<NavG active="Research" />` and drop dead Tailwind padding classes**

Replace lines 65-71 with:

```tsx
  return (
    <>
      <NavG active="Research" />
      <div className="void-page" style={{ "--domain-color": domainColor } as React.CSSProperties}>
      <div className="void-ambient" />

      <div style={{ position: "relative", zIndex: 2, maxWidth: "820px", margin: "0 auto", padding: "56px clamp(20px, 5vw, 64px) 160px" }}>
```

The `className="px-4 sm:px-10 lg:px-16 pt-10 sm:pt-14 pb-40"` attribute is removed; spacing lives in inline `padding`.

- [ ] **Step 3: Verify a detail page renders with the nav**

First find a valid slug (`preview_eval`):
```js
(() => { window.location.replace('http://localhost:3000/research'); })()
```
After load:
```js
(() => { const a = document.querySelector('a[href^="/research/"]'); return a ? a.getAttribute('href') : null; })()
```
Expected: a string like `/research/<id>` (or `null` if zero reports — in that case skip the per-slug visual check, the import/build check in Step 4 still applies).

If a slug was found, navigate to it:
```js
(() => { window.location.replace('http://localhost:3000' + '<paste the href here>'); })()
```
After load:
```js
(() => ({ labels: [...document.querySelectorAll('.navg-lbl')].map(e => e.textContent.trim()) }))()
```
Expected: `labels` includes `"Research"`.

- [ ] **Step 4: Confirm no build/type error from the change**

Run `preview_logs` (level `error`): expected no new errors referencing `app/research/[slug]/page.tsx`.

- [ ] **Step 5: Commit**

```bash
git add "app/research/[slug]/page.tsx"
git commit -m "Use NavG on /research/[slug] detail page; drop dead Tailwind padding"
```

---

### Task 4: Mobile verification (no code change)

**Files:** none.

- [ ] **Step 1: Resize preview to mobile**

Run Claude Preview MCP `preview_resize` with `preset: "mobile"` (375x812), serverId `83a69e40-7981-4624-8a9c-fad09ddc84ec`.

- [ ] **Step 2: Confirm top NavG is hidden and bottom MobileNav shows Research**

`preview_eval`:
```js
(() => { window.location.replace('http://localhost:3000/research'); })()
```
After load:
```js
(() => { const ng = document.querySelector('.navg-root'); const hidden = ng ? getComputedStyle(ng).display === 'none' : true; const mnav = [...document.querySelectorAll('.mnav-tab .mnav-label')].map(e => e.textContent.trim()); return { navgHidden: hidden, mnav }; })()
```
Expected: `navgHidden` is `true`, and `mnav` includes `"Research"`.

- [ ] **Step 3: Confirm dark background intact**

`preview_eval`:
```js
(() => getComputedStyle(document.querySelector('.void-page')).backgroundColor)()
```
Expected: a dark color (rgb close to `rgb(8, 7, 14)` — i.e. `#08070e`), not a light/parchment value (since no `data-theme="sepia"` is set by default).

- [ ] **Step 4: Capture a screenshot for the record**

Run `preview_screenshot` (serverId `83a69e40-7981-4624-8a9c-fad09ddc84ec`). Confirm: no crammed top bar, content readable, bottom tab bar present.

- [ ] **Step 5: Reset viewport to desktop**

Run `preview_resize` with `width: 1280, height: 800`.

---

### Task 5: Push

- [ ] **Step 1: Push all commits to `main`**

```bash
git push
```

Expected: commits from Tasks 1-3 land on `origin/main`.

---

## Notes / Out of Scope

- `components/Nav.tsx` becomes unused after Tasks 2-3. Deleting it is optional cleanup, not part of this plan.
- The global "Tailwind never imported" issue (affects `app/sources/page.tsx`, `app/timeline/page.tsx`, `app/essay/[slug]/page.tsx`) is deliberately untouched — it needs its own review before enabling Tailwind app-wide.
