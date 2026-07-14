"""
assign_images.py — Match processed product images to catalog entries and copy them.
Run from project root:  python tools/assign_images.py
"""

import re
import shutil
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────
ROOT       = Path(__file__).parent.parent
IMG_SRC    = ROOT / "drive-download-20260714T040311Z-1-001-output"
IMG_DST    = ROOT / "src/assets/images/inspirations"
CATALOG_JS = ROOT / "src/scripts/catalogo-data.js"

IMG_DST.mkdir(parents=True, exist_ok=True)

# ── Helpers ────────────────────────────────────────────────────────────────
def slugify(text: str) -> str:
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = text.lower()
    text = re.sub(r"['\"\$&]", "", text)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")

def normalize(text: str) -> str:
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9 ]", " ", text.lower()).strip()

def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, normalize(a), normalize(b)).ratio()

# ── Catalog entries (brand, name) ──────────────────────────────────────────
CATALOG = [
    ("ARMANI",                  "Acqua di Giò Profondo"),
    ("ARMANI",                  "Vert Malachite"),
    ("CHANEL",                  "Bleu de Chanel Parfum"),
    ("CHANEL",                  "Allure Homme Sport"),
    ("CAROLINA HERRERA",        "Bad Boy"),
    ("CAROLINA HERRERA",        "212 VIP Men"),
    ("CAROLINA HERRERA",        "212 VIP Black"),
    ("HUGO BOSS",               "Boss Bottled"),
    ("HUGO BOSS",               "Boss Bottled Elixir"),
    ("HUGO BOSS",               "The Boss"),
    ("HUGO BOSS",               "The Scent"),
    ("HUGO BOSS",               "The Scent Elixir"),
    ("DIOR",                    "Sauvage EDT"),
    ("DIOR",                    "Sauvage Elixir"),
    ("DIOR",                    "Dior Homme Sport"),
    ("PACO RABANNE",            "1 Million Golden Oud"),
    ("PACO RABANNE",            "Pure XS"),
    ("PACO RABANNE",            "Invictus Parfum"),
    ("PACO RABANNE",            "Invictus Platinum"),
    ("PACO RABANNE",            "Phantom Intense"),
    ("PACO RABANNE",            "Invictus Victory Elixir"),
    ("VIKTOR & ROLF",           "Spicebomb Extreme"),
    ("PRADA",                   "Luna Rossa Carbon"),
    ("PRADA",                   "Luna Rossa Ocean"),
    ("GUCCI",                   "Gucci Pour Homme II"),
    ("MONTBLANC",               "Starwalker"),
    ("MONTBLANC",               "Legend Spirit"),
    ("JEAN PAUL GAULTIER",      "Scandal Pour Homme"),
    ("JEAN PAUL GAULTIER",      "Le Beau"),
    ("JEAN PAUL GAULTIER",      "Le Male"),
    ("JEAN PAUL GAULTIER",      "Le Male Parfum"),
    ("JEAN PAUL GAULTIER",      "Le Male Elixir"),
    ("JEAN PAUL GAULTIER",      "Ultra Male"),
    ("JEAN PAUL GAULTIER",      "Paradise Garden"),
    ("PHILIPP PLEIN",           "No Limit$"),
    ("VALENTINO",               "Born in Roma Uomo"),
    ("YVES SAINT LAURENT",      "Y"),
    ("VERSACE",                 "Eros Parfum"),
    ("VERSACE",                 "Eros Flame"),
    # Mujer
    ("CAROLINA HERRERA",        "Very Good Girl"),
    ("CAROLINA HERRERA",        "Good Girl Blush"),
    ("CAROLINA HERRERA",        "Good Girl Suprême"),
    ("BURBERRY",                "Goddess Intense"),
    ("BURBERRY",                "Women"),
    ("BURBERRY",                "Her"),
    ("BURBERRY",                "Her Elixir"),
    ("DIOR",                    "Miss Dior Blooming Bouquet"),
    ("DIOR",                    "Miss Dior Eau de Parfum"),
    ("DIOR",                    "Gris Dior"),
    ("DOLCE & GABBANA",         "Devotion"),
    ("GIVENCHY",                "Very Irresistible"),
    ("GIVENCHY",                "Irresistible"),
    ("JEAN PAUL GAULTIER",      "Divine"),
    ("JEAN PAUL GAULTIER",      "Divine Le Parfum"),
    ("JEAN PAUL GAULTIER",      "Scandal"),
    ("LANCÔME",                 "La Vie Est Belle"),
    ("LANCÔME",                 "La Vie Est Belle L'Élixir"),
    ("KIM KARDASHIAN",          "BFF"),
    ("VERSACE",                 "Dylan Blue Femme"),
    ("VERSACE",                 "Dylan Purple"),
    ("VERSACE",                 "Bright Crystal"),
    ("VALENTINO",               "Donna Born in Roma"),
    ("VALENTINO",               "Donna Yellow Dream"),
    ("VALENTINO",               "Donna Coral Fantasy"),
    ("ARIANA GRANDE",           "Thank U Next"),
    ("ARIANA GRANDE",           "Cloud"),
    ("ARIANA GRANDE",           "Cloud Pink"),
    ("YVES SAINT LAURENT",      "Libre"),
    ("YVES SAINT LAURENT",      "Black Opium"),
    ("CHANEL",                  "Chance Eau Fraîche"),
    ("CHANEL",                  "Chance Eau Tendre"),
    ("CHANEL",                  "Coco Mademoiselle"),
    ("PACO RABANNE",            "Lady Million Royal"),
    ("PACO RABANNE",            "Fame"),
    ("PACO RABANNE",            "Fame Blooming Pink"),
    ("VICTORIA'S SECRET",       "Bombshell"),
    ("VICTORIA'S SECRET",       "Eau So Sexy"),
    # Nicho
    ("PARFUMS DE MARLY",        "Layton"),
    ("PARFUMS DE MARLY",        "Althaïr"),
    ("PARFUMS DE MARLY",        "Percival"),
    ("PARFUMS DE MARLY",        "Herod"),
    ("PARFUMS DE MARLY",        "Valaya"),
    ("CLIVE CHRISTIAN",         "No. 1 Imperial Men"),
    ("BY KILIAN",               "Angels' Share"),
    ("BY KILIAN",               "Angels' Share Paradis"),
    ("ILMIN",                   "Il Femme"),
    ("ILMIN",                   "Kakuno"),
    ("CREED",                   "Silver Mountain Water"),
    ("CREED",                   "Aventus For Her"),
    ("NISHANE",                 "Hundred Silent Ways"),
    ("NISHANE",                 "Shem"),
    ("NISHANE",                 "Hacivat"),
    ("INITIO",                  "Atomic Rose"),
    ("PENHALIGON'S",            "Lord George"),
    ("STÉPHANE HUMBERT LUCAS",  "Soleil de Jeddah"),
    ("MAISON CRIVELLI",         "Oud Cadenza"),
    ("MAISON FRANCIS KURKDJIAN","Oud Silk Mood"),
    ("MANCERA",                 "Cedrat Boise"),
    ("MANCERA",                 "Red Tobacco"),
    # Ultra-nicho
    ("XERJOFF",                 "XJ 1861"),
    ("XERJOFF",                 "Erba Pura"),
    ("XERJOFF",                 "Alexandria II"),
    ("XERJOFF",                 "Italica (2021)"),
    ("XERJOFF",                 "Bouquet Ideale"),
    ("XERJOFF",                 "Levar del Sole"),
    ("TOM FORD",                "Black Orchid"),
    ("TOM FORD",                "Tobacco Vanille"),
    ("TOM FORD",                "Noir de Noir"),
    ("TOM FORD",                "Soleil de Feu"),
    ("TOM FORD",                "Eau d'Ombré Leather"),
    ("TOM FORD",                "Electric Cherry"),
    ("AMOUAGE",                 "Interlude Black Iris"),
    ("AMOUAGE",                 "Sunshine Woman"),
    ("TAUER PERFUMES",          "Corazón del Desierto"),
    ("KAJAL",                   "Dahab"),
    ("KAJAL",                   "Almaz"),
    ("BOND NO. 9",              "Bleecker Street"),
    ("BOND NO. 9",              "Lafayette Street"),
    ("BOND NO. 9",              "Nolita"),
    ("BOND NO. 9",              "Signature"),
    ("BOND NO. 9",              "Scent of Peace"),
    ("ACQUA DI PARMA",          "Bergamotto di Calabria"),
    ("FUGAZZI",                 "Sugardaddy"),
    ("KAYALI",                  "Eden Sparkling Lychee"),
    ("KAYALI",                  "Pistachio Gelato"),
    ("KAYALI",                  "Eden Juicy Apple"),
    ("MATIÈRE PREMIÈRE",        "Parisian Musc"),
    ("SPIRIT OF DUBAI",         "Turath"),
    ("EX NIHILO",               "Blue Talisman"),
    ("EX NIHILO",               "Outcast Blue"),
]

# ── Build image index ───────────────────────────────────────────────────────
# Each image: { 'name': stem, 'brand': folder, 'path': Path }
images = []
for p in IMG_SRC.rglob("*.png"):
    parts = p.relative_to(IMG_SRC).parts
    if len(parts) >= 2:
        brand_folder = parts[-2]
        images.append({"name": p.stem, "brand": brand_folder, "path": p})

print(f"Images available: {len(images)}")
print(f"Catalog entries:  {len(CATALOG)}")
print()

# ── Match ───────────────────────────────────────────────────────────────────
matched   = []   # (catalog_entry, image, slug)
unmatched = []

for brand, name in CATALOG:
    slug = slugify(name)
    best_score = 0
    best_img   = None

    for img in images:
        score = similarity(name, img["name"])
        # Bonus if brand words overlap
        brand_words = set(normalize(brand).split())
        img_brand_words = set(normalize(img["brand"]).split())
        if brand_words & img_brand_words:
            score += 0.05
        if score > best_score:
            best_score = score
            best_img   = img

    if best_img and best_score >= 0.55:
        matched.append(((brand, name), best_img, slug, best_score))
    else:
        unmatched.append(((brand, name), best_img, best_score if best_img else 0))

# ── Copy images ─────────────────────────────────────────────────────────────
slug_map = {}   # (brand, name) → slug

for (brand, name), img, slug, score in matched:
    dst = IMG_DST / f"{slug}.png"
    shutil.copy2(img["path"], dst)
    slug_map[(brand, name)] = slug
    print(f"  OK  [{score:.2f}]  {name!r:35s} <- {img['name']!r}")

print()
print(f"Matched:   {len(matched)}")
print(f"Unmatched: {len(unmatched)}")

if unmatched:
    print("\nNo match found for:")
    for (brand, name), best_img, score in unmatched:
        best = f"best={best_img['name']!r} ({score:.2f})" if best_img else "no candidate"
        print(f"  ?? {brand} — {name!r}  ({best})")

# ── Patch catalogo-data.js ───────────────────────────────────────────────────
js = CATALOG_JS.read_text(encoding="utf-8")

def add_image_field(js_text, brand, name, slug):
    image_val = f"'../assets/images/inspirations/{slug}.png'"
    # Pattern: match the object entry for this brand+name
    # Look for: name: 'NAME', and add image: '...' before the closing }
    # We'll find the entry by brand+name and insert image if not already there
    b_esc = re.escape(brand)
    n_esc = re.escape(name)
    pattern = (
        r"(\{[^}]*brand:\s*'" + b_esc + r"'[^}]*name:\s*'" + n_esc + r"'[^}]*?)"
        r"(\s*\})"
    )
    def replacer(m):
        body = m.group(1)
        if "image:" in body:
            return m.group(0)  # already has image, skip
        return body + f", image: {image_val}" + m.group(2)
    return re.sub(pattern, replacer, js_text, count=1)

for (brand, name), slug in slug_map.items():
    js = add_image_field(js, brand, name, slug)

CATALOG_JS.write_text(js, encoding="utf-8")
print(f"\ncatalgo-data.js updated with {len(slug_map)} image fields.")
