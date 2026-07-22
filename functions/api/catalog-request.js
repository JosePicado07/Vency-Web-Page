/**
 * GET  /api/catalog-request               → approved entries (public, shown on catalog)
 * GET  /api/catalog-request?all=1&tok=X  → all entries (admin)
 * POST /api/catalog-request (multipart)  → admin creates entry (requires tok field)
 * PATCH /api/catalog-request             → admin deletes entry (requires tok)
 *
 * KV binding: VENCY_CATALOG
 *   catalog_requests_v1  → JSON array of entry objects
 *   catalog_img_{id}     → raw image binary (with metadata.mime)
 *
 * Env var: ADMIN_TOKEN  (Cloudflare Pages → Settings → Environment variables)
 */

const KV_KEY = 'catalog_requests_v1';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function loadEntries(kv) {
  const raw = await kv.get(KV_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveEntries(kv, arr) {
  await kv.put(KV_KEY, JSON.stringify(arr));
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

  const kv = env.VENCY_CATALOG;
  if (!kv) return json({ error: 'KV not bound' }, 500);

  /* ── GET ── */
  if (request.method === 'GET') {
    const url      = new URL(request.url);
    const showAll  = url.searchParams.get('all') === '1';
    const tok      = url.searchParams.get('tok');
    const validTok = env.ADMIN_TOKEN;

    const entries = await loadEntries(kv);
    if (showAll && validTok && tok === validTok) return json(entries);
    return json(entries.filter(e => e.status === 'approved'));
  }

  /* ── POST — admin creates a new catalog entry ── */
  if (request.method === 'POST') {
    const ct = request.headers.get('Content-Type') || '';

    if (!ct.includes('multipart/form-data')) {
      return json({ error: 'Expected multipart/form-data' }, 400);
    }

    const form = await request.formData();
    const tok  = form.get('tok') || '';
    const validTok = env.ADMIN_TOKEN;

    if (!validTok || tok !== validTok) return json({ error: 'unauthorized' }, 401);

    const brand  = (form.get('brand') || '').trim();
    const name   = (form.get('name')  || '').trim();
    const cat    = (form.get('cat')   || '').trim();
    const gender = (form.get('gender') || 'unisex').trim();
    const notes  = (form.get('notes') || '').trim();

    if (!brand || !name || !cat) return json({ error: 'missing fields' }, 400);

    const entries = await loadEntries(kv);
    const isDupe  = entries.some(
      e => e.brand.toLowerCase() === brand.toLowerCase() &&
           e.name.toLowerCase()  === name.toLowerCase()
    );
    if (isDupe) return json({ ok: true, dupe: true });

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    let imageId = null;

    // Store image in KV if provided
    const imageFile = form.get('image');
    if (imageFile && imageFile.size > 0) {
      const buf  = await imageFile.arrayBuffer();
      const mime = imageFile.type || 'image/jpeg';
      await kv.put('catalog_img_' + id, buf, { metadata: { mime } });
      imageId = id;
    }

    const entry = { id, brand, name, cat, gender, notes, imageId, status: 'approved', fecha: new Date().toISOString().slice(0, 10) };
    entries.push(entry);
    await saveEntries(kv, entries);

    return json({ ok: true, id });
  }

  /* ── PATCH — admin deletes an entry ── */
  if (request.method === 'PATCH') {
    let body;
    try { body = await request.json(); } catch { return json({ error: 'invalid json' }, 400); }

    const validTok = env.ADMIN_TOKEN;
    if (!validTok || body.tok !== validTok) return json({ error: 'unauthorized' }, 401);

    const { id, action } = body;
    if (!id) return json({ error: 'missing id' }, 400);

    const entries = await loadEntries(kv);
    const idx     = entries.findIndex(e => e.id === id);
    if (idx === -1) return json({ error: 'not found' }, 404);

    if (action === 'delete') {
      const entry = entries[idx];
      entries.splice(idx, 1);
      await saveEntries(kv, entries);
      if (entry.imageId) await kv.delete('catalog_img_' + entry.imageId).catch(() => {});
    }

    return json({ ok: true });
  }

  return new Response('Method Not Allowed', { status: 405, headers: CORS });
}
