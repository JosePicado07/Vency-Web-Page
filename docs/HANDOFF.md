# Handoff — Hero & Dispensador video clips (2026-10-07)

> **Superseded (2026-10-07):** the hero now plays `hero-clip-full.mp4` (full 5 s scene, 4.5 s with a loop crossfade) and the dispensador video is visible on mobile. See `docs/HANDOFF-full-hero-mobile-done.md` and `docs/PLAN-full-hero-mobile.md`. Keep this file for the Real-ESRGAN re-cutting pipeline and the reduced-motion/deletion notes below.

For the next agent (OpenCode). Status: **implemented and verified locally, NOT committed.**

## Goal
From the source video `WhatsApp Video 2026-10-06 at 7.14.09 PM.mp4` (repo root, gitignored via `/WhatsApp*.mp4`):
- seconds **1→3** looping in the homepage **hero**
- seconds **3→5** looping in the **dispensador** section, shown larger

## Source
A WhatsApp "GIF", really an H.264 MP4: **640×360, 30 fps, 150 frames, 5.0 s, ~814 kb/s** (aggressive WhatsApp compression). The small size was fine as a static poster but looked soft/artifacted once looped up to ~2× on screen, so the clips are now **AI-upscaled** (see Re-cutting).

## Current state (uncommitted)
| File | What |
|---|---|
| `src/index.html` (`.hero__media`) | `<picture>/<img>` replaced by `<video class="hero__image" src="assets/images/hero-clip-1to3.mp4" poster="assets/images/hero-gift-poster.webp" autoplay muted loop playsinline preload="auto" role="img" aria-label="Estuche de regalo de Vency Atelier">`. No `<picture>` wrapper (a video inside picture is invalid). |
| `src/index.html` (inline `<style>`, dispensador) | `.dispensador__inner`: `max-width: 1100px`, `grid-template-columns: 1fr minmax(0, 420px)` (was 900px / 220px). New `@media (max-width: 900px)` → `1fr 280px; gap: 2rem`. `≤660px` still hides the aside. Dispensador `<video>` already used `hero-clip-3to5.mp4`. |
| `src/index.html` (inline `<script>`, end of body) | `prefers-reduced-motion` handling: pauses both `video[autoplay]` and rewinds to frame 0 when `reduce` is set; resumes via `change` listener otherwise. Verified headless: on `reducedMotion: 'reduce'` both videos are `paused=true, currentTime=0`. |
| `src/assets/images/hero-clip-1to3.mp4` | frames 30–89 (1.0–3.0 s), **1280×720**, 60 frames, ~778 KB (2026-10-07: AI-upscaled) |
| `src/assets/images/hero-clip-3to5.mp4` | frames 90–149 (3.0–5.0 s), **1280×720**, 60 frames, ~691 KB (2026-10-07: AI-upscaled) |
| `src/assets/images/hero-gift-poster.webp` | first frame of the 1→3 clip at 1280×720, so there's no jump when playback starts (~38 KB) |
| `src/assets/images/hero-gift.mp4`, `hero-gift-720.mp4`, `hero-gift-disp.mp4` | **deleted** (unreferenced; confirmed via grep). `hero-gift.png` kept (used as `og:image` on 6 pages). |
| `docs/HANDOFF.md` | this file |

## Re-cutting (2026-10-07 revision)
The 640×360 source shown up to ~2× looked soft/blocky. Pipeline is now **Real-ESRGAN (x4plus) → 2560×1440 → 1280×720 encode**, which adds real synthetic detail instead of naive upscaling.

1. Install a frame-accurate ffmpeg: `npm i ffmpeg-static` in a temp dir → `node_modules/ffmpeg-static/ffmpeg.exe`.
2. Get Utils: Real-ESRGAN Vulkan binary (`realesrgan-ncnn-vulkan-20220424-windows.zip`, needs a Vulkan GPU; on this machine AMD RX 5600 XT, full 150-frame upscale took ~1 min). Frames go to a temp dir; don't commit them.
3. Extract + upscale + re-cut by frame (start_number 0):

```bash
SRC="WhatsApp Video 2026-10-06 at 7.14.09 PM.mp4"
ffmpeg -y -i "$SRC" -start_number 0 frames/src/f%03d.png
realesrgan-ncnn-vulkan.exe -i frames/src -o frames/ups -n realesrgan-x4plus -s 4 -f png
ffmpeg -y -framerate 30 -start_number 30  -i frames/ups/f%03d.png -vf "scale=1280:720:flags=lanczos" -frames:v 60 -c:v libx264 -crf 20 -preset slow -pix_fmt yuv420p -movflags +faststart src/assets/images/hero-clip-1to3.mp4
ffmpeg -y -framerate 30 -start_number 90  -i frames/ups/f%03d.png -vf "scale=1280:720:flags=lanczos" -frames:v 60 -c:v libx264 -crf 20 -preset slow -pix_fmt yuv420p -movflags +faststart src/assets/images/hero-clip-3to5.mp4
ffmpeg -y -i src/assets/images/hero-clip-1to3.mp4 -frames:v 1 -c:v libwebp -quality 82 src/assets/images/hero-gift-poster.webp
```

Note: the old 640×360 pass used `trim=start_frame:end_frame` directly on the source at crf 23; the upscale pass re-encodes at crf 20 because the AI detail is worth the extra ~550 KB per clip.

## Verified
Ran headless Chrome on local `src/` at 1440px and 800px:
- hero plays `hero-clip-1to3.mp4` (553px wide at 1440px)
- dispensador plays `hero-clip-3to5.mp4`: 418px wide at 1440px, 278px at 800px
- the only console errors were 404s on `/api/catalog-archive` and `/api/availability`, which are Cloudflare Functions and are expected when serving statically

## Open items / next steps
1. **Commit**: commit only `src/index.html`, the 4 media changes above (2 clips + poster + 3 deletions) and `docs/HANDOFF.md`. The working tree has unrelated uncommitted edits (docs/DESIGN.md, docs/PRODUCT.md, src/404.html, perfumista/personalizacion/proceso.html, scripts/*.js, styles/*.css), so don't bundle them.
2. **Hero crop**: the hero box is 3:4 (`styles.css` `.hero__media`, `max-height: 82svh`) and the clip is 16:9, so `object-fit: cover` cuts off the sides (the machine is partly out of frame). Options: tune `object-position` on the hero video, or give the hero media a wider aspect. **Pending visual sign-off from the user (who is reviewing the AI-upscaled clips in browser right now).**
3. ~~Reduced motion~~ **done** (inline script, see Current state).
4. ~~Unused assets~~ **done** (deleted, see Current state).
5. **Audit**: `/impeccable audit` ran on `index.html`; scores requested output is compiled but not yet delivered as a report (registry: this page is unchanged structurally by the video swap; the audit's main new finding is touch-target width on `.nav__link` items GUÍA (30px) and FAQ (24px) — height 44px passes, width fails WCAG 2.5.8/2.5.5 for a 2-character nav item — plus all the pre-existing page checks). Confirm whether to include the nav-width tweak in this commit or a follow-up.

## How to verify
1. `cd src && python -m http.server 8765`, then open `http://localhost:8765/index.html`.
2. The hero loops the 1–3 s clip; the dispensador aside loops the 3–5 s clip and is visibly larger.
3. Check widths 1440 / 800 / 375px: text isn't squeezed, and the aside is hidden on mobile.
