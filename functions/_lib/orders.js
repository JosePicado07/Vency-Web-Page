/**
 * Acceso a las órdenes en D1 (binding `DB`). Las transiciones de estado usan
 * UPDATE condicionales: si dos notificaciones llegan a la vez, solo una
 * cambia la fila (meta.changes === 1) y solo esa dispara el "pedido pagado".
 */

const now = () => new Date().toISOString();

export async function insertOrder(db, o) {
  const ts = now();
  await db.prepare(
    `INSERT INTO orders (id, status, amount, currency, subtotal, shipping, delivery, items_json,
       customer_name, customer_email, customer_phone, created_at, updated_at)
     VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    o.id, o.amount, o.currency, o.subtotal, o.shipping, o.delivery, JSON.stringify(o.lines),
    o.customer.name, o.customer.email, o.customer.phone || null, ts, ts
  ).run();
}

export function getOrder(db, id) {
  return db.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
}

/** Cambia el estado solo si el actual está en `from`. Devuelve true si cambió la fila. */
export async function transition(db, id, from, to, extra = {}) {
  const ts = now();
  const placeholders = from.map(() => '?').join(', ');
  const res = await db.prepare(
    `UPDATE orders SET status = ?, updated_at = ?,
       paid_at = CASE WHEN ? = 'paid' THEN ? ELSE paid_at END,
       tilopay_auth = COALESCE(?, tilopay_auth)
     WHERE id = ? AND status IN (${placeholders})`
  ).bind(to, ts, to, ts, extra.auth || null, id, ...from).run();
  return res.meta.changes === 1;
}

export async function webhookSeen(db, bodyHash) {
  return !!(await db.prepare('SELECT 1 FROM webhook_events WHERE body_sha256 = ?').bind(bodyHash).first());
}

export async function recordWebhook(db, bodyHash, orderId, result) {
  await db.prepare(
    'INSERT OR IGNORE INTO webhook_events (body_sha256, order_id, result, received_at) VALUES (?, ?, ?, ?)'
  ).bind(bodyHash, orderId, result, now()).run();
}
