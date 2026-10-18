/**
 * El formulario de personalización no sirve como relé de correo.
 * Correr:  node --test tests/security/*.unit.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as pers from '../../functions/api/personalizacion.js';

const base = { email: 'cliente@example.com', telefono: '88888888', fragancia: 'Sauvage', notas: 'cítricas' };

async function post(body, env = { RESEND_API_KEY: 'k' }) {
  const sent = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    if (String(url).includes('turnstile')) return Response.json({ success: init.body.get('response') === 'ok' });
    sent.push(JSON.parse(init.body));
    return Response.json({ id: 'x' });
  };
  try {
    const request = new Request('https://vency.test/api/personalizacion', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const res = await pers.onRequestPost({ request, env });
    return { res, sent };
  } finally {
    globalThis.fetch = realFetch;
  }
}

test('escapa el HTML del correo a Vency y no repite datos del visitante en la copia al cliente', async () => {
  const { res, sent } = await post({ ...base, notas: '<script>x</script>', mensaje: '<a href="https://evil">clic</a>' });
  assert.equal(res.status, 200);
  const toCustomer = sent.find((m) => m.to[0] === base.email);
  const toVency = sent.find((m) => m.to[0] !== base.email);
  assert.ok(toVency.html.includes('&lt;script&gt;'));
  assert.ok(!toVency.html.includes('<script>'));
  assert.ok(!toVency.html.includes('<a href="https://evil"'));
  for (const v of ['script', 'evil', 'Sauvage', 'cítricas']) assert.ok(!toCustomer.html.includes(v), v);
});

test('rechaza correo inválido, campos demasiado largos y tipos raros', async () => {
  assert.equal((await post({ ...base, email: 'no-es-correo' })).res.status, 400);
  assert.equal((await post({ ...base, mensaje: 'a'.repeat(1001) })).res.status, 400);
  assert.equal((await post({ ...base, notas: { html: 1 } })).res.status, 400);
  const { sent } = await post({ ...base, email: 'x' });
  assert.equal(sent.length, 0);
});

test('con TURNSTILE_SECRET exige un token válido', async () => {
  const env = { RESEND_API_KEY: 'k', TURNSTILE_SECRET: 's' };
  assert.equal((await post(base, env)).res.status, 403);
  assert.equal((await post({ ...base, turnstile: 'malo' }, env)).res.status, 403);
  assert.equal((await post({ ...base, turnstile: 'ok' }, env)).res.status, 200);
});
