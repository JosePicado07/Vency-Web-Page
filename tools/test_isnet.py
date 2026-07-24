"""
Test isnet-general-use model on specific problematic images
"""
from pathlib import Path
from rembg import remove, new_session
from PIL import Image
import io

session = new_session("isnet-general-use")

test_images = [
    "bleu-de-chanel-parfum",
    "dior-homme-sport",
    "gris-dior",
    "miss-dior-eau-de-parfum",
    "allure-homme-sport",
]

src = Path("src/assets/images/inspirations")
out = Path("tools/isnet_test")
out.mkdir(exist_ok=True)

for name in test_images:
    p = src / f"{name}.png"
    if not p.exists():
        print(f"NOT FOUND: {name}")
        continue
    result = remove(p.read_bytes(), session=session)
    (out / f"{name}.png").write_bytes(result)
    print(f"OK: {name}")

print(f"\nResults in {out.resolve()}")
