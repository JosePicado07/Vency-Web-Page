# Plan — Full hero clip + dispensador video on mobile (2026-10-07)

Answers `docs/HANDOFF-full-hero-mobile.md`. Everything here was checked against the working tree and measured on this machine; nothing is implemented yet.

## Corrections to the handoff
- Branch is `main`, not `master`.
- `hero-gift-poster.webp` is **not** unchanged. It's currently a frame from the 1→3 clip. With a full-length clip the poster must be regenerated from the clip's first frame, or there's a visible jump when playback starts.
- The loop seam is not just a "watch for it" item. Measured PSNR (higher = more similar), on the upscaled 1280×720 render:
  - last → first frame of the plain full clip: **11.6 dB**, a hard cut (adjacent source frames are ~32 dB)
  - the current 1→3 loop: 12.8 dB, the same hard cut
  So "full clip, plain loop" visibly jumps every 5 s, exactly like today.

## Decision 1 — Hero clip: size, resolution, seam
**Pick: 1280×720, crf 23, 0.5 s crossfade at the loop point, one `<source>`. Output ≈ 1.16 MB (1,157,528 B, 135 frames / 4.5 s).**

| Option (all measured) | Size | Notes |
|---|---|---|
| 720p crf 20, plain loop (handoff baseline) | 1.80 MB | hard seam |
| 720p crf 23, plain loop | 1.22 MB | hard seam |
| 720p crf 26, plain loop | 0.84 MB | visible softening on the upscaled detail |
| 480p crf 23, plain loop | 0.60 MB | too soft, see below |
| **720p crf 23, crossfade loop** | **1.16 MB** | seam 11.6 → **23.5 dB**, soft blend instead of a cut |

Why:
- **720p is needed on both breakpoints.** The hero box is 3:4 with `object-fit: cover`, so the 16:9 clip is scaled to fill the box's **height**. Desktop 1440px: the box is ~553×737 CSS px, so the clip renders ~1310 px wide. Mobile: `max-height: 58svh` ≈ 490 CSS px tall × DPR 2–3 = 980–1470 device px. A 480p mobile `<source>` would be upscaled on phones too, so it saves bandwidth but looks visibly soft. **Skip the second source.**
- **crf 23 over 20** saves 0.64 MB. The source is heavy WhatsApp compression that was AI-upscaled, so crf 20 mostly spends bits on upscaler texture.
- **Crossfade**: the clip drops source frames 0–14 as a standalone head. The last 0.5 s of the clip (source 135–149) fades into source frames 0–14, so the final frame equals source frame 14, and the loop wraps to source frame 15 (one natural frame step). Cost: 0.5 s shorter, plus ~0.5 s of mild ghosting during the blend while the camera moves. It's cheaper than ping-pong (that doubles the size) and has no JavaScript.

### Exact commands
Inputs: the upscaled PNGs already exist at `%TEMP%\opencode\frames\ups\f000.png…f149.png` (150 frames). If they're gone, rebuild them with `%TEMP%\opencode\realesrgan\realesrgan-ncnn-vulkan.exe -n realesrgan-x4plus` on frames extracted from the source. ffmpeg comes from `npm i ffmpeg-static` in a temp dir.

```bash
UPS="$TEMP/opencode/frames/ups"
ffmpeg -y -framerate 30 -start_number 0 -i "$UPS/f%03d.png" -filter_complex \
  "[0]scale=1280:720:flags=lanczos,split[a][b];\
   [a]trim=start_frame=15,setpts=PTS-STARTPTS[main];\
   [b]trim=end_frame=15,setpts=PTS-STARTPTS[head];\
   [main][head]xfade=transition=fade:duration=0.5:offset=4.0,format=yuv420p" \
  -an -c:v libx264 -crf 23 -preset slow -movflags +faststart src/assets/images/hero-clip-full.mp4
# expected: 1280x720, 135 frames, 4.5 s, ~1.16 MB

ffmpeg -y -i src/assets/images/hero-clip-full.mp4 -frames:v 1 -c:v libwebp -quality 82 src/assets/images/hero-gift-poster.webp
# poster = first frame of the clip (source frame 15)
```

## Decision 2 — Dispensador video on mobile
**Layout pick:** at ≤660px the aside joins the stacked column, left-aligned to the text, with the figure full-width and the label under it.

**Loading pick: (a) leave as-is**, plain `autoplay muted loop playsinline preload="metadata"`. Reasons:
- `autoplay` makes browsers fetch the clip anyway (`preload` is only a hint), so on mobile that's +690 KB (`hero-clip-3to5.mp4`, 690,667 B). Total video on mobile: ~1.85 MB (1.16 MB hero + 0.69 MB dispensador), versus today's 0.78 MB (the 1→3 hero clip only).
- Option (b), an IntersectionObserver lazy start, saves the 690 KB for visitors who never scroll that far. But it needs ~10 lines of JS and the reduced-motion script would need to change (it selects `video[autoplay]`, and a lazy video wouldn't have that attribute). Option (c), the `js-*` gating, is the same work with more indirection.
- Upgrade path: if mobile data cost matters, do (b). The handoff's open question 2 is exactly this, so please confirm.

**Accessibility:** keep `aria-hidden="true"`. The section text already describes the machine, so the video is decorative.

## `src/index.html` diffs

### Hero (~line 314)
```diff
-          src="assets/images/hero-clip-1to3.mp4"
+          src="assets/images/hero-clip-full.mp4"
 ...
-          width="640"
-          height="360"
+          width="1280"
+          height="720"
```
(The width/height only describe the intrinsic ratio. `.hero__media` has `aspect-ratio: 3/4`, so there's no layout-shift risk either way; keeping accurate values is the honest choice.)

### Dispensador inline `<style>` (~line 236)
```diff
     @media (max-width: 660px) {
       .dispensador__inner { grid-template-columns: 1fr; }
-      .dispensador__aside { display: none; }
+      .dispensador__aside { text-align: left; justify-items: stretch; gap: .75rem; margin-top: 1rem; }
+      .dispensador__aside-label { margin-top: 0; }
       .dispensador__facts { grid-template-columns: 1fr; gap: 1.2rem; }
     }
```
The `.dispensador__inner` `gap: 3rem` (2rem at ≤900px) already separates the facts from the video. The `margin-top: 1rem` is a placeholder, to be tuned by eye at 375px.

## Asset hygiene
- **Delete `hero-clip-1to3.mp4` (`git rm`)**: it's unreferenced after the swap (verify with `grep -r hero-clip-1to3 src`). This follows the `hero-gift*.mp4` precedent.
- Keep `hero-clip-3to5.mp4` (the dispensador uses it).

## Scoped commit
`git add` exactly: `src/index.html`, `src/assets/images/hero-clip-full.mp4`, `src/assets/images/hero-gift-poster.webp`, `src/assets/images/hero-clip-3to5.mp4` (re-upscaled, already modified), the `hero-clip-1to3.mp4` deletion, the already-staged `hero-gift*.mp4` deletions, `docs/HANDOFF.md`, `docs/HANDOFF-full-hero-mobile.md` and this plan.
**Not** the unrelated edits: `docs/DESIGN.md`, `docs/PRODUCT.md`, `src/404.html`, `src/perfumista.html`, `src/personalizacion.html`, `src/proceso.html`, `src/scripts/*.js`, `src/styles/*.css`.
Caveat: `src/index.html` may contain other uncommitted edits from earlier work (e.g. the reduced-motion script). Review `git diff src/index.html` before committing; use `git add -p` if anything unrelated is in there.

## Verification (to run after implementing)
1. Probe: `hero-clip-full.mp4` is 1280×720, 135 frames, ~1.16 MB. The seam PSNR (last vs first frame) is ≥ 20 dB.
2. `cd src && python -m http.server 8765`, then run headless Chrome at 1440 / 800 / 375:
   - hero `currentSrc` ends in `hero-clip-full.mp4` and is playing
   - at 375px the dispensador video is visible, full column width, `paused === false` once scrolled into view
   - `document.documentElement.scrollWidth <= innerWidth` (no horizontal overflow)
   - screenshots of the dispensador at all 3 widths
3. Emulate `prefers-reduced-motion: reduce`: both videos are `paused === true` at `currentTime === 0`.
4. Console: only the known `/api/*` 404s (Cloudflare Functions, which don't exist when served locally).
5. `/impeccable audit` on `index.html` (project rule).

## Open questions for the human
1. **Hero weight:** I recommend the single 720p crf 23 crossfade loop at ~1.16 MB (35% lighter than the handoff's 1.72 MB baseline). No 480p fallback, because it would look soft on high-DPI phones.
2. **Dispensador on mobile:** I recommend autoplay immediately (simplest, +690 KB). The alternative is to start it only when scrolled into view (saves 690 KB for visitors who never get that far, costs ~10 lines of JS).
