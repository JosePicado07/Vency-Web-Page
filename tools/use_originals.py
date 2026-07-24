"""
use_originals.py — Copy original source images (no bg removal) to inspirations/
Matches by stem name similarity, same logic as assign_images.py
"""
import re, shutil, unicodedata
from difflib import SequenceMatcher
from pathlib import Path
from PIL import Image
import pillow_avif  # noqa

ROOT     = Path(__file__).parent.parent
IMG_SRC  = ROOT / "drive-download-20260714T040311Z-1-001"
IMG_DST  = ROOT / "src/assets/images/inspirations"
WEBP_DIR = IMG_DST / "_webp"

def slugify(t):
    t = unicodedata.normalize("NFD", t)
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    t = t.lower()
    t = re.sub(r"['\"\$&]", "", t)
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")

def norm(t):
    t = unicodedata.normalize("NFD", t)
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9 ]", " ", t.lower()).strip()

def sim(a, b):
    return SequenceMatcher(None, norm(a), norm(b)).ratio()

# Build index of original AVIFs
originals = []
for p in IMG_SRC.rglob("*"):
    if p.suffix.lower() in {".avif", ".jpg", ".jpeg", ".png"} and p.is_file():
        originals.append(p)

print(f"Original source files: {len(originals)}")

# For each existing PNG in inspirations/, find best matching original
current_pngs = [p for p in IMG_DST.glob("*.png")]
print(f"Current catalog PNGs : {len(current_pngs)}")
print()

ok = skip = 0
for dst_png in sorted(current_pngs):
    slug = dst_png.stem
    best, best_score = None, 0
    for orig in originals:
        s = sim(slug.replace("-", " "), orig.stem)
        if s > best_score:
            best_score = s
            best = orig
    if best and best_score >= 0.5:
        img = Image.open(best).convert("RGBA")
        img.save(dst_png, "PNG")
        print(f"  [{best_score:.2f}] {slug} <- {best.stem}")
        ok += 1
    else:
        print(f"  [SKIP] {slug} (best={best.stem if best else 'none'} {best_score:.2f})")
        skip += 1

print(f"\n{ok} replaced / {skip} skipped")

# Regenerate WebPs
print("\nRegenerating WebPs...")
WEBP_DIR.mkdir(exist_ok=True)
for p in IMG_DST.glob("*.png"):
    img = Image.open(p).convert("RGBA")
    stem = p.stem
    for w in (400, 800):
        h = int(img.height * w / img.width)
        img.resize((w, h), Image.LANCZOS).save(WEBP_DIR / f"{stem}-{w}.webp", "WEBP", quality=85)
print("Done.")
