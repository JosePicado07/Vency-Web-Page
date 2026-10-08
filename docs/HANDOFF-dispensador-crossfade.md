# Handoff — Dispensador clip crossfade loop (2026-10-07)

For OpenCode. Re-encode the dispensador clip `src/assets/images/hero-clip-3to5.mp4` with a crossfade at its loop point, matching the hero clip's treatment (`hero-clip-full.mp4`, see `docs/HANDOFF-full-hero-mobile-done.md`). **Asset-only change**: the `<video>` in `src/index.html` (~line 451) already points at `hero-clip-3to5.mp4`, so no HTML edits are needed.

Branch: `main`. Everything from the previous handoff is still uncommitted; see the commit scope below.

## Measured by Claude (test encodes in a scratch folder; nothing in the repo changed)
Source: the Real-ESRGAN frames `%TEMP%\opencode\frames\ups\f090.png … f149.png` (60 frames = seconds 3–5, upscaled to 1280×720).

| Variant | Frames / length | Size | Loop seam PSNR (last → first frame) |
|---|---|---|---|
| Current file (plain loop, higher quality) | 60 / 2.0 s | 690,667 B | 28.5 dB |
| Plain loop, crf 23 | 60 / 2.0 s | 464,673 B | 28.5 dB (same frames) |
| **Crossfade 0.33 s (10 frames), crf 23 ← recommended** | 50 / 1.67 s | **424,410 B** | 27.9 dB |
| Crossfade 0.5 s (15 frames), crf 23 | 45 / 1.5 s | 393,292 B | 28.4 dB |

For reference: the hero went from 11.6 dB (hard cut) to 23.5 dB with its crossfade.

**Read this before doing the work:** this clip **already loops cleanly**. The 3–5 s segment ends close to how it starts, so the seam is about as smooth as a normal frame step. The crossfade does **not** measurably improve the seam here. What you actually gain:
- **Consistency** with the hero treatment (the user asked for it).
- **Smaller file:** −266 KB (−39%) against the current file. Most of that comes from crf 23 rather than the fade itself.
- Cost: the loop gets shorter (2.0 → 1.67 s) and there's a brief blend while the camera moves.

Pick the **0.33 s** fade: it keeps the loop longer than the 0.5 s variant, the size difference is only 31 KB, and the seam is equivalent. The 0.5 s fade would leave a 1.5 s loop, which feels twitchy at this size.

## Command
ffmpeg comes from `npm i ffmpeg-static` in a temp dir. If the upscaled frames are gone, rebuild them first: extract the source to PNGs with `-start_number 0`, then run `realesrgan-ncnn-vulkan.exe -n realesrgan-x4plus` (see `docs/HANDOFF-full-hero-mobile.md`).

```bash
UPS="$TEMP/opencode/frames/ups"
ffmpeg -y -framerate 30 -start_number 90 -i "$UPS/f%03d.png" -frames:v 60 -filter_complex \
  "[0]scale=1280:720:flags=lanczos,split[a][b];\
   [a]trim=start_frame=10,setpts=PTS-STARTPTS[main];\
   [b]trim=end_frame=10,setpts=PTS-STARTPTS[head];\
   [main][head]xfade=transition=fade:duration=0.3333:offset=1.3333,format=yuv420p" \
  -an -c:v libx264 -crf 23 -preset slow -movflags +faststart src/assets/images/hero-clip-3to5.mp4
```
How it works: `main` = source frames 100–149. Its last 10 frames fade into `head` = frames 90–99. The final output frame is frame 99, and the loop wraps to frame 100, which is one natural step.

## Expected output (assert these)
- 1280×720, **50 frames, 1.667 s**, ~424 KB (±5%)
- seam PSNR ≥ 25 dB:
  ```bash
  ffmpeg -i out.mp4 -i out.mp4 -filter_complex "[0]select=eq(n\,49)[a];[1]select=eq(n\,0)[b];[a][b]psnr" -f null - 2>&1 | grep average
  ```

## Verify in the browser
1. `cd src && python -m http.server 8765`, then open `http://localhost:8765/index.html`.
2. Dispensador video at 1440 / 800 / 375 px: it plays, loops without a visible jump, and `duration ≈ 1.67`.
3. Turn on reduced-motion emulation: it pauses on frame 0 (the existing inline script covers all `video[autoplay]`).
4. Kill the server afterwards. Earlier sessions left stray `:8765` listeners; check with `netstat -ano | findstr :8765`.

## Rules
- Only `src/assets/images/hero-clip-3to5.mp4` changes. Don't touch `src/index.html`, CSS or JS.
- Commit it together with the pending batch in `docs/HANDOFF-full-hero-mobile-done.md` §7, or on its own. Either way, keep out the unrelated edits listed there.
- The perf baseline should be re-run after this lands (`docs/HANDOFF-performance-check.md`). Mobile homepage video weight goes from ~1.85 MB to ~1.58 MB.
