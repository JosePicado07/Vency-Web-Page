/**
 * Las rutas de escritura del admin exigen ADMIN_TOKEN y fallan cerradas.
 * Correr:  node --test tests/security/*.unit.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createKV } from '../tilopay/d1-shim.mjs';
import * as availability from '../../functions/api/availability.js';
import * as archive from '../../functions/api/catalog-archive.js';
import * as inventory from '../../functions/api/inventory.js';
import * as catalogRequest from '../../functions/api/catalog-request.js';

const ADMIN = 'clave-admin-de-prueba-1234';

function req(path, method, body, headers = { 'Content-Type': 'application/json' }) {
  return new Request('https://vency.test' + path, {
    method, headers, body: body == null ? undefined : (typeof body === 'string' || body instanceof FormData ? body : JSON.stringify(body)),
  });
}
const ctx = (request, env) => ({ request, env, params: {} });

const writes = [
  ['availability', (b) => availability.onRequestPost(ctx(req('/api/availability', 'POST', b), env)), { id: 'absolu-authority', available: false }],
  ['catalog-archive (archivar)', (b) => archive.onRequestPost(ctx(req('/api/catalog-archive', 'POST', b), env)), { id: 'absolu-authority', archived: true }],
  ['catalog-archive (borrar)', (b) => archive.onRequestPost(ctx(req('/api/catalog-archive', 'POST', b), env)), { id: 'absolu-authority', deleted: true }],
  ['inventory', (b) => inventory.onRequestPost(ctx(req('/api/inventory', 'POST', b), env)), { updates: { 'x:decant': { oil_ml: 1 } } }],
  ['catalog-request PATCH', (b) => catalogRequest.onRequest(ctx(req('/api/catalog-request', 'PATCH', b), env)), { id: 'nope', action: 'delete' }],
];

let env;
const fresh = (extra = {}) => { env = { VENCY_CATALOG: createKV(), ADMIN_TOKEN: ADMIN, ...extra }; };

for (const [name, call, body] of writes) {
  test(`${name}: sin token o con token incorrecto → 401 y sin escribir`, async () => {
    fresh();
    const kvBefore = JSON.stringify([...(await Promise.all(['unavailable', 'archived_base_ids', 'deleted_base_ids', 'inventory_v1', 'catalog_requests_v1'].map((k) => env.VENCY_CATALOG.get(k))))]);
    for (const tok of [undefined, '', 'x', ADMIN + 'x', ADMIN.slice(0, -1)]) {
      const res = await call({ ...body, ...(tok === undefined ? {} : { tok }) });
      assert.equal(res.status, 401, `tok=${tok}`);
    }
    const kvAfter = JSON.stringify([...(await Promise.all(['unavailable', 'archived_base_ids', 'deleted_base_ids', 'inventory_v1', 'catalog_requests_v1'].map((k) => env.VENCY_CATALOG.get(k))))]);
    assert.equal(kvAfter, kvBefore);
  });

  test(`${name}: sin ADMIN_TOKEN configurado → 503 (no acepta cualquier token)`, async () => {
    fresh({ ADMIN_TOKEN: undefined });
    assert.equal((await call({ ...body, tok: 'cualquier-cosa-larga' })).status, 503);
    fresh({ ADMIN_TOKEN: 'corto' });
    assert.equal((await call({ ...body, tok: 'corto' })).status, 503);
  });
}

test('con el token correcto las escrituras funcionan', async () => {
  fresh();
  assert.equal((await availability.onRequestPost(ctx(req('/api/availability', 'POST', { id: 'absolu-authority', available: false, tok: ADMIN }), env))).status, 200);
  assert.deepEqual(JSON.parse(await env.VENCY_CATALOG.get('unavailable')), ['absolu-authority']);
  assert.equal((await archive.onRequestPost(ctx(req('/api/catalog-archive', 'POST', { id: 'absolu-authority', deleted: true, tok: ADMIN }), env))).status, 200);
  assert.deepEqual(JSON.parse(await env.VENCY_CATALOG.get('deleted_base_ids')), ['absolu-authority']);
});

test('ids con formato inválido se rechazan', async () => {
  fresh();
  for (const id of ['', 'A B', '<script>', 'x'.repeat(101), 123]) {
    const res = await availability.onRequestPost(ctx(req('/api/availability', 'POST', { id, available: false, tok: ADMIN }), env));
    assert.equal(res.status, 400);
  }
});

test('catalog-request POST multipart exige token', async () => {
  fresh();
  const fd = new FormData();
  fd.set('brand', 'X'); fd.set('name', 'Y'); fd.set('cat', 'nicho'); fd.set('tok', 'malo');
  const res = await catalogRequest.onRequest(ctx(new Request('https://vency.test/api/catalog-request', { method: 'POST', body: fd }), env));
  assert.equal(res.status, 401);
  assert.equal(await env.VENCY_CATALOG.get('catalog_requests_v1'), null);
});

test('catalog-request GET ?all=1 solo devuelve todo con el encabezado X-Admin-Token correcto (no por la URL)', async () => {
  fresh();
  await env.VENCY_CATALOG.put('catalog_requests_v1', JSON.stringify([{ id: 'a', status: 'approved' }, { id: 'b', status: 'archived' }]));
  const get = (path, headers = {}) => catalogRequest.onRequest(ctx(new Request('https://vency.test' + path, { headers }), env)).then((r) => r.json());
  assert.equal((await get('/api/catalog-request?all=1&tok=' + ADMIN)).length, 1);
  assert.equal((await get('/api/catalog-request?all=1', { 'X-Admin-Token': 'malo' })).length, 1);
  assert.equal((await get('/api/catalog-request?all=1', { 'X-Admin-Token': ADMIN })).length, 2);
});

test('el endpoint de Stripe que confiaba en el precio del navegador ya no existe', async () => {
  await assert.rejects(import('../../functions/api/checkout.js'));
});
