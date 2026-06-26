const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const BASE = 'https://scouts-brewery-widget.ngrok-free.dev/src/pages/admin.html';

  // Step 1: Load page — gate should show
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 20000 });
  // ngrok interstitial bypass
  await page.evaluate(() => { document.cookie = 'ngrok-skip-browser-warning=1'; });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.screenshot({ path: 'C:/Users/Jose/AppData/Local/Temp/admin-01-load.png', fullPage: true });
  const gateVisible = await page.isVisible('#js-gate');
  const appHidden   = !(await page.isVisible('#js-app'));
  console.log('1. Gate visible:', gateVisible, '| App hidden:', appHidden);

  // Step 2: Enter wrong token
  await page.fill('#js-gate-input', 'wrongtoken123');
  await page.click('#js-gate-btn');
  await page.waitForTimeout(3000);
  const errorShown = await page.isVisible('#js-gate-error');
  console.log('2. Error on bad token:', errorShown);
  await page.screenshot({ path: 'C:/Users/Jose/AppData/Local/Temp/admin-02-badtoken.png', fullPage: true });

  // Step 3: Enter real token from localStorage (simulate stored token)
  // We'll set localStorage directly and reload to skip prompt
  const token = await page.evaluate(() => localStorage.getItem('vency_seller_token'));
  console.log('3. Stored token in localStorage:', token ? 'EXISTS' : 'NONE');

  await browser.close();
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
