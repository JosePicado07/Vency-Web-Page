/**
 * Adaptador de Tilopay — el ÚNICO archivo que sabe cómo se le habla a Tilopay.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ NO VERIFICADO contra la documentación oficial.                           │
 * │                                                                          │
 * │ La doc oficial (tilopay.com/en/developers → "API · Hosted payment page"  │
 * │ y "Webhooks") no se pudo leer al escribir esto. Confirmado públicamente: │
 * │  - Flujo de página alojada: el servidor pide a la API una URL de pago,   │
 * │    redirige al cliente a esa página de Tilopay y recibe el resultado en  │
 * │    la URL de retorno.                                                    │
 * │  - No hay credenciales sandbox compartidas: cada desarrollador las       │
 * │    obtiene registrándose en web.tilopay.com/developers.                  │
 * │  - Existen endpoints POST /api/v1/loginSdk (SDK) y                       │
 * │    POST /api/v1/createLinkPayment (enlaces de pago, con `webhook_url`).  │
 * │ Todo lo marcado [NO VERIFICADO] sale de integraciones públicas de        │
 * │ terceros (plugins WooCommerce/Odoo) y DEBE confirmarse antes de          │
 * │ producción. Ver docs/TILOPAY.md.                                         │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Diseño a prueba de fallos: si la respuesta de Tilopay no tiene la forma
 * esperada, la orden queda "pending" (nunca se marca pagada por error).
 */

export class TilopayError extends Error {
  constructor(code) { super(code); this.code = code; }
}

/** Lee y valida la configuración. Nada de esto se manda nunca al navegador. */
export function tilopayConfig(env) {
  const cfg = {
    baseUrl: (env.TILOPAY_BASE_URL || '').replace(/\/+$/, ''),
    apiUser: env.TILOPAY_API_USER,
    apiPassword: env.TILOPAY_API_PASSWORD,
    apiKey: env.TILOPAY_API_KEY,
    environment: env.TILOPAY_ENV,
  };
  if (!cfg.baseUrl.startsWith('https://') || !cfg.apiUser || !cfg.apiPassword || !cfg.apiKey) return null;
  if (cfg.environment !== 'sandbox' && cfg.environment !== 'production') return null;
  return cfg;
}

// Token en memoria del isolate. [NO VERIFICADO] duración real del token;
// se renueva cada 10 min por precaución.
let tokenCache = null;
const TOKEN_TTL_MS = 10 * 60 * 1000;

async function call(fetchImpl, url, body, token) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  // [NO VERIFICADO] esquema "bearer <token>" en Authorization.
  if (token) headers.Authorization = 'bearer ' + token;
  let res;
  try {
    res = await fetchImpl(url, { method: 'POST', headers, body: JSON.stringify(body) });
  } catch {
    throw new TilopayError('network');
  }
  if (!res.ok) throw new TilopayError('http_' + res.status);
  try { return await res.json(); } catch { throw new TilopayError('bad_json'); }
}

async function getToken(cfg, fetchImpl) {
  if (tokenCache && tokenCache.baseUrl === cfg.baseUrl && tokenCache.exp > Date.now()) return tokenCache.token;
  // [NO VERIFICADO] POST {base}/login con { apiuser, password } → { access_token }.
  const data = await call(fetchImpl, cfg.baseUrl + '/login', { apiuser: cfg.apiUser, password: cfg.apiPassword });
  const token = data && typeof data.access_token === 'string' ? data.access_token : null;
  if (!token) throw new TilopayError('login_failed');
  tokenCache = { token, baseUrl: cfg.baseUrl, exp: Date.now() + TOKEN_TTL_MS };
  return token;
}

export function resetTokenCache() { tokenCache = null; }

/** [NO VERIFICADO] formato del monto: string con 2 decimales. */
function formatAmount(amountCRC) {
  return amountCRC.toFixed(2);
}

/**
 * Crea la orden de pago y devuelve la URL de la página alojada de Tilopay.
 * order: { id, amount, currency, customer: { name, email, phone } }
 */
export async function createPayment(cfg, order, returnUrl, fetchImpl = fetch) {
  const token = await getToken(cfg, fetchImpl);
  const [first, ...rest] = order.customer.name.trim().split(/\s+/);
  // [NO VERIFICADO] endpoint y TODOS los nombres de campo de esta petición.
  const data = await call(fetchImpl, cfg.baseUrl + '/processPayment', {
    redirect: returnUrl,
    key: cfg.apiKey,
    amount: formatAmount(order.amount),
    currency: order.currency,
    orderNumber: order.id,
    capture: '1',
    subscription: '0',
    platform: 'api',
    billToFirstName: first,
    billToLastName: rest.join(' ') || first,
    billToEmail: order.customer.email,
    billToTelephone: order.customer.phone || '',
    billToCountry: 'CR',
  }, token);
  // [NO VERIFICADO] la respuesta trae la URL de pago en `url`.
  const url = data && typeof data.url === 'string' ? data.url : null;
  if (!url || !/^https:\/\//.test(url)) throw new TilopayError('no_payment_url');
  return url;
}

/**
 * Consulta a Tilopay (servidor a servidor) el estado real de una orden.
 * Es la fuente de verdad: no se confía en el cuerpo de la notificación ni en
 * los parámetros de la URL de retorno.
 *
 * Devuelve { state: 'approved' | 'rejected' | 'unknown', amount, currency, auth }.
 */
export async function consultOrder(cfg, orderId, fetchImpl = fetch) {
  const token = await getToken(cfg, fetchImpl);
  // [NO VERIFICADO] endpoint de consulta por número de orden y sus campos.
  const data = await call(fetchImpl, cfg.baseUrl + '/consult', { key: cfg.apiKey, orderNumber: orderId }, token);
  return mapConsult(data, orderId);
}

/**
 * [NO VERIFICADO] forma de la respuesta de consulta. Se asume un objeto (o el
 * primero de una lista `response`) con `order`/`orderNumber`, `code`
 * ("1" = aprobado, según integraciones de terceros), `amount`, `currency`
 * y `auth`. Cualquier otra forma → 'unknown' (la orden sigue pendiente).
 */
export function mapConsult(data, orderId) {
  const unknown = { state: 'unknown', amount: null, currency: null, auth: null };
  const tx = Array.isArray(data?.response) ? data.response[0] : data;
  if (!tx || typeof tx !== 'object') return unknown;
  const order = tx.orderNumber ?? tx.order;
  if (order != null && String(order) !== orderId) return unknown;
  const amount = Number(tx.amount);
  const currency = typeof tx.currency === 'string' ? tx.currency.toUpperCase() : null;
  const auth = typeof tx.auth === 'string' ? tx.auth.slice(0, 64) : null;
  if (tx.code == null) return unknown;
  const code = String(tx.code);
  if (code === '1') {
    if (!Number.isFinite(amount) || !currency) return unknown;
    return { state: 'approved', amount, currency, auth };
  }
  return { state: 'rejected', amount: Number.isFinite(amount) ? amount : null, currency, auth: null };
}

/**
 * Extrae el número de orden del cuerpo de la notificación. Solo sirve para
 * saber QUÉ orden consultar; nada más del cuerpo se usa.
 * [NO VERIFICADO] formato del cuerpo (JSON o form-urlencoded) y nombre del campo.
 */
export function extractOrderId(rawBody, contentType = '') {
  let fields = null;
  try {
    if (contentType.includes('application/json')) fields = JSON.parse(rawBody);
    else fields = Object.fromEntries(new URLSearchParams(rawBody));
  } catch {
    return null;
  }
  if (!fields || typeof fields !== 'object') return null;
  const v = fields.orderNumber ?? fields.order ?? fields.order_number;
  return typeof v === 'string' || typeof v === 'number' ? String(v) : null;
}

/** El monto de Tilopay (decimal) coincide con el de la orden (colones enteros). */
export function amountMatches(tilopayAmount, orderAmountCRC) {
  return Math.round(tilopayAmount * 100) === orderAmountCRC * 100;
}
