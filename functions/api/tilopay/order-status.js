/**
 * GET /api/tilopay/order-status?id=VA…
 * Returns: { status: 'processing' | 'approved' | 'rejected' | 'error' }
 *
 * Solo lee lo que dejó el webhook verificado; los parámetros que Tilopay
 * agrega a la URL de retorno del navegador no se usan para nada.
 * No devuelve montos ni datos del cliente.
 */
import { getOrder } from '../../_lib/orders.js';
import { json, ORDER_ID_RE } from '../../_lib/util.js';

const PUBLIC_STATUS = {
  pending: 'processing',
  paid: 'approved',
  rejected: 'rejected',
  mismatch: 'error',
  init_failed: 'error',
};

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.DB) return json({ error: 'payments_not_configured' }, 503);
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!ORDER_ID_RE.test(id)) return json({ error: 'invalid_id' }, 400);
  const order = await getOrder(env.DB, id);
  if (!order) return json({ error: 'not_found' }, 404);
  return json({ status: PUBLIC_STATUS[order.status] || 'error' });
}
