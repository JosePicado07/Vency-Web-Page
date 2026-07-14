"""
remove_bg.py — Batch background remover for Vency product images
Usage: python tools/remove_bg.py --input <folder> --output <folder> [--fuzz 20] [--trim] [--threads 6]
"""

import argparse
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import pillow_avif  # noqa: F401 — registers AVIF support in Pillow
from PIL import Image, ImageDraw
from tqdm import tqdm

EXTS = {".avif", ".jpg", ".jpeg", ".png", ".webp"}
LOG_FILE = "remove_bg.log"


def _flood_fill_alpha(img: Image.Image, fuzz: int) -> Image.Image:
    """Replace background color (sampled from top-left corner) with transparency."""
    rgba = img.convert("RGBA")
    w, h = rgba.size

    # Sample background from the four corners and pick the most common
    corners = [rgba.getpixel((0, 0)), rgba.getpixel((w - 1, 0)),
               rgba.getpixel((0, h - 1)), rgba.getpixel((w - 1, h - 1))]
    bg = max(set(corners), key=corners.count)
    bg_rgb = bg[:3]

    tolerance = int(fuzz / 100 * 255)

    def in_range(c):
        return all(abs(int(c[i]) - int(bg_rgb[i])) <= tolerance for i in range(3))

    # Build mask via flood fill from all four corners
    pixels = rgba.load()
    mask = Image.new("L", rgba.size, 0)
    draw = ImageDraw.Draw(mask)

    visited = [[False] * h for _ in range(w)]
    queue = []
    seed_pixels = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]

    for sx, sy in seed_pixels:
        if not visited[sx][sy] and in_range(pixels[sx, sy]):
            queue.append((sx, sy))
            visited[sx][sy] = True

    while queue:
        x, y = queue.pop()
        draw.point((x, y), fill=255)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not visited[nx][ny]:
                visited[nx][ny] = True
                if in_range(pixels[nx, ny]):
                    queue.append((nx, ny))

    # Apply mask: where mask is white (background), set alpha to 0 (transparent)
    from PIL import ImageChops
    _, _, _, a = rgba.split()
    inv_mask = mask.point(lambda p: 255 - p)   # invert: 255 = keep, 0 = transparent
    new_alpha = ImageChops.multiply(a, inv_mask)
    rgba.putalpha(new_alpha)
    return rgba


def process_one(src: Path, dst: Path, fuzz: int, trim: bool) -> tuple[str, str]:
    try:
        img = Image.open(src)
        result = _flood_fill_alpha(img, fuzz)

        if trim:
            bbox = result.getbbox()
            if bbox:
                result = result.crop(bbox)

        dst.parent.mkdir(parents=True, exist_ok=True)
        result.save(dst, "PNG", optimize=True)
        return (src.name, "OK")
    except Exception as e:
        return (src.name, f"ERROR: {e}")


def main():
    parser = argparse.ArgumentParser(description="Remove solid background from product images")
    parser.add_argument("--input",   required=True, help="Source folder")
    parser.add_argument("--output",  default="output", help="Destination folder (default: output/)")
    parser.add_argument("--fuzz",    type=int, default=20, help="Color tolerance 0-100 (default: 20)")
    parser.add_argument("--trim",    action="store_true", help="Trim transparent border after removal")
    parser.add_argument("--threads", type=int, default=6, help="Parallel workers (default: 6)")
    args = parser.parse_args()

    src_root = Path(args.input)
    dst_root = Path(args.output)

    files = [p for p in src_root.rglob("*") if p.suffix.lower() in EXTS and p.is_file()]
    if not files:
        print(f"No images found in {src_root}")
        return

    print(f"Found {len(files)} images  ·  fuzz={args.fuzz}%  ·  trim={args.trim}  ·  threads={args.threads}")

    logging.basicConfig(filename=LOG_FILE, level=logging.INFO,
                        format="%(asctime)s %(message)s", datefmt="%H:%M:%S")

    jobs = []
    for src in files:
        rel = src.relative_to(src_root)
        dst = dst_root / rel.with_suffix(".png")
        jobs.append((src, dst))

    ok = errors = 0
    with ThreadPoolExecutor(max_workers=args.threads) as ex:
        futures = {ex.submit(process_one, s, d, args.fuzz, args.trim): s for s, d in jobs}
        for fut in tqdm(as_completed(futures), total=len(futures), unit="img"):
            name, status = fut.result()
            logging.info(f"{name} — {status}")
            if status == "OK":
                ok += 1
            else:
                errors += 1
                tqdm.write(f"  ERROR {name}: {status}")

    print(f"\n{ok} procesadas  /  {errors} errores  /  log -> {LOG_FILE}")
    print(f"Salida: {dst_root.resolve()}")


if __name__ == "__main__":
    main()
