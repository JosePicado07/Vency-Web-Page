/**
 * GET  /api/catalog-request               → approved entries (public, shown on catalog)
 * GET  /api/catalog-request?all=1        → all entries (admin, header X-Admin-Token)
 * POST /api/catalog-request (multipart)  → admin creates entry (requires tok field)
 * PATCH /api/catalog-request             → admin deletes entry (requires tok)
 *
 * KV binding: VENCY_CATALOG
 *   catalog_requests_v1  → JSON array of entry objects
 *   catalog_img_{id}     → raw image binary (with metadata.mime)
 *
 * Env var: ADMIN_TOKEN  (Cloudflare Pages → Settings → Environment variables)
 *
 * Same-origin only (no CORS). Fields and images are validated on write: `cat`
 * sets the price tier in functions/_lib/catalog.js, and an uploaded file is
 * served from our domain, so only real JPEG/PNG/WebP/AVIF is accepted.
 */

import { requireAdmin } from '../_lib/auth.js';

const KV_KEY = 'catalog_requests_v1';
const CATS    = new Set(['vency', 'disenador', 'nicho', 'ultra-nicho', 'creacion-propia']);
const GENDERS = new Set(['unisex', 'hombre', 'mujer']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

/** MIME real según los primeros bytes; null si no es una imagen permitida. */
export function sniffImage(buf) {
  const b = new Uint8Array(buf.slice(0, 12));
  const ascii = (from, to) => String.fromCharCode(...b.slice(from, to));
  if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'image/jpeg';
  if (b[0] === 0x89 && ascii(1, 4) === 'PNG') return 'image/png';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  if (ascii(4, 12) === 'ftypavif') return 'image/avif';
  return null;
}

/** Guarda la imagen si es válida. Devuelve el id, null si no hay imagen, o 'invalid'. */
async function storeImage(kv, imageFile) {
  if (!imageFile || typeof imageFile === 'string' || imageFile.size === 0) return null;
  if (imageFile.size > MAX_IMAGE_BYTES) return 'invalid';
  const buf  = await imageFile.arrayBuffer();
  const mime = sniffImage(buf);
  if (!mime) return 'invalid';
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await kv.put('catalog_img_' + id, buf, { metadata: { mime } });
  return id;
}

/**
 * Valida los campos de texto. `required` = alta (brand/name/cat obligatorios);
 * en una edición los campos ausentes o vacíos quedan sin cambios.
 * Devuelve { fields } o { error }.
 */
function cleanFields(src, required) {
  const out = {};
  const rules = {
    brand:  (v) => v.length >= 1 && v.length <= 80,
    name:   (v) => v.length >= 1 && v.length <= 80,
    cat:    (v) => CATS.has(v),
    gender: (v) => GENDERS.has(v),
    notes:  (v) => v.length <= 500,
    badge:  (v) => /^[a-z-]{0,30}$/.test(v),
  };
  for (const [k, ok] of Object.entries(rules)) {
    const raw = src[k];
    if (raw == null) continue;
    if (typeof raw !== 'string') return { error: 'invalid ' + k };
    const v = raw.trim();
    // notes/badge vacíos sí se guardan (borran el valor); los demás vacíos = sin cambios.
    if (v === '' && k !== 'notes' && k !== 'badge') continue;
    if (!ok(v)) return { error: 'invalid ' + k };
    out[k] = v;
  }
  if (required && (!out.brand || !out.name || !out.cat)) return { error: 'missing fields' };
  return { fields: out };
}

export async function onRequest(context) {
  const { request, env } = context;

  const kv = env.VENCY_CATALOG;
  if (!kv) return json({ error: 'KV not bound' }, 500);

  /* ── GET ── */
  if (request.method === 'GET') {
    const url      = new URL(request.url);
    const showAll  = url.searchParams.get('all') === '1';

    const entries = await loadEntries(kv);
    // El token va en un encabezado, no en la URL (no queda en logs ni en caché).
    if (showAll && !(await requireAdmin(env, request.headers.get('X-Admin-Token')))) return json(entries);
    return json(entries.filter(e => e.status === 'approved'));
  }

  /* ── POST — admin creates a new catalog entry ── */
  if (request.method === 'POST') {
    const ct = request.headers.get('Content-Type') || '';

    if (!ct.includes('multipart/form-data')) {
      return json({ error: 'Expected multipart/form-data' }, 400);
    }

    const form = await request.formData();
    const denied = await requireAdmin(env, form.get('tok'));
    if (denied) return denied;

    const { fields, error } = cleanFields(Object.fromEntries(form.entries()), true);
    if (error) return json({ error }, 400);
    const { brand, name, cat } = fields;
    const gender = fields.gender || 'unisex';
    const notes  = fields.notes || '';
    const badge  = fields.badge || '';

    const entries = await loadEntries(kv);
    const isDupe  = entries.some(
      e => e.brand.toLowerCase() === brand.toLowerCase() &&
           e.name.toLowerCase()  === name.toLowerCase()
    );
    if (isDupe) return json({ ok: true, dupe: true });

    const imageId = await storeImage(kv, form.get('image'));
    if (imageId === 'invalid') return json({ error: 'invalid_image' }, 400);

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const entry = { id, brand, name, cat, gender, notes, badge, imageId, status: 'approved', fecha: new Date().toISOString().slice(0, 10) };
    entries.push(entry);
    await saveEntries(kv, entries);

    return json({ ok: true, id });
  }

  /* ── PATCH — admin updates / deletes / archives an entry ── */
  if (request.method === 'PATCH') {
    const ct = request.headers.get('Content-Type') || '';
    let body, id, action, form;

    if (ct.includes('multipart/form-data')) {
      form = await request.formData();
      body = {};
      for (const [k, v] of form.entries()) body[k] = v;
    } else {
      try { body = await request.json(); } catch { return json({ error: 'invalid json' }, 400); }
    }
    if (!body || typeof body !== 'object') return json({ error: 'invalid json' }, 400);

    id     = body.id;
    action = body.action;

    const denied = await requireAdmin(env, body.tok);
    if (denied) return denied;

    if (typeof id !== 'string' || !id || id.length > 40) return json({ error: 'missing id' }, 400);

    const entries = await loadEntries(kv);
    const idx     = entries.findIndex(e => e.id === id);
    if (idx === -1) return json({ error: 'not found' }, 404);

    if (action === 'delete') {
      const entry = entries[idx];
      entries.splice(idx, 1);
      await saveEntries(kv, entries);
      if (entry.imageId) await kv.delete('catalog_img_' + entry.imageId).catch(() => {});
    } else if (action === 'archive') {
      entries[idx].status = 'archived';
      await saveEntries(kv, entries);
    } else if (action === 'restore') {
      entries[idx].status = 'approved';
      await saveEntries(kv, entries);
    } else if (action === 'update') {
      const { fields, error } = cleanFields(body, false);
      if (error) return json({ error }, 400);
      Object.assign(entries[idx], fields);

      if (form) {
        const newId = await storeImage(kv, form.get('image'));
        if (newId === 'invalid') return json({ error: 'invalid_image' }, 400);
        if (newId) {
          const oldId = entries[idx].imageId;
          entries[idx].imageId = newId;
          if (oldId) await kv.delete('catalog_img_' + oldId).catch(() => {});
        }
      }
      await saveEntries(kv, entries);
    }

    return json({ ok: true });
  }

  return new Response('Method Not Allowed', { status: 405 });
}
