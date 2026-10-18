/**
 * Con el token correcto, las escrituras del admin igual validan lo que guardan.
 * Correr:  node --test tests/security/*.unit.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createKV } from '../tilopay/d1-shim.mjs';
import * as inventory from '../../functions/api/inventory.js';
import * as catalogRequest from '../../functions/api/catalog-request.js';
import * as catalogImage from '../../functions/api/catalog-image/[id].js';

const ADMIN = 'clave-admin-de-prueba-1234';
const PNG = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0, 0, 0, 0, 0]);
let env;
const fresh = () => { env = { VENCY_CATALOG: createKV(), ADMIN_TOKEN: ADMIN }; };

const postInventory = (body) => inventory.onRequestPost({
  env, request: new Request('https://vency.test/api/inventory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
});

function postEntry(fields, image) {
  const fd = new FormData();
  fd.set('tok', ADMIN);
  for (const [k, v] of Object.entries({ brand: 'Marca', name: 'Nombre', cat: 'nicho', ...fields })) fd.set(k, v);
  if (image) fd.set('image', image);
  return catalogRequest.onRequest({ env, request: new Request('https://vency.test/api/catalog-request', { method: 'POST', body: fd }) });
}

test('inventory: cuerpo null → 401, no 500', async () => {
  fresh();
  const res = await inventory.onRequestPost({ env, request: new Request('https://vency.test/api/inventory', { method: 'POST', body: 'null' }) });
  assert.equal(res.status, 401);
});

test('inventory: rechaza claves y valores inválidos sin escribir; acepta las claves reales del Sheet', async () => {
  fresh();
  for (const updates of [{ 'sin-formato': { oil_ml: 1 } }, { 'x:decant': { oil_ml: 'mucho' } }, { 'x:decant': { oil_ml: -1 } }, { 'x:decant': '<b>' }, ['x']]) {
    assert.equal((await postInventory({ tok: ADMIN, updates })).status, 400, JSON.stringify(updates));
  }
  assert.equal(await env.VENCY_CATALOG.get('inventory_v1'), null);
  const ok = await postInventory({ tok: ADMIN, updates: { 'absolu-authority:decant': { oil_ml: 30, pct: 20, extra: 'x' }, 'Dior|Sauvage Elixir:30ml': { oil_ml: 5 } } });
  assert.equal(ok.status, 200);
  assert.deepEqual(JSON.parse(await env.VENCY_CATALOG.get('inventory_v1')), {
    'absolu-authority:decant': { oil_ml: 30, pct: 20 },
    'Dior|Sauvage Elixir:30ml': { oil_ml: 5 },
  });
});

test('catalog-request: cat, gender, badge y largos se validan', async () => {
  fresh();
  for (const f of [{ cat: 'gratis' }, { gender: 'otro' }, { badge: '<b>x</b>' }, { brand: 'x'.repeat(81) }, { notes: 'x'.repeat(501) }, { cat: '' }]) {
    assert.equal((await postEntry(f)).status, 400, JSON.stringify(f));
  }
  assert.equal(await env.VENCY_CATALOG.get('catalog_requests_v1'), null);
  assert.equal((await postEntry({ cat: 'creacion-propia', gender: 'mujer', badge: 'inspirado-en' })).status, 200);
});

test('catalog-request: solo acepta imágenes reales; SVG/HTML se rechazan aunque digan image/*', async () => {
  fresh();
  assert.equal((await postEntry({}, new File(['<svg onload=alert(1)/>'], 'a.svg', { type: 'image/svg+xml' }))).status, 400);
  assert.equal((await postEntry({ name: 'B' }, new File(['<html>'], 'a.png', { type: 'image/png' }))).status, 400);
  assert.equal(await env.VENCY_CATALOG.get('catalog_requests_v1'), null);

  const res = await postEntry({ name: 'C' }, new File([PNG], 'a.jpg', { type: 'text/html' }));
  assert.equal(res.status, 200);
  const [entry] = JSON.parse(await env.VENCY_CATALOG.get('catalog_requests_v1'));
  const img = await catalogImage.onRequest({ env, params: { id: entry.imageId } });
  assert.equal(img.headers.get('Content-Type'), 'image/png'); // el tipo sale de los bytes, no del navegador
  assert.equal(img.headers.get('X-Content-Type-Options'), 'nosniff');
});

test('catalog-image: un archivo viejo guardado como text/html se sirve como descarga', async () => {
  fresh();
  await env.VENCY_CATALOG.put('catalog_img_old1', new Uint8Array([60]).buffer, { metadata: { mime: 'text/html' } });
  const res = await catalogImage.onRequest({ env, params: { id: 'old1' } });
  assert.equal(res.headers.get('Content-Type'), 'application/octet-stream');
  assert.match(res.headers.get('Content-Security-Policy'), /default-src 'none'/);
  assert.equal((await catalogImage.onRequest({ env, params: { id: '../x' } })).status, 404);
});
