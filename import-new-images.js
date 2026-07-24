// node import-new-images.js
// Copies new fragrance images from drive-download, converts to webp thumbnails.
const sharp = require('sharp');
const fs    = require('fs');
const path  = require('path');

const DRIVE = path.join(__dirname, 'drive-download-20260714T040311Z-1-001');
const DEST  = path.join(__dirname, 'src', 'assets', 'images', 'inspirations');
const WEBP  = path.join(DEST, '_webp');

// [relativeSourcePath, destinationSlug]
const IMAGES = [
  // ULTRA NICHOS
  ['Nicho Inclusiones/Ultra Nichos/Blamage Nasomatto.avif',       'blamage'],
  ['Nicho Inclusiones/Ultra Nichos/Megamare Orto Parisi.avif',    'megamare'],
  ['Nicho Inclusiones/Ultra Nichos/Terroni Orto Parisi.avif',     'terroni'],

  // NICHO — Creed
  ['Nicho Inclusiones/Creed/Absolu Aventus.avif',                 'absolu-aventus'],
  ['Nicho Inclusiones/Creed/Aventus.avif',                        'aventus'],
  ['Nicho Inclusiones/Creed/Carmina.avif',                        'carmina'],
  ['Nicho Inclusiones/Creed/Centaurus.avif',                      'centaurus'],
  ['Nicho Inclusiones/Creed/Green Irish Tweed.avif',              'green-irish-tweed'],
  ['Nicho Inclusiones/Creed/Ombre Nomade.avif',                   'ombre-nomade'],
  ['Nicho Inclusiones/Creed/Millésime Impérial.avif',             'millesime-imperial'],
  ['Nicho Inclusiones/Creed/Queen of Silk.avif',                  'queen-of-silk'],
  ['Nicho Inclusiones/Creed/Viking Cologne.avif',                 'viking-cologne'],

  // NICHO — By Kilian
  ['Nicho Inclusiones/By Kilian/Black Phantom.avif',              'black-phantom'],
  ['Nicho Inclusiones/By Kilian/Smoking Hot.avif',                'smoking-hot'],

  // NICHO — Byredo
  ['Nicho Inclusiones/Byredo/Tobacco Mandarin.avif',              'tobacco-mandarin'],

  // NICHO — Initio
  ['Nicho Inclusiones/Initio Parfums/Oud for Greatness.avif',     'oud-for-greatness'],
  ['Nicho Inclusiones/Initio Parfums/Oud for Greatness Neo.avif', 'oud-for-greatness-neo'],
  ['Nicho Inclusiones/Initio Parfums/Rehab.avif',                 'rehab'],
  ['Nicho Inclusiones/Initio Parfums/Side Effect.avif',           'side-effect'],

  // NICHO — Kajal
  ['Nicho Inclusiones/Kajal/Lamar.avif',                         'lamar'],

  // NICHO — Kayali
  ['Nicho Inclusiones/Kayali/Oudgasm Tobacco.avif',               'oudgasm-tobacco'],
  ['Nicho Inclusiones/Kayali/Vanilla Candy Rock Sugar.avif',      'vanilla-candy-rock-sugar'],

  // NICHO — Le Labo
  ['Nicho Inclusiones/Le Labo/Santal 33.avif',                    'santal-33'],

  // NICHO — Lorenzo Pazzaglia
  ['Nicho Inclusiones/Lorenzo Pazzaglia/Summer Hammer.avif',      'summer-hammer'],
  ['Nicho Inclusiones/Lorenzo Pazzaglia/Sun-gria.avif',           'sun-gria'],

  // NICHO — Louis Vuitton
  ['Nicho Inclusiones/Louis Vuitton/Attrape-Rêves.avif',          'attrape-reves'],
  ['Nicho Inclusiones/Louis Vuitton/Imagination.avif',            'imagination'],
  ['Nicho Inclusiones/Louis Vuitton/L\'Immensité.avif',           'l-immensite'],
  ['Nicho Inclusiones/Louis Vuitton/Ombre Nomade.avif',           'lv-ombre-nomade'],
  ['Nicho Inclusiones/Louis Vuitton/Pacific Chill.avif',          'pacific-chill'],
  ['Nicho Inclusiones/Louis Vuitton/Symphony.avif',               'symphony'],

  // NICHO — Maison Crivelli
  ['Nicho Inclusiones/Maison Crivelli/Oud Maracujá.avif',         'oud-maracuja'],

  // NICHO — MFK
  ['Nicho Inclusiones/Maison Francis Kurkdjian/Baccarat Rouge 540.avif', 'baccarat-rouge-540'],
  ['Nicho Inclusiones/Maison Francis Kurkdjian/Grand Soir.avif',  'grand-soir'],
  ['Nicho Inclusiones/Maison Francis Kurkdjian/Oud Satin Mood.avif', 'oud-satin-mood'],

  // NICHO — Maison Margiela
  ['Nicho Inclusiones/Maison Margiela/By the Fireplace.avif',     'by-the-fireplace'],
  ['Nicho Inclusiones/Maison Margiela/Jazz Club.avif',            'jazz-club'],

  // NICHO — Mancera
  ['Nicho Inclusiones/Mancera/Amore Caffè.avif',                  'amore-caffe'],
  ['Nicho Inclusiones/Mancera/Instant Crush.avif',                'instant-crush'],

  // NICHO — Matière Première
  ['Nicho Inclusiones/Matiere Premiere/Falcon Leather.avif',      'falcon-leather'],
  ['Nicho Inclusiones/Matiere Premiere/Vanilla Powder.avif',      'vanilla-powder'],

  // NICHO — New Notes
  ['Nicho Inclusiones/New Notes/Cocktail Maracuja.avif',          'cocktail-maracuja'],

  // NICHO — Parfums de Marly
  ['Nicho Inclusiones/Parfums de Marly/Delina.avif',              'delina'],
  ['Nicho Inclusiones/Parfums de Marly/Delina Exclusif.avif',     'delina-exclusif'],
  ['Nicho Inclusiones/Parfums de Marly/Pegasus.avif',             'pegasus'],

  // NICHO — Ramon Monegal
  ['Nicho Inclusiones/Ramon Monegal/Flamenco.avif',               'flamenco'],

  // NICHO — Roja
  ['Nicho Inclusiones/Roja/Elysium.avif',                         'elysium'],
  ['Nicho Inclusiones/Roja/Fetish.avif',                          'fetish'],

  // NICHO — Stéphane Humbert Lucas
  ['Nicho Inclusiones/Stéphane Humbert Lucas/God of Fire.avif',   'god-of-fire'],

  // NICHO — Tom Ford (nicho tier)
  ['Nicho Inclusiones/Tom Ford/Costa Azzurra.avif',               'costa-azzurra'],
  ['Nicho Inclusiones/Tom Ford/Lost Cherry.avif',                 'lost-cherry'],
  ['Nicho Inclusiones/Tom Ford/Noir.avif',                        'noir'],
  ['Nicho Inclusiones/Tom Ford/Noir Extreme.avif',                'noir-extreme'],

  // NICHO — Giardini di Toscana
  ['Nicho Inclusiones/Giardini Di Toscana/Binaco Latte.avif',     'bianco-latte'],

  // NICHO — Guerlain
  ['Nicho Inclusiones/Guerlain/Santal Pao Rosa.avif',             'santal-pao-rosa'],

  // NICHO — Bond No. 9
  ['Nicho Inclusiones/Bond No 9/TriBeCa.avif',                    'tribeca'],

  // DESIGNER HOMBRE
  ['Incluisiones Diseñador Hombre/Burberry/Hero.avif',            'hero'],
  ['Incluisiones Diseñador Hombre/Bvlgari/Aqva Pour Homme Marine.avif',   'aqva-pour-homme-marine'],
  ['Incluisiones Diseñador Hombre/Bvlgari/Bvlgari Man Extreme.avif',      'man-extreme'],
  ['Incluisiones Diseñador Hombre/Bvlgari/Bvlgari Man Rain Essence.avif', 'man-rain-essence'],
  ['Incluisiones Diseñador Hombre/Bvlgari/Bvlgari Pour Homme.avif',       'bvlgari-pour-homme'],
  ['Incluisiones Diseñador Hombre/Carolina Herrera/CH Men.avif',  'ch-men'],
  ['Incluisiones Diseñador Hombre/Chanel/Bleu de Chanel.avif',    'bleu-de-chanel'],
  ['Incluisiones Diseñador Hombre/Dior/Fahrenheit Cologne.avif',  'fahrenheit-cologne'],
  ['Incluisiones Diseñador Hombre/Dolce&Gabbana/Light Blue pour Homme.avif', 'light-blue-pour-homme'],
  ['Incluisiones Diseñador Hombre/Dolce&Gabbana/The One for Men.avif',    'the-one-for-men'],
  ['Incluisiones Diseñador Hombre/Giorgio Armani/Acqua di Gio.avif',      'acqua-di-gio'],
  ['Incluisiones Diseñador Hombre/Giorgio Armani/Armani Code Eau de Toilette.avif', 'armani-code'],
  ['Incluisiones Diseñador Hombre/Hugo Boss/Boss Bottled Night.avif',     'boss-bottled-night'],
  ['Incluisiones Diseñador Hombre/Hugo Boss/Hugo Boss Unlimited.avif',    'boss-unlimited'],
  ['Incluisiones Diseñador Hombre/Hugo Boss/Hugo Iced.avif',              'hugo-iced'],
  ['Incluisiones Diseñador Hombre/Issey Miyake/L_Eau d_Issey Pour Homme.avif', 'leau-dissey-homme'],
  ['Incluisiones Diseñador Hombre/Jean Paul Gaultier/Le Beau Le Parfum.avif', 'le-beau-le-parfum'],
  ['Incluisiones Diseñador Hombre/Rabanne/1 Million Elixir.avif', '1-million-elixir'],
  ['Incluisiones Diseñador Hombre/Rabanne/1 Million Lucky.avif',  '1-million-lucky'],
  ['Incluisiones Diseñador Hombre/Rabanne/Invictus Aqua.avif',    'invictus-aqua'],
  ['Incluisiones Diseñador Hombre/Rabanne/Phantom Parfum.avif',   'phantom-parfum'],
  ['Incluisiones Diseñador Hombre/Saint Laurent/M7.avif',          'm7'],
  ['Incluisiones Diseñador Hombre/Valentino/Born In Roma Intense.avif',   'born-in-roma-intense'],
  ['Incluisiones Diseñador Hombre/Valentino/Valentino Uomo Born in Roma EDT.avif', 'valentino-uomo-edt'],

  // DESIGNER MUJER
  ['Incluisones Diseñador Mujer/Ariana Grande/Thank U Next 2.0.avif',     'thank-u-next-2'],
  ['Incluisones Diseñador Mujer/Armani/Acqua di Gioia EDT.avif',          'acqua-di-gioia'],
  ['Incluisones Diseñador Mujer/Armani/Si.avif',                          'si'],
  ['Incluisones Diseñador Mujer/Armani/Sì Intense.avif',                  'si-intense'],
  ['Incluisones Diseñador Mujer/Carolina Herrera/Good Girl.avif',         'good-girl'],
  ['Incluisones Diseñador Mujer/Carolina Herrera/Good Girl Blush Elixir.avif', 'good-girl-blush-elixir'],
  ['Incluisones Diseñador Mujer/Carolina Herrera/La Bomba.avif',          'la-bomba'],
  ['Incluisones Diseñador Mujer/Chanel/Chance EDT.avif',                  'chance-edt'],
  ['Incluisones Diseñador Mujer/Chanel/Chanel No 5 L_Eau.avif',           'no5-leau'],
  ['Incluisones Diseñador Mujer/Chanel/Gabrielle.avif',                   'gabrielle'],
  ['Incluisones Diseñador Mujer/Dior/Miss Dior Parfum.avif',              'miss-dior-parfum'],
  ['Incluisones Diseñador Mujer/Dolce&Gabbana/Light Blue EDT.avif',       'light-blue-edt'],
  ['Incluisones Diseñador Mujer/Dolce&Gabbana/L_Imperatrice Limited Edition.avif', 'limperatrice'],
  ['Incluisones Diseñador Mujer/Dolce&Gabbana/The One.avif',              'the-one'],
  ['Incluisones Diseñador Mujer/Escada/Candy Love.avif',                  'candy-love'],
  ['Incluisones Diseñador Mujer/Escada/Fiesta Carioca.avif',              'fiesta-carioca'],
  ['Incluisones Diseñador Mujer/Escada/Miami Blossom.avif',               'miami-blossom'],
  ['Incluisones Diseñador Mujer/Escada/Taj Sunset.avif',                  'taj-sunset'],
  ['Incluisones Diseñador Mujer/Givenchy/Ange ou Demon.avif',             'ange-ou-demon'],
  ['Incluisones Diseñador Mujer/Givenchy/Organza.avif',                   'organza'],
  ['Incluisones Diseñador Mujer/Juicy Couture/Viva la Juicy.avif',        'viva-la-juicy'],
  ['Incluisones Diseñador Mujer/Lancôme/La Nuit Trésor.avif',             'la-nuit-tresor'],
  ['Incluisones Diseñador Mujer/Prada/Paradoxe Intense.avif',             'paradoxe-intense'],
  ['Incluisones Diseñador Mujer/Rabanne/Fame Couture.avif',               'fame-couture'],
  ['Incluisones Diseñador Mujer/Ralph Lauren/Ralph.avif',                 'ralph'],
  ['Incluisones Diseñador Mujer/Sabrina Carpenter/Sweet Tooth.avif',      'sweet-tooth'],
  ['Incluisones Diseñador Mujer/Valentino/Green Stravaganza.avif',        'green-stravaganza'],
  ['Incluisones Diseñador Mujer/Versace/Eros Pour Femme.avif',            'eros-pour-femme'],
];

async function run() {
  let ok = 0, skipped = 0, failed = 0;
  for (const [rel, slug] of IMAGES) {
    const src  = path.join(DRIVE, rel);
    const dest = path.join(DEST, slug + '.avif');
    const w400 = path.join(WEBP, slug + '-400.webp');
    const w200 = path.join(WEBP, slug + '-200.webp');

    if (!fs.existsSync(src)) {
      console.warn(`MISSING: ${rel}`);
      failed++;
      continue;
    }
    try {
      // Copy original avif
      fs.copyFileSync(src, dest);
      // Generate webp thumbnails
      await sharp(src).resize(400).webp({ quality: 82 }).toFile(w400);
      await sharp(src).resize(200).webp({ quality: 82 }).toFile(w200);
      console.log(`OK  ${slug}`);
      ok++;
    } catch (e) {
      console.error(`ERR ${slug}: ${e.message}`);
      failed++;
    }
  }
  console.log(`\nDone: ${ok} ok, ${skipped} skipped, ${failed} failed`);
}

run().catch(console.error);
