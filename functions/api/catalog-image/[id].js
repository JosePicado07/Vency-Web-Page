/**
 * GET /api/catalog-image/:id
 * Serves a catalog image stored as binary in KV under key catalog_img_{id}.
 */
export async function onRequest(context) {
  const { params, env } = context;
  const id  = params.id;
  const kv  = env.VENCY_CATALOG;
  if (!kv) return new Response('not found', { status: 404 });

  const { value, metadata } = await kv.getWithMetadata('catalog_img_' + id, { type: 'arrayBuffer' });
  if (!value) return new Response('not found', { status: 404 });

  const mime = (metadata && metadata.mime) || 'image/jpeg';
  return new Response(value, {
    headers: {
      'Content-Type': mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
