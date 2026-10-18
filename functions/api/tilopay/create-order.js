/**
 * POST /api/tilopay/create-order
 * Body: {
 *   items:    [{ id, format: 'decant' | '30ml' | '100ml', quantity }],
 *   delivery: 'domicilio' | 'local',
 *   customer: { name, email, phone? }
 * }
 * Returns: { orderId, amount, currency, url } — `url` es la página de pago de Tilopay.
 *
 * El precio NUNCA viene del navegador: se calcula aquí con functions/_lib/catalog.js.
 *
 * Bindings / variables (Cloudflare Pages → Settings): DB (D1), VENCY_CATALOG (KV),
 * TILOPAY_ENV, TILOPAY_BASE_URL, TILOPAY_API_USER, TILOPAY_API_PASSWORD,
 * TILOPAY_API_KEY, TILOPAY_INTEGRATION_VERIFIED (solo producción).
 */
import { parseItems, priceOrder, CatalogError } from '../../_lib/catalog.js';
import { tilopayConfig, createPayment, TilopayError } from '../../_lib/tilopay.js';
import { insertOrder, transition } from '../../_lib/orders.js';
import { json, logOrder, newOrderId, EMAIL_RE } from '../../_lib/util.js';

function parseCustomer(c) {
  if (!c || typeof c !== 'object') return null;
  const name = typeof c.name === 'string' ? c.name.trim().replace(/\s+/g, ' ') : '';
  const email = typeof c.email === 'string' ? c.email.trim() : '';
  const phone = typeof c.phone === 'string' ? c.phone.replace(/[^\d+]/g, '') : '';
  if (name.length < 2 || name.length > 80 || /[<>]/.test(name)) return null;
  if (email.length > 120 || !EMAIL_RE.test(email)) return null;
  if (phone.length > 16) return null;
  return { name, email, phone };
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const cfg = tilopayConfig(env);
  if (!cfg || !env.DB) return json({ error: 'payments_not_configured' }, 503);
  // Freno de seguridad: producción solo se habilita cuando alguien confirmó el
  // adaptador contra la documentación oficial (ver docs/TILOPAY.md).
  if (cfg.environment === 'production' && env.TILOPAY_INTEGRATION_VERIFIED !== 'true') {
    return json({ error: 'payments_not_configured' }, 503);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: 'invalid_json' }, 400); }

  const customer = parseCustomer(body && body.customer);
  if (!customer) return json({ error: 'invalid_customer' }, 400);

  let priced;
  try {
    const lines = parseItems(body.items);
    priced = await priceOrder(lines, body.delivery, env.VENCY_CATALOG);
  } catch (e) {
    if (e instanceof CatalogError) {
      const status = e.code === 'unavailable' ? 409 : 400;
      return json({ error: e.code, ...(e.detail ? { item: e.detail } : {}) }, status);
    }
    throw e;
  }

  const order = {
    id: newOrderId(),
    amount: priced.total,
    currency: priced.currency,
    subtotal: priced.subtotal,
    shipping: priced.shipping,
    delivery: body.delivery,
    lines: priced.lines,
    customer,
  };
  await insertOrder(env.DB, order);
  logOrder(order.id, 'pending');

  // `vorder` (no `order`) para no chocar con parámetros que agregue Tilopay.
  const returnUrl = new URL('/carrito', request.url);
  returnUrl.searchParams.set('vorder', order.id);

  let url;
  try {
    url = await createPayment(cfg, order, returnUrl.toString());
  } catch (e) {
    await transition(env.DB, order.id, ['pending'], 'init_failed');
    logOrder(order.id, 'init_failed');
    if (e instanceof TilopayError) return json({ error: 'gateway_error' }, 502);
    throw e;
  }

  return json({ orderId: order.id, amount: order.amount, currency: order.currency, url });
}
