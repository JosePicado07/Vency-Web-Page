# Handoff — Full hero video + dispenser video on mobile (2026-10-07)

For the next agent (Claude). Mission: **produce a real, reviewable plan and then implement it.** This document defines the what and the constraints; the *how* details (exact re-cut invocation, preload strategy, responsive treatment) are yours to decide and justify in the plan. Do not improvise the two open decisions in §5 without stating the tradeoff you chose and why

## Status of the worktree
Everything below sits **uncommitted** in `master`. Do not bundle unrelated edits. The carriage rollback is exactly what a prior commit list already tracked; see `docs/HANDOFF.md` (the sibling doc) for the pending commit of the 1→3/3→5 clip work — do not conflate the two.

## Goal
Two UI changes on the homepage (`src/index.html`), both gated on freshly generated video assets:

1. **Hero: loop the full 5 s clip**, not the 1→3 s slice. Replace the current `hero-clip-1to3.mp4` reference with a full-length loop.
2. **Dispensador: show the machine video on mobile too.** The aside (`<div class="dispensador__aside">`) is currently `display: none` below 660px; make it visible and well-placed in the stacked mobile layout.

## Current state (relevant code)

### Source media
- `WhatsApp Video 2026-10-06 at 7.14.09 PM.mp4` (gitignored, repo root): 640×360, 30 fps, 150 frames, 5.0 s, ~814 kb/s. Heavy WhatsApp compression, so clips are AI-upscaled before use.
- Existing pipeline (fully proven this session): Real-ESRGAN `x4plus` → 2560×1440 PNG sequence → ffmpeg → 1280×720 libx264 `crf 20`, `preset slow`, `yuv420p`, `+faststart`. A 60-frame clip ≈ 690–780 KB. A full 150-frame clip at the same crf 20 measures **1,801,631 B ≈ 1.72 MiB** (probed this session, `hero-clip-full-probe.mp4` in temp). A crf 23 pass would land ~1.3 MiB; a 854×480 pass ~600 KB — state which you take and why.
- Tooling paths used this session (temp; may not persist — rebuild if gone):
  - ffmpeg: `npm i ffmpeg-static` in a temp dir → `node_modules/ffmpeg-static/ffmpeg.exe`
  - Real-ESRGAN: `realesrgan-ncnn-vulkan-20220424-windows.zip`, Vulkan GPU (AMD RX 5600 XT here), 150-frame upscale ≈ 1 min
  - Frame math: `-start_number 0`, hero slice was frames 30–89, dispenser slice frames 90–149; full = frames 0–149

### `src/index.html` — hero (lines ~313–328)
```html
<video
  class="hero__image"
  src="assets/images/hero-clip-1to3.mp4"
  poster="assets/images/hero-gift-poster.webp"
  autoplay muted loop playsinline preload="auto"
  role="img" aria-label="Estuche de regalo de Vency Atelier"
  width="640" height="360"
></video>
```
- `preload="auto"` + poster → first paint is the 1280×720 webp poster, video streams after. Keep this.
- `width="640" height="360"` no longer matches reality once the full clip is 1280×720. Decide: bump to `1280×720` or drop the attributes (a 16:9 `object-fit: cover` element doesn't need them for CLS because `.hero__media` has `aspect-ratio: 3/4` in `styles.css:1110`).

### `src/index.html` — dispensador (lines ~425–462, inline `<style>` at ~162–241)
- Aside markup: `<div class="dispensador__aside" aria-hidden="true">` → `<figure class="dispensador__figure">` → `<video src="assets/images/hero-clip-3to5.mp4" autoplay muted loop playsinline preload="metadata" aria-hidden="true">`.
- Inline style block (`<style>` at line ~162):
  - `.dispensador__aside { text-align: right; display: grid; gap: 1.2rem; justify-items: end; }` (line ~209)
  - `.dispensador__figure video { aspect-ratio: 16/9; object-fit: cover; ... }` (line ~218)
  - `@media (max-width: 900px) { .dispensador__inner { grid-template-columns: 1fr 280px; gap: 2rem; } }` (line ~233)
  - **`@media (max-width: 660px) { .dispensador__inner { grid-template-columns: 1fr; } .dispensador__aside { display: none; } ... }`** (lines ~236–240) ← the rule to change
- `styles.css` has no dispensador rules; the whole section is inline. The hero video also picks up `@media (max-width: 767px) { .hero__media { max-height: 58svh } }` from `styles.css:2308`.

## Work items

### 1. Full hero clip
- Generate `src/assets/images/hero-clip-full.mp4` (frames 0–149, 1280×720) via the proven pipeline. Keep `+faststart` and the poster. Reference size for crf 20: 1.72 MiB (probed); 2.0 MiB from the 150-frame pass includes no poster.
- Point the hero `<video>` at it.
- **Asset hygiene decision**: after the swap, `hero-clip-1to3.mp4` becomes unreferenced. This repo just deleted three unreferenced `hero-gift*.mp4` (project precedent: `grep -r` to confirm, then `git rm`). Recommend the same here, or justify keeping it.

### 2. Dispenser video on mobile
- Change the `≤660px` rule so the aside is visible. Concretely, at minimum remove `.dispensador__aside { display: none; }` from the `@media (max-width: 660px)` block.
- The rest is a real design decision for your plan:
  - The aside is currently `justify-items: end` (right-aligned). In the stacked `1fr` column on mobile, right-alignment + `text-align: right` will look left-unanchored with the full-width figure. Decide and specify the mobile treatment (likely: left/center aligned, figure `width: 100%`, label aligned with it).
  - `gap` in the 660px block is currently `1.2rem` for facts; verify vertical rhythm between content and aside.
  - Check the 900px breakpoint: at 800px the aside shows in a `280px` side column with no changes needed. Only ≤660px is affected.
- **Playback/bandwidth decision**: hero now streams ~2 MB on load. On mobile the dispenser video autoplays `preload="metadata"` but is below the fold. Options to state tradeoffs for in the plan: (a) leave as-is (simplest), (b) `preload="none"` until first in-view via `IntersectionObserver`, (c) gate the whole section behind the existing `js-*` pattern used elsewhere. Do not change behavior silently.
- `aria-hidden="true"` on the aside: the section's content already describes the machine in text; the video is decorative. Confirm that decision stays, or give the video an `aria-label` and remove the hidden attribute.

### 3. Regression guards (do not break — already verified working this session)
- **Reduced motion**: inline script at the end of `index.html` (added this session) pauses `video[autoplay]` and rewinds to frame 0 under `prefers-reduced-motion: reduce`, resumes otherwise. It selects `document.querySelectorAll('video[autoplay]')` — no change needed for a new/mobile-visible video; the full hero clip is covered automatically. Verify, don't assume.
- **Layout QA at 1440 / 800 / 375**: no horizontal overflow, headline not squeezed, aside hidden on mobile is now *gone* (intended) — text-to-video column must not collide.

### 4. Scoped commit
Commit only: `src/index.html`, `src/assets/images/hero-clip-full.mp4` (+ deletion of `hero-clip-1to3.mp4` if you take the hygiene path), `src/assets/images/hero-gift-poster.webp` (unchanged), and this handoff + the sibling `docs/HANDOFF.md` if they are in the same batch. The worktree also has unrelated uncommitted edits you must **not** touch: `docs/DESIGN.md`, `docs/PRODUCT.md`, `src/404.html`, `src/perfumista.html`, `src/personalizacion.html`, `src/proceso.html`, `src/scripts/*.js`, `src/styles/styles.css`, `src/styles/legal.css`.

## Verification
1. `cd src && python -m http.server 8765` → `http://localhost:8765/index.html`
2. Hero loops the full 5 s clip (watch for the wrap-around: frame 149 → 0 must not visibly jump where 1→3 previously looped mid-scene).
3. Dispenser video renders in the stacked mobile column at ≤660px (e.g., 375px width) — aligned, full-width, still autoplaying.
4. `prefers-reduced-motion: reduce` (DevTools emulation) pauses both videos.

## Deliverable from you (Claude)
A short plan (before touching code) that:
- names the two open decisions in this doc and picks one for each **with the size/bandwidth/layout numbers behind it**,
- gives the exact re-cut command for `hero-clip-full.mp4` and its expected output size,
- lists the precise `index.html` diffs (both tasks), and
- ends with the verification steps run and their results.

## Open questions for the human
1. Is ~1.7 MiB acceptable for the hero autoplay video, or do you want a lower-crf pass / 854×480 mobile fallback as a second `<source>`? (offer a firm recommendation in the plan)
2. On mobile, should the dispenser video appear immediately or only when scrolled into view?