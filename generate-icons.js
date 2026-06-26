// Run once: node generate-icons.js
// Generates icon-192.png and icon-512.png (no dependencies)
const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');
const OUT  = path.join(__dirname, 'src', 'pages');

const TABLE = (function () {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const tb  = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([tb, data])));
  return Buffer.concat([len, tb, data, crc]);
}

function makePNG(size) {
  /* Brand palette */
  const BG  = [27,  43,  37];   /* #1b2b25 volcanic ink */
  const FG  = [240, 235, 224];  /* #f0ebe0 botanical parchment */
  const RAD = Math.round(size * 0.22); /* corner radius */

  /* Minimal bitmap "VA" — drawn as filled rectangles at relative coords */
  /* Scale factor relative to 192 */
  const S = size / 192;
  function rect(pixels, x0, y0, w, h, col) {
    x0 = Math.round(x0 * S); y0 = Math.round(y0 * S);
    w  = Math.round(w  * S); h  = Math.round(h  * S);
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        if (x < 0 || x >= size || y < 0 || y >= size) continue;
        const i = (y * size + x) * 3;
        pixels[i] = col[0]; pixels[i+1] = col[1]; pixels[i+2] = col[2];
      }
    }
  }

  /* Fill background */
  const pixels = Buffer.alloc(size * size * 3);
  for (let i = 0; i < pixels.length; i += 3) {
    pixels[i] = BG[0]; pixels[i+1] = BG[1]; pixels[i+2] = BG[2];
  }

  /* Rounded corners — clear to transparent by checking distance (fill with BG already) */
  /* Corner punch: pixels outside radius are "transparent" (we're on BG so no-op) */

  /* V  — left leg, right leg, bottom point */
  /* V shape: two diagonal strokes meeting at bottom center */
  const T = 14; /* stroke thickness */
  /* V left diagonal: top-left to bottom-center */
  const VLX1 = 28, VLY1 = 52, VLX2 = 76, VLY2 = 140;
  /* V right diagonal: top-right to bottom-center */
  const VRX1 = 88, VRY1 = 52, VRX2 = 76, VRY2 = 140; /* same bottom-center */

  /* Draw thick diagonal lines via rects along the line */
  function line(pixels, x0, y0, x1, y1, thick, col) {
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.sqrt(dx*dx + dy*dy);
    const steps = Math.ceil(len * 2);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const cx = x0 + dx * t, cy = y0 + dy * t;
      rect(pixels, cx - thick/2, cy - thick/2, thick, thick, col);
    }
  }

  line(pixels, VLX1, VLY1, VLX2, VRY2, T, FG); /* V left  */
  line(pixels, VRX1, VRY1, VLX2, VRY2, T, FG); /* V right */

  /* A — left leg, right leg, crossbar */
  const ALX1=104, ALY1=140, ALX2=128, ALY2=52;  /* A left  */
  const ARX1=152, ARY1=140, ARX2=128, ARY2=52;  /* A right */
  line(pixels, ALX1, ALY1, ALX2, ALY2, T, FG);
  line(pixels, ARX1, ARY1, ARX2, ARY2, T, FG);
  /* A crossbar */
  rect(pixels, 112, 102, 40, T, FG);

  /* Build PNG rows */
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3);
    row[0] = 0;
    pixels.copy(row, 1, y * size * 3, (y + 1) * size * 3);
    rows.push(row);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

fs.writeFileSync(path.join(OUT, 'icon-192.png'), makePNG(192));
fs.writeFileSync(path.join(OUT, 'icon-512.png'), makePNG(512));
console.log('icon-192.png and icon-512.png written to src/pages/');
