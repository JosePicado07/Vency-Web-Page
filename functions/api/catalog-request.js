/**
 * GET  /api/catalog-request               → returns approved entries (public)
 * GET  /api/catalog-request?all=1&tok=X  → returns all entries (admin)
 * POST /api/catalog-request               → customer submits a request
 * PATCH /api/catalog-request              → admin approves or rejects (requires tok)
 *
 * KV binding: VENCY_CATALOG (same binding as availability toggle)
 * KV key: catalog_requests_v1 → JSON array of request objects
 *
 * Env var: ADMIN_TOKEN — set in Cloudflare Pages → Settings → Variables
 *   (set it to the same value as your GAS TOKEN script property)
 */

const KV_KEY = 'catalog_requests_v1';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function loadRequests(kv) {
  const raw = await kv.get(KV_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveRequests(kv, arr) {
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

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  const kv = env.VENCY_CATALOG;
  if (!kv) return json({ error: 'KV not bound' }, 500);

  /* ── GET ── */
  if (request.method === 'GET') {
    const url = new URL(request.url);
    const showAll = url.searchParams.get('all') === '1';
    const tok     = url.searchParams.get('tok');
    const validTok = env.ADMIN_TOKEN;

    const requests = await loadRequests(kv);

    if (showAll && validTok && tok === validTok) {
      return json(requests);
    }
    return json(requests.filter(r => r.status === 'approved'));
  }

  /* ── POST — customer submits ── */
  if (request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return json({ error: 'invalid json' }, 400); }

    const brand = (body.brand || '').trim();
    const name  = (body.name  || '').trim();
    const cat   = body.cat  || '';

    if (!brand || !name || !cat) return json({ error: 'missing fields' }, 400);

    const requests = await loadRequests(kv);

    // Deduplicate
    const isDupe = requests.some(
      r => r.brand.toLowerCase() === brand.toLowerCase() &&
           r.name.toLowerCase()  === name.toLowerCase()
    );
    if (isDupe) return json({ ok: true, dupe: true });

    const entry = {
      id:     Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      brand,
      name,
      cat,
      gender: body.gender || 'unisex',
      notes:  (body.notes || '').trim(),
      status: 'pending',
      fecha:  new Date().toISOString().slice(0, 10),
    };

    requests.push(entry);
    await saveRequests(kv, requests);

    // Optional email notification
    const resendKey = env.RESEND_API_KEY;
    if (resendKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Vency Atelier <notificaciones@vencyatelier.com>',
            to: [env.VENCY_EMAIL || 'venctyatelier@gmail.com'],
            subject: `Nueva solicitud de fragancia: ${brand} – ${name}`,
            html: `<p>Un cliente solicitó agregar <strong>${brand} – ${name}</strong> al catálogo.</p>
<p>Categoría: ${cat} · Género: ${entry.gender}</p>
${entry.notes ? `<p>Notas: ${entry.notes}</p>` : ''}
<p>Revisá las solicitudes en el panel de administración.</p>`,
          }),
        });
      } catch (_) {}
    }

    return json({ ok: true });
  }

  /* ── PATCH — admin approves / rejects ── */
  if (request.method === 'PATCH') {
    let body;
    try { body = await request.json(); } catch { return json({ error: 'invalid json' }, 400); }

    const validTok = env.ADMIN_TOKEN;
    if (!validTok || body.tok !== validTok) return json({ error: 'unauthorized' }, 401);

    const { id, status } = body;
    if (!id || !['approved', 'rejected'].includes(status)) {
      return json({ error: 'invalid' }, 400);
    }

    const requests = await loadRequests(kv);
    const idx = requests.findIndex(r => r.id === id);
    if (idx === -1) return json({ error: 'not found' }, 404);

    requests[idx].status = status;
    await saveRequests(kv, requests);

    return json({ ok: true });
  }

  return new Response('Method Not Allowed', { status: 405, headers: CORS });
}
