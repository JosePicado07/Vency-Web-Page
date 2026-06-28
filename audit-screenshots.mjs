import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const PAGES = [
  { name: 'index',       path: '/' },
  { name: 'coleccion',   path: '/pages/coleccion.html' },
  { name: 'comprar',     path: '/pages/comprar.html' },
  { name: 'catalogo',    path: '/pages/catalogo.html' },
  { name: 'carrito',     path: '/pages/carrito.html' },
  { name: 'admin',       path: '/pages/admin.html' },
  { name: 'faq',         path: '/pages/faq.html' },
  { name: 'legal',       path: '/pages/legal.html' },
];

try { mkdirSync('audit-screenshots'); } catch (e) {}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await context.newPage();

const results = [];

for (const { name, path } of PAGES) {
  console.log(`\n=== ${name} ===`);
  await page.goto(`http://localhost:8000${path}`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(500);

  // Full-page screenshot
  await page.screenshot({ path: `audit-screenshots/${name}-full.png`, fullPage: true });

  // Viewport screenshot (what user sees first)
  await page.screenshot({ path: `audit-screenshots/${name}-viewport.png` });

  // Collect computed styles of all elements
  const info = await page.evaluate(() => {
    const data = [];
    const skipTags = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE', 'HEAD']);

    function walk(el, depth) {
      if (depth > 8) return;
      if (skipTags.has(el.tagName)) return;

      const tag = el.tagName.toLowerCase();
      const cls = el.className && typeof el.className === 'string' ? el.className.trim().slice(0, 80) : '';
      const id = el.id || '';
      const rect = el.getBoundingClientRect();

      // Skip tiny/invisible elements
      if (rect.width < 5 || rect.height < 5) return;
      if (rect.top > window.innerHeight + 500) return;

      const cs = getComputedStyle(el);
      data.push({
        tag, cls, id,
        rect: { w: Math.round(rect.width), h: Math.round(rect.height), t: Math.round(rect.top), l: Math.round(rect.left) },
        font: cs.fontSize + ' / ' + cs.fontFamily.split(',')[0].replace(/['"]/g, ''),
        color: cs.color,
        bg: cs.backgroundColor,
        display: cs.display,
        gap: cs.gap,
        padding: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(x => parseFloat(x)).join(' '),
        margin: [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].map(x => parseFloat(x)).join(' '),
      });

      for (const child of el.children) walk(child, depth + 1);
    }

    walk(document.body, 0);
    return data;
  });

  results.push({ name, elements: info });
  console.log(`  ${info.length} elements captured`);
}

// Write structured JSON
writeFileSync('audit-screenshots/data.json', JSON.stringify(results, null, 2));

// Generate a summary report
let report = '# Desktop Audit Report\n\n';
report += `Viewport: 1920×1080\n\n`;

for (const { name, elements } of results) {
  report += `## ${name}\n\n`;
  report += `Total elements: ${elements.length}\n\n`;

  // Find sections / large blocks
  const sections = elements.filter(e =>
    e.cls.includes('hero') || e.cls.includes('section') || e.cls.includes('header') ||
    e.cls.includes('footer') || e.cls.includes('grid') || e.cls.includes('inner') ||
    e.cls.includes('formats') || e.cls.includes('formats')
  );
  for (const s of sections) {
    report += `- \`.${s.cls}\` → ${s.rect.w}×${s.rect.h} at (${s.rect.l},${s.rect.t})\n`;
  }

  // Find cards / items
  const cards = elements.filter(e =>
    e.cls.includes('fmt-card') || e.cls.includes('dblock') || e.cls.includes('coll-block') ||
    e.cls.includes('cart-item') || e.cls.includes('sale-row') || e.cls.includes('process__step')
  );
  if (cards.length) {
    report += `\n### Cards (${cards.length})\n\n`;
    for (const c of cards) {
      report += `- \`.${c.cls.slice(0, 60)}\` → ${c.rect.w}×${c.rect.h} font:${c.font}\n`;
    }
  }

  report += '\n---\n\n';
}

writeFileSync('audit-screenshots/report.md', report);
console.log('\nDone — audit-screenshots/report.md written');

await browser.close();
