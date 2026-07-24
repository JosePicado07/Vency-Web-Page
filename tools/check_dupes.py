"""
check_dupes.py - Find fragrances that appear in both Vency icon-series (as inspiration)
AND in the external designer/nicho catalog. Also checks for duplicates within the external catalog.
"""
import re, unicodedata
from difflib import SequenceMatcher

def norm(t):
    t = unicodedata.normalize("NFD", t)
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9 ]", " ", t.lower()).strip()

def sim(a, b):
    return SequenceMatcher(None, norm(a), norm(b)).ratio()

# Vency icon-series: (vency_product_name, inspiration_name, inspiration_brand)
icon = [
    ("Absolu Authority",  "Aventus Absolu",      "Creed"),
    ("After Effect",      "Side Effect",         "Initio"),
    ("Apple Whisper",     "Layton",              "Parfums de Marly"),
    ("Aurum Mirage",      "Lamar",               "Kajal"),
    ("Cherry Desire",     "Carmina",             "Creed"),
    ("Citrus Melody",     "Symphony",            "Louis Vuitton"),
    ("Citrus Nirvana",    "Elysium",             "Roja"),
    ("Crush Effect",      "Instant Crush",       "Mancera"),
    ("Dark Sinner",       "Fetish",              "Roja"),
    ("Dream Trap",        "Attrape-Reves",       "Louis Vuitton"),
    ("Endless Horizon",   "L Immensite",         "Louis Vuitton"),
    ("Exotic Contrast",   "Oud Maracuja",        "Maison Crivelli"),
    ("Fireside Memory",   "By the Fireplace",    "Maison Margiela"),
    ("Fresh Coast",       "Pacific Chill",       "Louis Vuitton"),
    ("Fresh Signature",   "Bleu de Chanel",      "Chanel"),
    ("Golden Citrine",    "God of Fire",         "Stephane Humbert Lucas"),
    ("Golden Heritage",   "Naxos",               "Xerjoff"),
    ("Green Profile",     "Green Irish Tweed",   "Creed"),
    ("Inner Wild",        "Centaurus",           "Creed"),
    ("Jagger Index",      "Smoking Hot",         "By Kilian"),
    ("Last Light",        "Grand Soir",          "Maison Francis Kurkdjian"),
    ("Luminous Dream",    "Imagination",         "Louis Vuitton"),
    ("Midnight Coffee",   "Amore Cafe",          "Mancera"),
    ("Neutral State",     "Rehab",               "Initio"),
    ("Night Light",       "Jazz Club",           "Maison Margiela"),
    ("Nomad Ritual",      "Ombre Nomade",        "Louis Vuitton"),
    ("Phantom Ratio",     "Black Phantom",       "By Kilian"),
    ("Prime Authority",   "Aventus",             "Creed"),
    ("Private Reserve",   "X for Men",           "Clive Christian"),
    ("Queen Essence",     "Queen of Silk",       "Creed"),
    ("Rose Desire",       "Delina",              "Parfums de Marly"),
    ("Rouge Elixir",      "Baccarat Rouge 540",  "Maison Francis Kurkdjian"),
    ("Sacred Oud",        "Oud for Greatness",   "Initio"),
    ("Santal Code",       "Santal 33",           "Le Labo"),
    ("Santal Embrace",    "Santal Pao Rosa",     "Guerlain"),
    ("Shadow Leather",    "Ombre Leather",       "Tom Ford"),
    ("Silver Veil",       "Pegasus",             "Parfums de Marly"),
    ("Smoky Mandarin",    "Tobacco Mandarin",    "Byredo"),
    ("Vanille Skin",      "Vanilla Powder",      "Matiere Premiere"),
]

# External catalog entries (brand, name) — only those with images
ext = [
    ("ARMANI",             "Acqua di Gio Profondo"),
    ("CHANEL",             "Bleu de Chanel Parfum"),
    ("CHANEL",             "Allure Homme Sport"),
    ("CAROLINA HERRERA",   "Bad Boy"),
    ("CAROLINA HERRERA",   "212 VIP Men"),
    ("CAROLINA HERRERA",   "212 VIP Black"),
    ("HUGO BOSS",          "Boss Bottled"),
    ("HUGO BOSS",          "Boss Bottled Elixir"),
    ("HUGO BOSS",          "The Scent Elixir"),
    ("DIOR",               "Sauvage EDT"),
    ("DIOR",               "Sauvage Elixir"),
    ("DIOR",               "Dior Homme Sport"),
    ("PACO RABANNE",       "1 Million Golden Oud"),
    ("PACO RABANNE",       "Pure XS"),
    ("PACO RABANNE",       "Invictus Parfum"),
    ("PACO RABANNE",       "Invictus Platinum"),
    ("PACO RABANNE",       "Phantom Intense"),
    ("PACO RABANNE",       "Invictus Victory Elixir"),
    ("PRADA",              "Luna Rossa Carbon"),
    ("PRADA",              "Luna Rossa Ocean"),
    ("GUCCI",              "Gucci Pour Homme II"),
    ("MONTBLANC",          "Legend Spirit"),
    ("JEAN PAUL GAULTIER", "Scandal Pour Homme"),
    ("JEAN PAUL GAULTIER", "Le Beau"),
    ("JEAN PAUL GAULTIER", "Le Male"),
    ("JEAN PAUL GAULTIER", "Le Male Parfum"),
    ("JEAN PAUL GAULTIER", "Le Male Elixir"),
    ("JEAN PAUL GAULTIER", "Ultra Male"),
    ("JEAN PAUL GAULTIER", "Paradise Garden"),
    ("VALENTINO",          "Born in Roma Uomo"),
    ("VERSACE",            "Eros Parfum"),
    ("VERSACE",            "Eros Flame"),
    ("CAROLINA HERRERA",   "Very Good Girl"),
    ("CAROLINA HERRERA",   "Good Girl Blush"),
    ("CAROLINA HERRERA",   "Good Girl Supreme"),
    ("BURBERRY",           "Goddess Intense"),
    ("BURBERRY",           "Women"),
    ("BURBERRY",           "Her"),
    ("BURBERRY",           "Her Elixir"),
    ("DIOR",               "Miss Dior Blooming Bouquet"),
    ("DIOR",               "Miss Dior Eau de Parfum"),
    ("DIOR",               "Gris Dior"),
    ("DOLCE GABBANA",      "Devotion"),
    ("GIVENCHY",           "Very Irresistible"),
    ("GIVENCHY",           "Irresistible"),
    ("JEAN PAUL GAULTIER", "Divine"),
    ("JEAN PAUL GAULTIER", "Divine Le Parfum"),
    ("JEAN PAUL GAULTIER", "Scandal"),
    ("LANCÔME",            "La Vie Est Belle"),
    ("KIM KARDASHIAN",     "BFF"),
    ("VERSACE",            "Dylan Blue"),
    ("VERSACE",            "Dylan Purple"),
    ("VERSACE",            "Bright Crystal"),
    ("VALENTINO",          "Donna Born in Roma"),
    ("VALENTINO",          "Donna Yellow Dream"),
    ("VALENTINO",          "Donna Coral Fantasy"),
    ("ARIANA GRANDE",      "Thank U Next"),
    ("ARIANA GRANDE",      "Cloud"),
    ("ARIANA GRANDE",      "Cloud Pink"),
    ("YVES SAINT LAURENT", "Libre"),
    ("YVES SAINT LAURENT", "Black Opium"),
    ("CHANEL",             "Chance Eau Fraiche"),
    ("CHANEL",             "Chance Eau Tendre"),
    ("CHANEL",             "Coco Mademoiselle"),
    ("PACO RABANNE",       "Lady Million Royal"),
    ("PACO RABANNE",       "Fame"),
    ("PACO RABANNE",       "Fame Blooming Pink"),
    ("PARFUMS DE MARLY",   "Layton"),
    ("PARFUMS DE MARLY",   "Althair"),
    ("PARFUMS DE MARLY",   "Herod"),
    ("CLIVE CHRISTIAN",    "No 1 Imperial Men"),
    ("ILMIN",              "Il Femme"),
    ("ILMIN",              "Kakuno"),
    ("CREED",              "Silver Mountain Water"),
    ("CREED",              "Aventus For Her"),
    ("NISHANE",            "Hundred Silent Ways"),
    ("NISHANE",            "Shem"),
    ("NISHANE",            "Hacivat"),
    ("INITIO",             "Atomic Rose"),
    ("PENHALIGONS",        "Lord George"),
    ("STEPHANE HUMBERT LUCAS", "Soleil de Jeddah"),
    ("MAISON CRIVELLI",    "Oud Cadenza"),
    ("MAISON FRANCIS KURKDJIAN", "Oud Silk Mood"),
    ("MANCERA",            "Cedrat Boise"),
    ("MANCERA",            "Red Tobacco"),
    ("XERJOFF",            "XJ 1861"),
    ("XERJOFF",            "Erba Pura"),
    ("XERJOFF",            "Alexandria II"),
    ("XERJOFF",            "Levar del Sole"),
    ("TOM FORD",           "Tobacco Vanille"),
    ("TOM FORD",           "Soleil de Feu"),
    ("TOM FORD",           "Eau d Ombre Leather"),
    ("AMOUAGE",            "Interlude Black Iris"),
    ("AMOUAGE",            "Sunshine Woman"),
    ("KAJAL",              "Dahab"),
    ("KAJAL",              "Almaz"),
    ("BOND NO 9",          "Bleecker Street"),
    ("BOND NO 9",          "Lafayette Street"),
    ("BOND NO 9",          "Nolita"),
    ("BOND NO 9",          "Signature"),
    ("BOND NO 9",          "Scent of Peace"),
    ("FUGAZZI",            "Sugardaddy"),
    ("KAYALI",             "Eden Sparkling Lychee"),
    ("KAYALI",             "Pistachio Gelato"),
    ("KAYALI",             "Eden Juicy Apple"),
    ("MATIERE PREMIERE",   "Parisian Musc"),
    ("SPIRIT OF DUBAI",    "Turath"),
    ("EX NIHILO",          "Blue Talisman"),
    ("EX NIHILO",          "Outcast Blue"),
]

print("=" * 70)
print("CROSS-CATALOG DUPLICATES: Vency icon inspiration vs external catalog")
print("=" * 70)
found_cross = []
for vency_name, inspo_name, inspo_brand in icon:
    for ext_brand, ext_name in ext:
        ns = sim(inspo_name, ext_name)
        bs = sim(inspo_brand, ext_brand)
        if ns >= 0.75 and bs >= 0.55:
            found_cross.append((vency_name, inspo_name, inspo_brand, ext_brand, ext_name, ns, bs))

if found_cross:
    for vency, inspo, ibrand, ebrand, ename, ns, bs in found_cross:
        print(f"  Vency ICON   : \"{vency}\" (inspired by {ibrand} / {inspo})")
        print(f"  External cat : {ebrand} / {ename}")
        print()
else:
    print("  None found.\n")

print("=" * 70)
print("WITHIN external catalog: near-duplicate entries")
print("=" * 70)
seen = []
dups = []
for brand, name in ext:
    for b2, n2 in seen:
        ns = sim(name, n2)
        bs = sim(brand, b2)
        if ns >= 0.80 and bs >= 0.6 and not (name == n2 and brand == b2):
            pair = tuple(sorted([(brand, name), (b2, n2)]))
            if pair not in [tuple(sorted([tuple(x[:2]), tuple(x[2:4])])) for x in dups]:
                dups.append((brand, name, b2, n2, ns))
    seen.append((brand, name))

if dups:
    for b1, n1, b2, n2, s in dups:
        print(f"  \"{b1} / {n1}\"")
        print(f"  \"{b2} / {n2}\"  [name_sim={s:.2f}]")
        print()
else:
    print("  None found.")
