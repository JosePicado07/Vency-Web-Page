"""
audit_catalog.py - Check that all catalog entries with images have the correct source photo.
Matches by product name+brand against source AVIFs, flags low-confidence assignments.
"""
import re, unicodedata
from difflib import SequenceMatcher
from pathlib import Path

def norm(t):
    t = unicodedata.normalize("NFD", t)
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9 ]", " ", t.lower()).strip()

def sim(a, b):
    return SequenceMatcher(None, norm(a), norm(b)).ratio()

originals = list(Path("drive-download-20260714T040311Z-1-001").rglob("*.avif"))

entries = [
    # (brand, product_name, png_slug)
    # --- DISENADOR HOMBRE ---
    ("ARMANI",             "Acqua di Gio Profondo",       "acqua-di-gio-profondo"),
    ("CHANEL",             "Bleu de Chanel Parfum",       "bleu-de-chanel-parfum"),
    ("CHANEL",             "Allure Homme Sport",          "allure-homme-sport"),
    ("CAROLINA HERRERA",   "Bad Boy",                     "bad-boy"),
    ("CAROLINA HERRERA",   "212 VIP Men",                 "212-vip-men"),
    ("CAROLINA HERRERA",   "212 VIP Black",               "212-vip-black"),
    ("HUGO BOSS",          "Boss Bottled",                "boss-bottled"),
    ("HUGO BOSS",          "Boss Bottled Elixir",         "boss-bottled-elixir"),
    ("HUGO BOSS",          "The Scent Elixir",            "the-scent-elixir"),
    ("DIOR",               "Sauvage EDT",                 "sauvage-edt"),
    ("DIOR",               "Sauvage Elixir",              "sauvage-elixir"),
    ("DIOR",               "Dior Homme Sport",            "dior-homme-sport"),
    ("PACO RABANNE",       "1 Million Golden Oud",        "1-million-golden-oud"),
    ("PACO RABANNE",       "Pure XS",                     "pure-xs"),
    ("PACO RABANNE",       "Invictus Parfum",             "invictus-parfum"),
    ("PACO RABANNE",       "Invictus Platinum",           "invictus-platinum"),
    ("PACO RABANNE",       "Phantom Intense",             "phantom-intense"),
    ("PACO RABANNE",       "Invictus Victory Elixir",     "invictus-victory-elixir"),
    ("PRADA",              "Luna Rossa Carbon",           "luna-rossa-carbon"),
    ("PRADA",              "Luna Rossa Ocean",            "luna-rossa-ocean"),
    ("GUCCI",              "Gucci Pour Homme II",         "gucci-pour-homme-ii"),
    ("MONTBLANC",          "Legend Spirit",               "legend-spirit"),
    ("JEAN PAUL GAULTIER", "Scandal Pour Homme",          "scandal-pour-homme"),
    ("JEAN PAUL GAULTIER", "Le Beau Le Parfum",           "le-beau"),
    ("JEAN PAUL GAULTIER", "Le Male",                     "le-male"),
    ("JEAN PAUL GAULTIER", "Le Male Le Parfum",           "le-male-parfum"),
    ("JEAN PAUL GAULTIER", "Le Male Elixir",              "le-male-elixir"),
    ("JEAN PAUL GAULTIER", "Ultra Male",                  "ultra-male"),
    ("JEAN PAUL GAULTIER", "Paradise Garden",             "paradise-garden"),
    ("VALENTINO",          "Born In Roma Intense",        "born-in-roma-uomo"),
    ("VERSACE",            "Eros Parfum",                 "eros-parfum"),
    ("VERSACE",            "Eros Flame",                  "eros-flame"),
    # --- DISENADOR MUJER ---
    ("CAROLINA HERRERA",   "Very Good Girl",              "very-good-girl"),
    ("CAROLINA HERRERA",   "Good Girl Blush",             "good-girl-blush"),
    ("CAROLINA HERRERA",   "Good Girl Supreme",           "good-girl-supreme"),
    ("BURBERRY",           "Goddess Intense",             "goddess-intense"),
    ("BURBERRY",           "Women",                       "women"),
    ("BURBERRY",           "Burberry Her",                "her"),
    ("BURBERRY",           "Burberry Her Elixir",         "her-elixir"),
    ("DIOR",               "Miss Dior Blooming Bouquet",  "miss-dior-blooming-bouquet"),
    ("DIOR",               "Miss Dior Parfum",            "miss-dior-eau-de-parfum"),
    ("DIOR",               "Gris Dior",                   "gris-dior"),
    ("DOLCE GABBANA",      "Devotion",                    "devotion"),
    ("GIVENCHY",           "Very Irresistible",           "very-irresistible"),
    ("GIVENCHY",           "Irresistible",                "irresistible"),
    ("JEAN PAUL GAULTIER", "Divine",                      "divine"),
    ("JEAN PAUL GAULTIER", "Divine Le Parfum",            "divine-le-parfum"),
    ("JEAN PAUL GAULTIER", "Scandal",                     "scandal"),
    ("LANCÔME",            "La Vie Est Belle",            "la-vie-est-belle"),
    ("KIM KARDASHIAN",     "BFF",                         "bff"),
    ("VERSACE",            "Dylan Blue",                  "dylan-blue-femme"),
    ("VERSACE",            "Dylan Purple",                "dylan-purple"),
    ("VERSACE",            "Bright Crystal",              "bright-crystal"),
    ("VALENTINO",          "Donna Born In Roma",          "donna-born-in-roma"),
    ("VALENTINO",          "Donna Yellow Dream",          "donna-yellow-dream"),
    ("VALENTINO",          "Donna Coral Fantasy",         "donna-coral-fantasy"),
    ("ARIANA GRANDE",      "Thank U Next",                "thank-u-next"),
    ("ARIANA GRANDE",      "Cloud",                       "cloud"),
    ("ARIANA GRANDE",      "Cloud Pink",                  "cloud-pink"),
    ("YVES SAINT LAURENT", "Libre",                       "libre"),
    ("YVES SAINT LAURENT", "Black Opium",                 "black-opium"),
    ("CHANEL",             "Chance Eau Fraiche",          "chance-eau-fraiche"),
    ("CHANEL",             "Chance Eau Tendre",           "chance-eau-tendre"),
    ("CHANEL",             "Coco Mademoiselle",           "coco-mademoiselle"),
    ("PACO RABANNE",       "Lady Million Royal",          "lady-million-royal"),
    ("PACO RABANNE",       "Fame",                        "fame"),
    ("PACO RABANNE",       "Fame Blooming Pink",          "fame-blooming-pink"),
    # --- NICHO ---
    ("PARFUMS DE MARLY",   "Althair",                     "althair"),
    ("PARFUMS DE MARLY",   "Herod",                       "herod"),
    ("CLIVE CHRISTIAN",    "No 1 Imperial Men",           "no-1-imperial-men"),
    ("ILMIN",              "Il Femme",                    "il-femme"),
    ("ILMIN",              "Il Kakuno",                   "kakuno"),
    ("CREED",              "Silver Mountain Water",       "silver-mountain-water"),
    ("CREED",              "Aventus For Her",             "aventus-for-her"),
    ("NISHANE",            "Hundred Silent Ways",         "hundred-silent-ways"),
    ("NISHANE",            "Shem",                        "shem"),
    ("NISHANE",            "Hacivat",                     "hacivat"),
    ("INITIO",             "Atomic Rose",                 "atomic-rose"),
    ("PENHALIGONS",        "Tragedy of Lord George",      "lord-george"),
    ("STEPHANE HUMBERT LUCAS", "Soleil de Jeddah",        "soleil-de-jeddah"),
    ("MAISON CRIVELLI",    "Oud Cadenza",                 "oud-cadenza"),
    ("MAISON FRANCIS KURKDJIAN", "Oud Silk Mood",         "oud-silk-mood"),
    ("MANCERA",            "Cedrat Boise",                "cedrat-boise"),
    ("MANCERA",            "Red Tobacco",                 "red-tobacco"),
    # --- ULTRA NICHO ---
    ("XERJOFF",            "XJ 1861 Naxos",               "xj-1861"),
    ("XERJOFF",            "Erba Pura",                   "erba-pura"),
    ("XERJOFF",            "Alexandria II",               "alexandria-ii"),
    ("XERJOFF",            "Levar del Sole",              "levar-del-sole"),
    ("TOM FORD",           "Tobacco Vanille",             "tobacco-vanille"),
    ("TOM FORD",           "Soleil de Feu",               "soleil-de-feu"),
    ("TOM FORD",           "Eau d Ombre Leather",         "eau-d-ombre-leather"),
    ("AMOUAGE",            "Interlude Black Iris",        "interlude-black-iris"),
    ("AMOUAGE",            "Sunshine Woman",              "sunshine-woman"),
    ("KAJAL",              "Dahab",                       "dahab"),
    ("KAJAL",              "Almaz",                       "almaz"),
    ("BOND NO 9",          "Bleecker Street",             "bleecker-street"),
    ("BOND NO 9",          "Lafayette Street",            "lafayette-street"),
    ("BOND NO 9",          "Nolita",                      "nolita"),
    ("BOND NO 9",          "Signature",                   "signature"),
    ("BOND NO 9",          "The Scent of Peace",          "scent-of-peace"),
    ("FUGAZZI",            "Sugardaddy",                  "sugardaddy"),
    ("KAYALI",             "Eden Sparkling Lychee",       "eden-sparkling-lychee"),
    ("KAYALI",             "Pistachio Gelato",            "pistachio-gelato"),
    ("KAYALI",             "Eden Juicy Apple",            "eden-juicy-apple"),
    ("MATIERE PREMIERE",   "Parisian Musc",               "parisian-musc"),
    ("SPIRIT OF DUBAI",    "Turath",                      "turath"),
    ("EX NIHILO",          "Blue Talisman",               "blue-talisman"),
    ("EX NIHILO",          "Outcast Blue",                "outcast-blue"),
]

print(f"{'SLUG':<35} {'EXPECTED':<35} {'BEST MATCH':<38} SCORE  FLAG")
print("-" * 130)

issues = []
for brand, name, slug in entries:
    query = name + " " + brand
    best, best_score = None, 0
    for orig in originals:
        candidate = orig.stem + " " + orig.parent.name
        s = max(sim(query, candidate), sim(name, orig.stem))
        if s > best_score:
            best_score = s
            best = orig
    flag = ""
    if best_score < 0.7:
        flag = " *** LOW"
        issues.append((slug, name, brand, best.stem if best else "none", best_score))
    elif best_score < 0.9:
        flag = " ~ check"
        issues.append((slug, name, brand, best.stem if best else "none", best_score))
    match_str = ((best.stem[:25] + " (" + best.parent.name[:10] + ")") if best else "NONE")
    print(f"{slug:<35} {name:<35} {match_str:<38} {best_score:.2f}{flag}")

print(f"\n=== {len(issues)} items to review ===")
for slug, name, brand, matched, score in issues:
    print(f"  {score:.2f}  {slug:<35}  expected: {name} / {brand}")
    print(f"           {'':35}  matched:  {matched}")
