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
const KV_KEY = 'inventory_v1';

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

  const { tok, updates } = body;
  const validTok = context.env.ADMIN_TOKEN;
  if (validTok && tok !== validTok) return Response.json({ error: 'unauthorized' }, { status: 401 });
  if (!validTok && !tok) return Response.json({ error: 'unauthorized' }, { status: 401 });

  if (!updates || typeof updates !== 'object') {
    return Response.json({ error: 'Missing updates' }, { status: 400 });
  }

  const raw = await context.env.VENCY_CATALOG.get(KV_KEY);
  const inventory = raw ? JSON.parse(raw) : {};

  for (const [key, val] of Object.entries(updates)) {
    inventory[key] = val;
  }

  await context.env.VENCY_CATALOG.put(KV_KEY, JSON.stringify(inventory));
  return Response.json({ ok: true });
}
