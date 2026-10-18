/**
 * GET /api/catalog-image/:id
 * Serves a catalog image stored as binary in KV under key catalog_img_{id}.
 * Only allowlisted image types are served as images; anything else (old
 * uploads stored with the browser's MIME) goes out as a download, and nosniff
 * + a locked-down CSP keep it from running as a page on our domain.
 */
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

export async function onRequest(context) {
  const { params, env } = context;
  const id  = params.id;
  const kv  = env.VENCY_CATALOG;
  if (!kv || typeof id !== 'string' || !/^[a-z0-9]{1,40}$/.test(id)) return new Response('not found', { status: 404 });

  const { value, metadata } = await kv.getWithMetadata('catalog_img_' + id, { type: 'arrayBuffer' });
  if (!value) return new Response('not found', { status: 404 });

  const mime = (metadata && metadata.mime) || 'image/jpeg';
  return new Response(value, {
    headers: {
      'Content-Type': IMAGE_TYPES.has(mime) ? mime : 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
