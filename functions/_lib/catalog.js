/**
 * Catálogo y precios del lado del servidor — la ÚNICA fuente que se usa para
 * calcular cuánto se cobra. El navegador solo manda id, formato y cantidad.
 *
 * Los montos están en colones enteros (CRC). Si cambiás precios en
 * src/scripts/fragrance-data.js (lo que ve el cliente), cambialos también aquí;
 * si no coinciden, el cliente verá un total y se le cobrará este.
 */
import { PRODUCT_TIERS } from './catalog-products.js';

export const CURRENCY = 'CRC';

export const PRICES = {
  decant: { vency: 6000, disenador: 5000, nicho: 6000, 'ultra-nicho': 6000 },
  set3:   { vency: 14900, disenador: 12900, nicho: 14900, 'ultra-nicho': 14900 },
  '30ml': { vency: 14900, disenador: 12900, nicho: 14900, 'ultra-nicho': 14900 },
  '100ml':{ vency: 26900, disenador: 23900, nicho: 26900, 'ultra-nicho': 26900 },
  shipping: 2500,
  freeShipping: 30000,
};

const TIERS = new Set(['vency', 'disenador', 'nicho', 'ultra-nicho']);
const FORMATS = new Set(['decant', '30ml', '100ml']);
const FORMAT_LABEL = { decant: 'Decant 10 ml', '30ml': 'Frasco 30 ml', '100ml': 'Frasco 100 ml' };

export const LIMITS = { maxLines: 30, maxQtyPerLine: 10, maxDecants: 30 };

export class CatalogError extends Error {
  constructor(code, detail) { super(code); this.code = code; this.detail = detail; }
}

/** Valida la forma del pedido que manda el navegador. Lanza CatalogError. */
export function parseItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new CatalogError('empty_cart');
  if (items.length > LIMITS.maxLines) throw new CatalogError('too_many_items');
  const merged = new Map();
  for (const it of items) {
    if (!it || typeof it !== 'object') throw new CatalogError('invalid_item');
    const { id, format, quantity } = it;
    if (typeof id !== 'string' || !/^[a-z0-9-]{1,100}$/.test(id)) throw new CatalogError('invalid_item');
    if (!FORMATS.has(format)) throw new CatalogError('invalid_item');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > LIMITS.maxQtyPerLine) {
      throw new CatalogError('invalid_quantity');
    }
    const key = id + ':' + format;
    merged.set(key, { id, format, quantity: (merged.get(key)?.quantity || 0) + quantity });
  }
  const lines = [...merged.values()];
  const decants = lines.filter((l) => l.format === 'decant').reduce((s, l) => s + l.quantity, 0);
  if (decants > LIMITS.maxDecants) throw new CatalogError('invalid_quantity');
  return lines;
}

/**
 * Nivel de precio de un producto: primero el catálogo fijo, luego las
 * fragancias que el admin aprobó (KV `catalog_requests_v1`, solo escribible
 * con ADMIN_TOKEN). Devuelve null si el producto no existe.
 */
export async function resolveTier(id, kv, cache) {
  if (Object.prototype.hasOwnProperty.call(PRODUCT_TIERS, id)) return PRODUCT_TIERS[id];
  if (!kv) return null;
  if (!cache.dynamic) {
    const raw = await kv.get('catalog_requests_v1');
    cache.dynamic = raw ? JSON.parse(raw) : [];
  }
  const slug = (s) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const entry = cache.dynamic.find(
    (e) => e.status === 'approved' && slug((e.brand || '').toUpperCase() + '-' + (e.name || '')) === id
  );
  if (!entry) return null;
  return TIERS.has(entry.cat) ? entry.cat : 'vency';
}

/**
 * Calcula el total con las mismas reglas que el carrito:
 * decants agrupados por nivel (cada 3 del mismo nivel = precio de set),
 * frascos a precio unitario, envío ₡2.500 a domicilio bajo ₡30.000.
 */
export async function priceOrder(lines, delivery, kv) {
  if (delivery !== 'domicilio' && delivery !== 'local') throw new CatalogError('invalid_delivery');

  const unavailable = new Set(kv ? JSON.parse((await kv.get('unavailable')) || '[]') : []);
  const cache = {};
  const priced = [];
  const decantsByTier = {};
  let subtotal = 0;

  for (const l of lines) {
    const tier = await resolveTier(l.id, kv, cache);
    if (!tier) throw new CatalogError('unknown_product', l.id);
    if (unavailable.has(l.id)) throw new CatalogError('unavailable', l.id);
    if (l.format === 'decant') {
      decantsByTier[tier] = (decantsByTier[tier] || 0) + l.quantity;
      priced.push({ ...l, tier, label: FORMAT_LABEL[l.format] });
    } else {
      const unit = PRICES[l.format][tier];
      subtotal += unit * l.quantity;
      priced.push({ ...l, tier, unit, label: FORMAT_LABEL[l.format] });
    }
  }
  for (const [tier, n] of Object.entries(decantsByTier)) {
    subtotal += Math.floor(n / 3) * PRICES.set3[tier] + (n % 3) * PRICES.decant[tier];
  }

  const shipping = delivery === 'domicilio' && subtotal < PRICES.freeShipping ? PRICES.shipping : 0;
  const total = subtotal + shipping;
  if (!Number.isSafeInteger(total) || total <= 0) throw new CatalogError('invalid_total');
  return { lines: priced, subtotal, shipping, total, currency: CURRENCY };
}
