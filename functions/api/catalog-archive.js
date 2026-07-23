/**
 * GET  /api/catalog-archive  — returns { archived: [id, ...] }
 * POST /api/catalog-archive  — body: { id, archived: bool }
 */
const KV_KEY = 'archived_base_ids';

export async function onRequestGet(context) {
  const raw = await context.env.VENCY_CATALOG.get(KV_KEY);
  const list = raw ? JSON.parse(raw) : [];
  return Response.json({ archived: list }, {
    headers: { 'Cache-Control': 'no-store' }
  });
}

export async function onRequestPost(context) {
  let body;
  try { body = await context.request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { id, archived } = body;
  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });

  const raw = await context.env.VENCY_CATALOG.get(KV_KEY);
  let list = raw ? JSON.parse(raw) : [];

  if (archived) {
    if (!list.includes(id)) list.push(id);
  } else {
    list = list.filter(function (x) { return x !== id; });
  }

  await context.env.VENCY_CATALOG.put(KV_KEY, JSON.stringify(list));
  return Response.json({ ok: true });
}
