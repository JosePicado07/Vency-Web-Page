/**
 * POST /api/checkout
 * Body: { items: [{ name, price, qty }], ref: string }
 * Returns: { url } — Stripe Checkout Session URL
 *
 * Env vars required (Cloudflare Pages → Settings → Environment variables):
 *   STRIPE_SECRET_KEY
 */
export async function onRequestPost(context) {
  const secretKey = context.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return Response.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { items, ref } = body;
  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ error: 'Empty cart' }, { status: 400 });
  }

  const origin = new URL(context.request.url).origin;

  // Build Stripe line_items as form-encoded (Stripe REST API format)
  const params = new URLSearchParams();
  params.append('mode', 'payment');
  params.append('success_url', `${origin}/pages/carrito.html?paid=1&ref=${encodeURIComponent(ref || '')}`);
  params.append('cancel_url', `${origin}/pages/carrito.html`);
  if (ref) params.append('metadata[ref]', ref);

  items.forEach((item, i) => {
    params.append(`line_items[${i}][price_data][currency]`, 'crc');
    params.append(`line_items[${i}][price_data][product_data][name]`, item.name);
    // Stripe treats CRC as 2-decimal (centimos) — multiply by 100
    params.append(`line_items[${i}][price_data][unit_amount]`, String(Math.round(item.price * 100)));
    params.append(`line_items[${i}][quantity]`, String(item.qty));
  });

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const session = await res.json();
  if (!res.ok) {
    return Response.json({ error: session.error?.message || 'Stripe error' }, { status: 502 });
  }

  return Response.json({ url: session.url });
}
