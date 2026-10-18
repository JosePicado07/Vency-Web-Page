/**
 * GET  /api/inventory  — public, returns { inventory: { "id:decant": { oil_ml }, ... } }
 * POST /api/inventory  — admin, body: { tok, updates: { "id:decant": { oil_ml }, ... } }
 *                         merges `updates` into the stored map (partial update).
 *
 * This is the public-facing mirror of the admin's Google Sheets inventory —
 * the "sold out" badge on the catalog reads from here, not from the admin's
 * own browser storage, so stock updates are visible to every visitor instead
 * of only the browser that made the edit.
 */
import { requireAdmin } from '../_lib/auth.js';

const KV_KEY = 'inventory_v1';
const MAX_KEYS = 5000;
const KEY_RE = /^[^\x00-\x1f]{1,200}:[a-z0-9]{1,10}$/;

export async function onRequestGet(context) {
  const raw = await context.env.VENCY_CATALOG.get(KV_KEY);
  const inventory = raw ? JSON.parse(raw) : {};
  return Response.json({ inventory }, {
    headers: { 'Cache-Control': 'no-store' }
  });
}

export async function onRequestPost(context) {
  let body;
  try { body = await context.request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { tok, updates } = body || {};
  const denied = await requireAdmin(context.env, tok);
  if (denied) return denied;

  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return Response.json({ error: 'Missing updates' }, { status: 400 });
  }
  const entries = Object.entries(updates);
  if (entries.length > MAX_KEYS) return Response.json({ error: 'Too many entries' }, { status: 400 });

  // Keys mirror the Sheets "Inventario" column A ("slug:decant" or "Brand|Name:30ml").
  const clean = [];
  for (const [key, val] of entries) {
    const oil = val && Number(val.oil_ml), pct = val && val.pct;
    if (!KEY_RE.test(key) || !Number.isFinite(oil) || oil < 0 ||
        (pct != null && !Number.isFinite(Number(pct)))) {
      return Response.json({ error: 'Invalid entry' }, { status: 400 });
    }
    clean.push([key, pct != null ? { oil_ml: oil, pct: Number(pct) } : { oil_ml: oil }]);
  }

  const raw = await context.env.VENCY_CATALOG.get(KV_KEY);
  const inventory = raw ? JSON.parse(raw) : {};

  for (const [key, val] of clean) {
    inventory[key] = val;
  }
  if (Object.keys(inventory).length > MAX_KEYS) return Response.json({ error: 'Too many entries' }, { status: 400 });

  await context.env.VENCY_CATALOG.put(KV_KEY, JSON.stringify(inventory));
  return Response.json({ ok: true });
}
