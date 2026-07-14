"""
rebg_rembg.py — Re-process all catalog PNGs with AI background removal (rembg/u2net)
Run from project root: python tools/rebg_rembg.py
"""

from pathlib import Path
from PIL import Image
from rembg import remove, new_session
from tqdm import tqdm

INSPIRATIONS = Path("src/assets/images/inspirations")
WEBP_DIR = INSPIRATIONS / "_webp"

pngs = [p for p in INSPIRATIONS.glob("*.png")]
print(f"Processing {len(pngs)} images with rembg (u2net)...")
print("(First run downloads ~170MB model — wait a moment)\n")

session = new_session("u2net")

ok = errors = 0
for p in tqdm(pngs, unit="img"):
    try:
        with open(p, "rb") as f:
            inp = f.read()
        out = remove(inp, session=session)
        p.write_bytes(out)
        ok += 1
    except Exception as e:
        tqdm.write(f"  ERROR {p.name}: {e}")
        errors += 1

print(f"\n{ok} OK / {errors} errors")

# Regenerate WebP thumbnails
print("\nRegenerating WebP thumbnails...")
WEBP_DIR.mkdir(exist_ok=True)
webp_ok = 0
for p in tqdm(list(INSPIRATIONS.glob("*.png")), unit="img"):
    try:
        img = Image.open(p).convert("RGBA")
        stem = p.stem
        for width in (400, 800):
            h = int(img.height * width / img.width)
            thumb = img.resize((width, h), Image.LANCZOS)
            thumb.save(WEBP_DIR / f"{stem}-{width}.webp", "WEBP", quality=85)
        webp_ok += 1
    except Exception as e:
        tqdm.write(f"  WEBP ERROR {p.name}: {e}")

print(f"{webp_ok * 2} WebP files regenerated -> {WEBP_DIR}")
