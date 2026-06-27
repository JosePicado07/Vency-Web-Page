/**
 * Vency Atelier — image build.
 *
 * Reads every PNG/JPG under src/assets/images/, writes WebP siblings at three
 * widths (400/800/1200) into src/assets/images/<same-subpath>/_webp/. Skips
 * sources smaller than the target width (no upscale). Reruns are idempotent
 * — only writes when the output is missing or older than the source.
 *
 * Usage:
 *   npm i sharp
 *   node build-images.js          # process everything
 *   node build-images.js --force  # rebuild even if up-to-date
 */
const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('sharp not installed. Run:  npm i sharp');
  process.exit(1);
}

const ROOT = path.join(__dirname, 'src', 'assets', 'images');
const WIDTHS = [400, 800, 1200];
const FORCE = process.argv.includes('--force');

function walk(dir, out) {
  out = out || [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '_webp' || entry.name === 'formats') continue;
      walk(full, out);
    } else if (/\.(png|jpe?g)$/i.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

async function processOne(srcPath) {
  const dir = path.dirname(srcPath);
  const base = path.basename(srcPath).replace(/\.(png|jpe?g)$/i, '');
  const outDir = path.join(dir, '_webp');
  fs.mkdirSync(outDir, { recursive: true });

  const srcStat = fs.statSync(srcPath);
  const meta = await sharp(srcPath).metadata();
  const widthsToWrite = WIDTHS.filter(w => w <= meta.width);
  if (widthsToWrite.length === 0) widthsToWrite.push(meta.width);

  let wrote = 0;
  let skipped = 0;
  for (const w of widthsToWrite) {
    const outPath = path.join(outDir, `${base}-${w}.webp`);
    if (!FORCE && fs.existsSync(outPath) && fs.statSync(outPath).mtimeMs >= srcStat.mtimeMs) {
      skipped++;
      continue;
    }
    await sharp(srcPath)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 78, effort: 5 })
      .toFile(outPath);
    wrote++;
  }
  return { wrote, skipped, widths: widthsToWrite };
}

(async () => {
  if (!fs.existsSync(ROOT)) {
    console.error('No images directory:', ROOT);
    process.exit(1);
  }
  const sources = walk(ROOT);
  console.log(`Found ${sources.length} source images. Writing WebP at widths [${WIDTHS.join(', ')}]${FORCE ? ' (forced)' : ''}.`);

  let totalWrote = 0;
  let totalSkipped = 0;
  let totalBytesIn = 0;
  let totalBytesOut = 0;

  for (const src of sources) {
    try {
      const inSize = fs.statSync(src).size;
      const { wrote, skipped, widths } = await processOne(src);
      totalWrote += wrote;
      totalSkipped += skipped;
      if (wrote > 0) {
        totalBytesIn += inSize;
        for (const w of widths) {
          const outPath = path.join(path.dirname(src), '_webp', path.basename(src).replace(/\.(png|jpe?g)$/i, `-${w}.webp`));
          if (fs.existsSync(outPath)) totalBytesOut += fs.statSync(outPath).size;
        }
        console.log(`  ${path.relative(__dirname, src)}  →  ${wrote} written, ${skipped} fresh`);
      }
    } catch (err) {
      console.error(`  ${path.relative(__dirname, src)}  ✗ ${err.message}`);
    }
  }

  console.log('');
  console.log(`Done. ${totalWrote} files written, ${totalSkipped} already fresh.`);
  if (totalBytesIn > 0) {
    const ratio = (totalBytesOut / totalBytesIn * 100).toFixed(1);
    console.log(`Bytes:  source ${(totalBytesIn / 1e6).toFixed(1)} MB  →  webp ${(totalBytesOut / 1e6).toFixed(1)} MB  (${ratio}%)`);
  }
})();
