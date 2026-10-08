# Handoff — Full hero clip + dispensador on mobile: review & ship (2026-10-07)

For OpenCode. Claude implemented `docs/PLAN-full-hero-mobile.md` (which answers `docs/HANDOFF-full-hero-mobile.md`). The changes are **in the working tree, uncommitted and not reviewed**. Your job: review, finish the open items, and make a scoped commit.

Branch: `main` (not `master`).

## Decisions taken (approved by the user)
1. **Hero:** 1280×720, crf 23, one `<source>`, with a 0.5 s crossfade at the loop point. No 480p mobile fallback, because it would be soft on high-DPI phones (the 3:4 cover box needs ~980–1470 device px of height on mobile).
2. **Dispensador on mobile:** autoplay immediately (no IntersectionObserver). Costs +690 KB on mobile.

## What is already done (uncommitted)
| Path | State |
|---|---|
| `src/assets/images/hero-clip-full.mp4` | **new**, untracked. 1280×720, 135 frames, 4.5 s, 1,157,528 B. Built from the Real-ESRGAN frames: source frames 15–149, with the last 0.5 s fading into frames 0–14. Loop seam PSNR is 23.5 dB (a plain loop measured 11.6 dB, a hard cut). |
| `src/assets/images/hero-gift-poster.webp` | regenerated = first frame of `hero-clip-full.mp4` (37,404 B) |
| `src/assets/images/hero-clip-3to5.mp4` | **loop crossfade added (OpenCode, 2026-10-07)**: source frames 90–149 (2.0 s) with the last 0.4 s fading into frames 75–89. 1280×720, 60 frames, 535,466 B. Loop-seam PSNR 11.98 dB → **25.43 dB**. |
| `src/assets/images/hero-clip-1to3.mp4` | **deleted, staged** (`git rm`). It was unreferenced after the swap. |
| `src/index.html` hero `<video>` | `src` changed to `hero-clip-full.mp4`, `width/height` changed to `1280/720` |
| `src/index.html` dispensador `@media (max-width: 660px)` | `.dispensador__aside { display:none }` replaced with `{ text-align:left; justify-items:stretch; gap:.75rem; margin-top:1rem; }` plus `.dispensador__aside-label { margin-top:0; }` |

Command used for the clip (in case it needs regenerating; the frames are at `%TEMP%\opencode\frames\ups\f000–f149.png`):
```bash
ffmpeg -y -framerate 30 -start_number 0 -i "$UPS/f%03d.png" -filter_complex \
  "[0]scale=1280:720:flags=lanczos,split[a][b];[a]trim=start_frame=15,setpts=PTS-STARTPTS[main];\
   [b]trim=end_frame=15,setpts=PTS-STARTPTS[head];[main][head]xfade=transition=fade:duration=0.5:offset=4.0,format=yuv420p" \
  -an -c:v libx264 -crf 23 -preset slow -movflags +faststart src/assets/images/hero-clip-full.mp4
ffmpeg -y -i src/assets/images/hero-clip-full.mp4 -frames:v 1 -c:v libwebp -quality 82 src/assets/images/hero-gift-poster.webp
```

Dispensador loop crossfade (OpenCode, 2026-10-07) — main = frames 90–149, head = the 12 frames before the start (75–89), 0.4 s fade at offset 1.6:
```bash
ffmpeg -y -framerate 30 -start_number 0 -i "$UPS/f%03d.png" -filter_complex \
  "[0]scale=1280:720:flags=lanczos,split[a][b];[a]trim=start_frame=90,setpts=PTS-STARTPTS[main];\
   [b]trim=start_frame=75:end_frame=90,setpts=PTS-STARTPTS[head];[main][head]xfade=transition=fade:duration=0.4:offset=1.6,format=yuv420p" \
  -an -c:v libx264 -crf 23 -preset slow -movflags +faststart src/assets/images/hero-clip-3to5.mp4
```
Crossfade length was chosen by seam PSNR: 0.3 s=25.04 dB, 0.4 s=25.43 dB, 0.5 s=25.59 dB (plain loop 11.98 dB). 0.4 s is the knee of the curve and ghosts only 20% of the 2 s loop.

## Verified by Claude (headless Chrome, local `src/` on :8765)
| Width | Hero | Dispensador video | Horizontal overflow |
|---|---|---|---|
| 1440 | `hero-clip-full.mp4`, playing, duration 4.5 s | 418 px, playing | none |
| 800 | same | 278 px (side column), playing | none |
| 375 | same | 317 px (≈ full 319 px column), playing | none |

- With `prefers-reduced-motion: reduce` emulated, both videos had `paused === true` and `currentTime === 0`.
- The only console errors were 404s on `/api/catalog-archive` and `/api/availability`, which are Cloudflare Functions and are expected locally.

## Open items (yours)
1. **Kill the stray dev servers.** Two `python -m http.server 8765` processes are still listening (PIDs 33940 and 26540 at the time of writing; check with `netstat -ano | findstr :8765`).
2. **Review the `src/index.html` diff.** `git diff --stat` shows +34/−19, which is more than this task's edits. It also includes earlier session work (the reduced-motion `<script>` at the end of the file, and the 1→3/3→5 hero `<video>` swap from `docs/HANDOFF.md`). Decide whether everything in it ships together; if not, use `git add -p`.
3. **Duplicate label on mobile.** At ≤660px the aside label "PRIMERA EN COSTA RICA" now sits under the video, while the section kicker above already says the same thing. Recommend hiding `.dispensador__aside-label` at ≤660px (one line in the same media block). Judge it by eye.
4. **Tune the mobile spacing** (`margin-top: 1rem` on the aside) at 375px.
5. **Stale doc:** `docs/HANDOFF.md` still describes `hero-clip-1to3.mp4` as the hero clip. Update it or mark it superseded by this file.
6. **Run `/impeccable audit` on `index.html`** (project rule after UI changes).
7. **Scoped commit.** Include: `src/index.html`, `src/assets/images/hero-clip-full.mp4`, `src/assets/images/hero-gift-poster.webp`, `src/assets/images/hero-clip-3to5.mp4`, the staged deletions (`hero-clip-1to3.mp4`, `hero-gift.mp4`, `hero-gift-720.mp4`, `hero-gift-disp.mp4`), `docs/HANDOFF.md`, `docs/HANDOFF-full-hero-mobile.md`, `docs/PLAN-full-hero-mobile.md` and this file.
   Do **not** include: `docs/DESIGN.md`, `docs/PRODUCT.md`, `src/404.html`, `src/perfumista.html`, `src/personalizacion.html`, `src/proceso.html`, `src/scripts/*.js`, `src/styles/*.css`, `.agents/`, `.claude/`, `*.code-workspace`, `skills-lock.json`.

## How to re-verify
1. `cd src && python -m http.server 8765`, then open `http://localhost:8765/index.html`.
2. The hero loops with no hard jump at the wrap. Expect a ~0.5 s soft blend; some ghosting is expected because the camera moves.
3. At 375px the dispensador video is full column width under the facts, still autoplaying, and there's no sideways scroll.
4. In DevTools, turn on reduced-motion emulation: both videos stop on frame 0.
