/**
 * Pruebas de las funciones de pago (Tilopay simulado — no hay red).
 * Correr:  node --test tests/tilopay/*.unit.mjs
 *
 * Las respuestas simuladas de Tilopay siguen la forma ASUMIDA en
 * functions/_lib/tilopay.js ([NO VERIFICADO]); estas pruebas validan nuestra
 * lógica (precios, firma, idempotencia, montos), no el contrato de Tilopay.
 * Ese se prueba a mano en el sandbox (docs/TILOPAY.md).
 */
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createD1, createKV } from './d1-shim.mjs';
import { onRequestPost as createOrder } from '../../functions/api/tilopay/create-order.js';
import { onRequestPost as webhook } from '../../functions/api/tilopay/webhook/[token].js';
import { onRequestGet as orderStatus } from '../../functions/api/tilopay/order-status.js';
import { resetTokenCache } from '../../functions/_lib/tilopay.js';

const TOKEN = 'a'.repeat(48);
const BASE = 'https://sandbox.tilopay.test/api/v1';
const ORIGIN = 'https://vency.test';

let env, calls, consultReply, logCalls;

beforeEach(() => {
  resetTokenCache();
  env = {
    DB: createD1(),
    VENCY_CATALOG: createKV({ unavailable: JSON.stringify(['agotado-test']) }),
    TILOPAY_ENV: 'sandbox',
    TILOPAY_BASE_URL: BASE,
    TILOPAY_API_USER: 'user',
    TILOPAY_API_PASSWORD: 'pass',
    TILOPAY_API_KEY: 'key',
    TILOPAY_WEBHOOK_TOKEN: TOKEN,
    ORDER_LOG_URL: 'https://sheets.test/exec',
    ORDER_LOG_TOKEN: 'token-del-sheet',
  };
  calls = [];
  logCalls = 0;
  consultReply = null;
  globalThis.fetch = async (url, init) => {
    const body = init?.body ? JSON.parse(init.body) : null;
    calls.push({ url: String(url), body });
    const ok = (data) => new Response(JSON.stringify(data), { status: 200 });
    if (url === BASE + '/login') return ok({ access_token: 'tok' });
    if (url === BASE + '/processPayment') return ok({ url: 'https://sandbox.tilopay.test/pay/xyz' });
    if (url === BASE + '/consult') return ok(consultReply(body));
    if (url === env.ORDER_LOG_URL) { logCalls++; return ok({}); }
    throw new Error('fetch inesperado: ' + url);
  };
});

const ctx = (request, params = {}) => ({ request, env, params, waitUntil: (p) => p });

function post(path, body, headers = { 'Content-Type': 'application/json' }) {
  return new Request(ORIGIN + path, { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) });
}

const customer = { name: 'Ana Pérez', email: 'ana@example.com', phone: '+506 8888-8888' };

async function newOrder(items = [{ id: 'absolu-authority', format: '100ml', quantity: 1 }], delivery = 'domicilio') {
  const res = await createOrder(ctx(post('/api/tilopay/create-order', { items, delivery, customer })));
  return { res, data: await res.json() };
}

async function notify(orderId, token = TOKEN, extra = '') {
  const req = post('/api/tilopay/webhook/' + token, `orderNumber=${orderId}${extra}`, {
    'Content-Type': 'application/x-www-form-urlencoded',
  });
  const res = await webhook(ctx(req, { token }));
  return { res, data: await res.json() };
}

async function statusOf(orderId) {
  const res = await orderStatus(ctx(new Request(ORIGIN + '/api/tilopay/order-status?id=' + orderId)));
  return (await res.json()).status;
}

const dbStatus = (id) => env.DB.raw.prepare('SELECT status FROM orders WHERE id = ?').get(id).status;

// ── Precios en el servidor ────────────────────────────────────────────────

test('el monto se calcula en el servidor (ignora precios del navegador): productos + envío, set de 3 decants', async () => {
  let { data } = await newOrder([{ id: 'absolu-authority', format: '100ml', quantity: 1, price: 1 }]);
  assert.equal(data.amount, 26900 + 2500);
  assert.equal(data.currency, 'CRC');
  const sent = calls.find((c) => c.url.endsWith('/processPayment')).body;
  assert.equal(sent.amount, '29400.00');
  assert.equal(sent.orderNumber, data.orderId);
  assert.match(sent.redirect, /\/carrito\?vorder=VA[0-9A-F]{16}$/);

  // 3 decants nicho → set ₡14 900; retiro en local → sin envío
  ({ data } = await newOrder([{ id: 'absolu-authority', format: 'decant', quantity: 3 }], 'local'));
  assert.equal(data.amount, 14900);

  // sobre ₡30 000 → envío gratis
  ({ data } = await newOrder([{ id: 'absolu-authority', format: '100ml', quantity: 2 }]));
  assert.equal(data.amount, 53800);
});

test('rechaza productos desconocidos, agotados y cantidades inválidas', async () => {
  assert.equal((await newOrder([{ id: 'no-existe', format: '30ml', quantity: 1 }])).res.status, 400);
  assert.equal((await newOrder([{ id: 'absolu-authority', format: '30ml', quantity: 0 }])).res.status, 400);
  assert.equal((await newOrder([{ id: 'absolu-authority', format: '30ml', quantity: 1.5 }])).res.status, 400);
  assert.equal((await newOrder([{ id: 'absolu-authority', format: 'galon', quantity: 1 }])).res.status, 400);
  env.VENCY_CATALOG = createKV({ unavailable: JSON.stringify(['absolu-authority']) });
  assert.equal((await newOrder()).res.status, 409);
});

test('producción queda bloqueada hasta marcar la integración como verificada', async () => {
  env.TILOPAY_ENV = 'production';
  assert.equal((await newOrder()).res.status, 503);
  env.TILOPAY_INTEGRATION_VERIFIED = 'true';
  assert.equal((await newOrder()).res.status, 200);
});

test('sin credenciales configuradas responde 503 y no llama a Tilopay', async () => {
  delete env.TILOPAY_API_KEY;
  assert.equal((await newOrder()).res.status, 503);
  assert.equal(calls.length, 0);
});

// ── Caso: pago aprobado ───────────────────────────────────────────────────

test('pago aprobado: el webhook verificado marca la orden como pagada', async () => {
  const { data } = await newOrder();
  assert.equal(await statusOf(data.orderId), 'processing'); // volver del navegador no la paga

  consultReply = (b) => ({ orderNumber: b.orderNumber, code: '1', amount: '29400.00', currency: 'CRC', auth: '123456' });
  const { res } = await notify(data.orderId);
  assert.equal(res.status, 200);
  assert.equal(dbStatus(data.orderId), 'paid');
  assert.equal(await statusOf(data.orderId), 'approved');
  assert.equal(logCalls, 1);
  assert.equal(calls.find((c) => c.url === env.ORDER_LOG_URL).body.token, 'token-del-sheet');
});

test('idempotencia: el mismo webhook dos veces (o una notificación distinta) no duplica el pedido', async () => {
  const { data } = await newOrder();
  consultReply = (b) => ({ orderNumber: b.orderNumber, code: '1', amount: 29400, currency: 'CRC' });
  await notify(data.orderId);
  const second = await notify(data.orderId);
  assert.equal(second.data.duplicate, true);
  await notify(data.orderId, TOKEN, '&extra=1'); // cuerpo distinto, misma orden
  assert.equal(logCalls, 1);
  assert.equal(dbStatus(data.orderId), 'paid');
});

test('idempotencia ante webhooks concurrentes: un solo efecto de "pagado"', async () => {
  const { data } = await newOrder();
  consultReply = (b) => ({ orderNumber: b.orderNumber, code: '1', amount: 29400, currency: 'CRC' });
  await Promise.all([notify(data.orderId), notify(data.orderId, TOKEN, '&n=2'), notify(data.orderId, TOKEN, '&n=3')]);
  assert.equal(logCalls, 1);
});

// ── Caso: pago rechazado ──────────────────────────────────────────────────

test('pago rechazado: la orden queda rechazada y no se registra pedido', async () => {
  const { data } = await newOrder();
  consultReply = (b) => ({ orderNumber: b.orderNumber, code: '0', amount: 29400, currency: 'CRC' });
  await notify(data.orderId);
  assert.equal(dbStatus(data.orderId), 'rejected');
  assert.equal(await statusOf(data.orderId), 'rejected');
  assert.equal(logCalls, 0);
});

// ── Caso: webhook con firma inválida ──────────────────────────────────────

test('webhook con firma inválida: 401, no consulta a Tilopay ni cambia la orden', async () => {
  const { data } = await newOrder();
  const before = calls.length;
  consultReply = () => { throw new Error('no debería consultarse'); };
  for (const bad of ['b'.repeat(48), 'a'.repeat(47), '', TOKEN + 'x']) {
    const { res } = await notify(data.orderId, bad);
    assert.equal(res.status, 401);
  }
  assert.equal(calls.length, before);
  assert.equal(dbStatus(data.orderId), 'pending');
  assert.equal(logCalls, 0);
});

// ── Validación de monto / moneda ──────────────────────────────────────────

test('monto o moneda distintos a la orden original: no se marca pagada', async () => {
  let { data } = await newOrder();
  consultReply = (b) => ({ orderNumber: b.orderNumber, code: '1', amount: '100.00', currency: 'CRC' });
  await notify(data.orderId);
  assert.equal(dbStatus(data.orderId), 'mismatch');
  assert.equal(await statusOf(data.orderId), 'error');

  ({ data } = await newOrder());
  consultReply = (b) => ({ orderNumber: b.orderNumber, code: '1', amount: '29400.00', currency: 'USD' });
  await notify(data.orderId);
  assert.equal(dbStatus(data.orderId), 'mismatch');
  assert.equal(logCalls, 0);
});

test('respuesta de consulta con forma desconocida: la orden sigue pendiente (falla cerrada)', async () => {
  const { data } = await newOrder();
  consultReply = () => ({ algo: 'inesperado' });
  await notify(data.orderId);
  assert.equal(dbStatus(data.orderId), 'pending');
  // y un reintento posterior con respuesta válida sí la procesa
  consultReply = (b) => ({ orderNumber: b.orderNumber, code: '1', amount: 29400, currency: 'CRC' });
  await notify(data.orderId);
  assert.equal(dbStatus(data.orderId), 'paid');
});

test('los logs solo contienen ID de orden y estado', async () => {
  const lines = [];
  const orig = console.log;
  console.log = (s) => lines.push(s);
  try {
    const { data } = await newOrder();
    consultReply = (b) => ({ orderNumber: b.orderNumber, code: '1', amount: 29400, currency: 'CRC', auth: '999' });
    await notify(data.orderId);
    await notify(data.orderId, 'x'.repeat(48));
  } finally {
    console.log = orig;
  }
  assert.ok(lines.length >= 3);
  for (const l of lines) {
    assert.deepEqual(Object.keys(JSON.parse(l)).sort(), ['orderId', 'status']);
    assert.ok(!/ana|example|8888|999|tok|pass/i.test(l), l);
  }
});
