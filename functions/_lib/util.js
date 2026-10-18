/** Utilidades compartidas por las funciones de pago. */

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

/**
 * Único punto de log de los pagos: solo ID de orden y estado. Nunca pasar aquí
 * cuerpos de petición, datos del cliente, tokens ni respuestas de Tilopay.
 */
export function logOrder(orderId, status) {
  console.log(JSON.stringify({ orderId: orderId || null, status }));
}

/** Comparación de strings en tiempo constante (vía HMAC, sin depender de APIs no estándar). */
export async function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', crypto.getRandomValues(new Uint8Array(32)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const [ha, hb] = await Promise.all([
    crypto.subtle.sign('HMAC', key, enc.encode(a)),
    crypto.subtle.sign('HMAC', key, enc.encode(b)),
  ]);
  const va = new Uint8Array(ha), vb = new Uint8Array(hb);
  let diff = a.length === b.length ? 0 : 1;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** ID de orden: "VA" + 16 hex aleatorios (64 bits) — no adivinable, solo alfanumérico. */
export function newOrderId() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return 'VA' + [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export const ORDER_ID_RE = /^VA[0-9A-F]{16}$/;

export const EMAIL_RE = /^[^\s@<>()",;]{1,64}@[^\s@<>()",;]{1,180}\.[a-z]{2,}$/i;

/** Escapa texto para insertarlo en HTML (correos). */
export function escHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
