/**
 * POST /api/tilopay/webhook/<TILOPAY_WEBHOOK_TOKEN>
 *
 * Recibe la notificación de pago de Tilopay. Es el ÚNICO lugar donde una
 * orden pasa a "paid".
 *
 * Verificación, en este orden y antes de tocar nada:
 *  1. Autenticidad: el último segmento de la URL debe ser igual (tiempo
 *     constante) al secreto TILOPAY_WEBHOOK_TOKEN, que solo conocen Cloudflare
 *     y la configuración de Tilopay. Si no coincide → 401, sin leer el cuerpo.
 *     La firma propia de Tilopay (OrderHash / encabezado) NO está documentada
 *     públicamente; cuando la obtengás, agregala aquí (ver docs/TILOPAY.md).
 *  2. El cuerpo solo se usa para saber qué orden consultar. El estado, monto
 *     y moneda se obtienen consultando a Tilopay servidor a servidor.
 *  3. Monto y moneda de Tilopay deben coincidir con la orden guardada.
 *  4. Idempotencia: notificaciones repetidas se ignoran, y el UPDATE
 *     condicional garantiza que el pedido se confirme una sola vez.
 */
import { tilopayConfig, consultOrder, extractOrderId, amountMatches, TilopayError } from '../../../_lib/tilopay.js';
import { getOrder, transition, webhookSeen, recordWebhook } from '../../../_lib/orders.js';
import { json, logOrder, timingSafeEqual, sha256Hex, ORDER_ID_RE } from '../../../_lib/util.js';

const MAX_BODY = 64 * 1024;

export async function onRequestPost(context) {
  const { request, env, params } = context;

  const secret = env.TILOPAY_WEBHOOK_TOKEN;
  const cfg = tilopayConfig(env);
  if (!secret || secret.length < 32 || !cfg || !env.DB) return json({ error: 'not_configured' }, 503);

  // 1. Autenticidad, antes de leer o procesar el cuerpo.
  if (!(await timingSafeEqual(String(params.token || ''), secret))) {
    logOrder(null, 'webhook_rejected_signature');
    return json({ error: 'unauthorized' }, 401);
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY) return json({ error: 'too_large' }, 413);

  const bodyHash = await sha256Hex(rawBody);
  if (await webhookSeen(env.DB, bodyHash)) return json({ ok: true, duplicate: true });

  const orderId = extractOrderId(rawBody, request.headers.get('content-type') || '');
  if (!orderId || !ORDER_ID_RE.test(orderId)) {
    logOrder(null, 'webhook_unknown_order');
    return json({ ok: true, ignored: true });
  }

  const order = await getOrder(env.DB, orderId);
  if (!order) {
    logOrder(orderId, 'webhook_unknown_order');
    return json({ ok: true, ignored: true });
  }
  if (order.status === 'paid' || order.status === 'mismatch') {
    await recordWebhook(env.DB, bodyHash, orderId, 'already_final');
    return json({ ok: true, duplicate: true });
  }

  // 2. Fuente de verdad: consulta servidor a servidor.
  let tx;
  try {
    tx = await consultOrder(cfg, orderId);
  } catch (e) {
    if (!(e instanceof TilopayError)) throw e;
    logOrder(orderId, 'webhook_consult_failed');
    return json({ error: 'consult_failed' }, 502); // 5xx para que Tilopay reintente (si reintenta)
  }

  let result;
  if (tx.state === 'approved') {
    // 3. Monto y moneda deben coincidir con la orden original.
    if (tx.currency !== order.currency || !amountMatches(tx.amount, order.amount)) {
      await transition(env.DB, orderId, ['pending', 'rejected'], 'mismatch');
      result = 'mismatch';
    } else if (await transition(env.DB, orderId, ['pending', 'rejected'], 'paid', { auth: tx.auth })) {
      // 4. Solo la notificación que efectivamente cambió la fila llega aquí.
      result = 'paid';
      await onOrderPaid(context, order);
    } else {
      result = 'already_paid';
    }
  } else if (tx.state === 'rejected') {
    result = (await transition(env.DB, orderId, ['pending'], 'rejected')) ? 'rejected' : 'no_change';
  } else {
    // Respuesta no reconocida: la orden sigue pendiente (falla cerrada). No se
    // registra el hash para que un reintento vuelva a consultar.
    logOrder(orderId, 'webhook_unverified_state');
    return json({ ok: true, pending: true });
  }

  await recordWebhook(env.DB, bodyHash, orderId, result);
  logOrder(orderId, result);
  return json({ ok: true });
}

/**
 * Efectos del pedido pagado. Se ejecuta UNA vez por orden.
 * Opcional: ORDER_LOG_URL = Web App de Apps Script (mismo formato que el
 * registro de pedidos del carrito, ver docs/ORDER-LOG-SHEET.md) y
 * ORDER_LOG_TOKEN = la propiedad TOKEN del script (vency-sheets.gs la exige).
 */
async function onOrderPaid(context, order) {
  const url = context.env.ORDER_LOG_URL;
  if (!url) return;
  const items = JSON.parse(order.items_json)
    .map((l) => `${l.id} · ${l.label}${l.quantity > 1 ? ' ×' + l.quantity : ''}`)
    .join(' | ');
  const send = fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      token: context.env.ORDER_LOG_TOKEN,
      ref: order.id, items, total: order.amount, pago: 'Tarjeta (Tilopay)',
      entrega: order.delivery, canal: 'Web', cliente: order.customer_name,
    }),
  }).catch(() => logOrder(order.id, 'order_log_failed'));
  if (context.waitUntil) context.waitUntil(send); else await send;
}
