"""
Download missing catalog images from Fragrantica (fimgs.net) and convert to PNG + WebP.
"""
import urllib.request
import io
from pathlib import Path
from PIL import Image

DEST = Path("src/assets/images/inspirations")
WEBP = DEST / "_webp"
DEST.mkdir(parents=True, exist_ok=True)
WEBP.mkdir(parents=True, exist_ok=True)

# (slug, fragrantica_id)
MISSING = [
    ("vert-malachite",          34588),
    ("the-boss",               131013),
    ("the-scent",               20551),
    ("spicebomb-extreme",       30499),
    ("no-limit",                59624),
    ("la-vie-est-belle-lelixir",95856),
    ("bombshell",               10190),
    ("eau-so-sexy",             26453),
    ("percival",                51037),
    ("valaya",                  78574),
    ("angels-share",            62615),
    ("angels-share-paradis",   101629),
    ("italica",                 41149),
    ("bouquet-ideale",          11800),
    ("black-orchid",             1018),
    ("noir-de-noir",             1822),
    ("electric-cherry",         78583),
    ("corazon-del-desierto",    66044),
    ("bergamotto-di-calabria",  66175),
]

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://www.fragrantica.com/",
}

ok, fail = [], []

for slug, fid in MISSING:
    url = f"https://fimgs.net/mdimg/perfume-thumbs/375x500.{fid}.jpg"
    png_path = DEST / f"{slug}.png"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as r:
            data = r.read()
        img = Image.open(io.BytesIO(data)).convert("RGB")

        # Save as PNG
        img.save(png_path, "PNG", optimize=True)

        # WebP at 400px wide (thumb)
        w, h = img.size
        thumb_w = 400
        thumb_h = int(h * thumb_w / w)
        thumb = img.resize((thumb_w, thumb_h), Image.LANCZOS)
        thumb.save(WEBP / f"{slug}.webp", "WEBP", quality=82)

        # WebP at 800px wide (full)
        full_w = 800
        full_h = int(h * full_w / w)
        full = img.resize((full_w, full_h), Image.LANCZOS)
        full.save(WEBP / f"{slug}@2x.webp", "WEBP", quality=82)

        ok.append(slug)
        print(f"  OK  {slug}  ({w}x{h})")
    except Exception as e:
        fail.append((slug, str(e)))
        print(f"  FAIL {slug}: {e}")

print(f"\n{len(ok)} downloaded, {len(fail)} failed")
if fail:
    for s, e in fail:
        print(f"  FAIL {s}: {e}")
