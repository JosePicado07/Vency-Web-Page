/**
 * POST /api/personalizacion
 * Body: { nombre, email, fragancia, notas, intensidad, ocasion, mensaje }
 *
 * Sends:
 *   1. Confirmation email to customer (via Resend — optional, requires RESEND_API_KEY)
 *   2. Notification email to Vency   (via Resend — optional)
 *
 * Env vars (Cloudflare Pages → Settings → Environment variables):
 *   RESEND_API_KEY  — from resend.com (free tier covers ~100/day)
 *   VENCY_EMAIL     — Vency's email address to receive notifications
 */
export async function onRequestPost(context) {
  let body;
  try { body = await context.request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { nombre, email, fragancia, notas, intensidad, ocasion, mensaje } = body;
  if (!email || !fragancia || !notas) {
    return Response.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  const nombreDisplay = nombre || email;
  const waText = encodeURIComponent(
    'Hola Vency Atelier! Hice una solicitud de personalización:\n\n'
    + '🌿 Fragancia base: ' + fragancia + '\n'
    + '✨ Notas a potenciar: ' + notas + '\n'
    + (intensidad ? '💧 Intensidad: ' + intensidad + '\n' : '')
    + (ocasion    ? '📍 Ocasión: '    + ocasion    + '\n' : '')
    + (mensaje    ? '💬 Nota: '       + mensaje    + '\n' : '')
    + '\nCorreo: ' + email
  );
  const waUrl = 'https://wa.me/50672773156?text=' + waText;

  const resendKey  = context.env.RESEND_API_KEY;
  const vencyEmail = context.env.VENCY_EMAIL || 'hola@vencyatelier.com';

  if (resendKey) {
    const customerHtml =
      '<div style="font-family:\'Manrope\',sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">'
      + '<p style="font-size:1.1rem;font-weight:600">Hola' + (nombre ? ' ' + nombre : '') + '!</p>'
      + '<p>Recibimos tu solicitud de fragancia personalizada. Vency te va a contactar pronto por WhatsApp para coordinar los detalles y el precio.</p>'
      + '<table style="width:100%;border-collapse:collapse;margin:1.5rem 0">'
      + '<tr><td style="padding:.5rem 0;border-bottom:1px solid #e5e5e5;font-weight:600;width:40%">Fragancia base</td><td style="padding:.5rem 0;border-bottom:1px solid #e5e5e5">' + fragancia + '</td></tr>'
      + '<tr><td style="padding:.5rem 0;border-bottom:1px solid #e5e5e5;font-weight:600">Notas</td><td style="padding:.5rem 0;border-bottom:1px solid #e5e5e5">' + notas + '</td></tr>'
      + (intensidad ? '<tr><td style="padding:.5rem 0;border-bottom:1px solid #e5e5e5;font-weight:600">Intensidad</td><td style="padding:.5rem 0;border-bottom:1px solid #e5e5e5">' + intensidad + '</td></tr>' : '')
      + (ocasion    ? '<tr><td style="padding:.5rem 0;border-bottom:1px solid #e5e5e5;font-weight:600">Ocasión</td><td style="padding:.5rem 0;border-bottom:1px solid #e5e5e5">' + ocasion + '</td></tr>' : '')
      + (mensaje    ? '<tr><td style="padding:.5rem 0;font-weight:600">Nota adicional</td><td style="padding:.5rem 0">' + mensaje + '</td></tr>' : '')
      + '</table>'
      + '<p style="color:#666;font-size:.9rem">— Vency Atelier · Heredia, Costa Rica</p>'
      + '</div>';

    const vencyHtml =
      '<div style="font-family:sans-serif;max-width:520px;margin:0 auto">'
      + '<h2>Nueva solicitud de personalización</h2>'
      + '<p><strong>De:</strong> ' + nombreDisplay + ' &lt;' + email + '&gt;</p>'
      + '<p><strong>Fragancia base:</strong> ' + fragancia + '</p>'
      + '<p><strong>Notas:</strong> ' + notas + '</p>'
      + (intensidad ? '<p><strong>Intensidad:</strong> ' + intensidad + '</p>' : '')
      + (ocasion    ? '<p><strong>Ocasión:</strong> '    + ocasion    + '</p>' : '')
      + (mensaje    ? '<p><strong>Nota adicional:</strong> ' + mensaje + '</p>' : '')
      + '<hr><a href="' + waUrl.replace(/&/g, '&amp;') + '" style="display:inline-block;padding:.6rem 1.2rem;background:#25D366;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">Abrir en WhatsApp</a>'
      + '</div>';

    await Promise.allSettled([
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Vency Atelier <noreply@vencyatelier.com>',
          to: [email],
          subject: 'Tu solicitud de personalización · Vency Atelier',
          html: customerHtml,
        }),
      }),
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Web Vency <noreply@vencyatelier.com>',
          to: [vencyEmail],
          reply_to: email,
          subject: '🌿 Personalización: ' + fragancia + ' · ' + notas,
          html: vencyHtml,
        }),
      }),
    ]);
  }

  return Response.json({ ok: true, waUrl: waUrl });
}
