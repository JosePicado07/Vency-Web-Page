// Run once: node generate-icons.js
const sharp = require('sharp');
const path  = require('path');
const OUT   = path.join(__dirname, 'src', 'pages');

// Volcanic ink background, botanical parchment foreground
const BG = { r: 27,  g: 43,  b: 37  };

async function makeIcon(size) {
  const s = size / 192;
  const t = Math.round(14 * s); // stroke thickness

  // Draw "VA" as SVG — sharp renders it cleanly at any size
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="rgb(${BG.r},${BG.g},${BG.b})"/>
    <g stroke="rgb(240,235,224)" stroke-width="${t}" stroke-linecap="square" fill="none">
      <polyline points="${r(28,s)},${r(52,s)} ${r(76,s)},${r(140,s)} ${r(88,s)},${r(52,s)}"/>
      <polyline points="${r(104,s)},${r(140,s)} ${r(128,s)},${r(52,s)} ${r(152,s)},${r(140,s)}"/>
      <line x1="${r(112,s)}" y1="${r(109,s)}" x2="${r(152,s)}" y2="${r(109,s)}"/>
    </g>
  </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(path.join(OUT, `icon-${size}.png`));
  console.log(`icon-${size}.png written`);
}

function r(v, s) { return Math.round(v * s); }

Promise.all([makeIcon(192), makeIcon(512)]).catch(console.error);
