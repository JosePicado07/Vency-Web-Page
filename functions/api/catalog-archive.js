/**
 * GET  /api/catalog-archive  — returns { archived: [id, ...], deleted: [id, ...] }
 * POST /api/catalog-archive  — admin, body: { tok, id, archived: bool } or { tok, id, deleted: true }
 *
 * `deleted` is a separate, permanent tombstone list for static/seed items —
 * distinct from `archived` so a hard delete never surfaces a "Restaurar" state.
 */
import { requireAdmin, PRODUCT_ID_RE } from '../_lib/auth.js';

const KV_KEY = 'archived_base_ids';
const KV_KEY_DELETED = 'deleted_base_ids';
const MAX_ENTRIES = 1000;

export async function onRequestGet(context) {
  const [raw, rawDeleted] = await Promise.all([
    context.env.VENCY_CATALOG.get(KV_KEY),
    context.env.VENCY_CATALOG.get(KV_KEY_DELETED)
  ]);
  const list = raw ? JSON.parse(raw) : [];
  const deletedList = rawDeleted ? JSON.parse(rawDeleted) : [];
  return Response.json({ archived: list, deleted: deletedList }, {
    headers: { 'Cache-Control': 'no-store' }
  });
}

export async function onRequestPost(context) {
  let body;
  try { body = await context.request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const denied = await requireAdmin(context.env, body && body.tok);
  if (denied) return denied;

  const { id, archived, deleted } = body;
  if (typeof id !== 'string' || !PRODUCT_ID_RE.test(id)) {
    return Response.json({ error: 'Missing id' }, { status: 400 });
  }

  if (deleted) {
    const rawDeleted = await context.env.VENCY_CATALOG.get(KV_KEY_DELETED);
    const deletedList = rawDeleted ? JSON.parse(rawDeleted) : [];
    if (!deletedList.includes(id)) {
      if (deletedList.length >= MAX_ENTRIES) return Response.json({ error: 'Too many entries' }, { status: 400 });
      deletedList.push(id);
    }
    await context.env.VENCY_CATALOG.put(KV_KEY_DELETED, JSON.stringify(deletedList));
    return Response.json({ ok: true });
  }

  const raw = await context.env.VENCY_CATALOG.get(KV_KEY);
  let list = raw ? JSON.parse(raw) : [];

  if (archived) {
    if (!list.includes(id)) {
      if (list.length >= MAX_ENTRIES) return Response.json({ error: 'Too many entries' }, { status: 400 });
      list.push(id);
    }
  } else {
    list = list.filter(function (x) { return x !== id; });
  }

  await context.env.VENCY_CATALOG.put(KV_KEY, JSON.stringify(list));
  return Response.json({ ok: true });
}
