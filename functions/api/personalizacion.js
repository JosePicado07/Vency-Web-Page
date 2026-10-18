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
 *   TURNSTILE_SECRET — optional; when set, body.turnstile must pass Cloudflare Turnstile
 *
 * The customer copy is fixed text (no visitor input), so the endpoint can't be
 * used to send arbitrary content to arbitrary addresses. Everything that goes
 * into Vency's email is escaped.
 */
import { EMAIL_RE, escHtml as esc } from '../_lib/util.js';

const LIMITS = { nombre: 80, telefono: 20, fragancia: 200, notas: 200, intensidad: 200, ocasion: 200, mensaje: 1000 };

async function turnstileOk(context, token) {
  const secret = context.env.TURNSTILE_SECRET;
  if (!secret) return true;
  if (typeof token !== 'string' || !token) return false;
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  const ip = context.request.headers.get('CF-Connecting-IP');
  if (ip) form.append('remoteip', ip);
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    return (await r.json()).success === true;
  } catch {
    return false;
  }
}

export async function onRequestPost(context) {
  let body;
  try { body = await context.request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') return Response.json({ error: 'Invalid JSON' }, { status: 400 });

  const f = {};
  for (const [k, max] of Object.entries(LIMITS)) {
    const v = body[k];
    if (v != null && typeof v !== 'string') return Response.json({ error: 'Datos inválidos' }, { status: 400 });
    f[k] = (v || '').trim();
    if (f[k].length > max) return Response.json({ error: 'Algún campo es demasiado largo' }, { status: 400 });
  }
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!email || !f.fragancia || !f.notas) {
    return Response.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }
  if (email.length > 120 || !EMAIL_RE.test(email)) {
    return Response.json({ error: 'Correo no válido' }, { status: 400 });
  }
  if (!(await turnstileOk(context, body.turnstile))) {
    return Response.json({ error: 'Verificación fallida. Intentá de nuevo.' }, { status: 403 });
  }

  const { nombre, telefono, fragancia, notas, intensidad, ocasion, mensaje } = f;
  const nombreDisplay = nombre || email;

  // URL for Vency to open a chat with the CLIENT
  const clientPhone = telefono ? telefono.replace(/\D/g, '') : null;
  const clientWaUrl = clientPhone
    ? 'https://wa.me/' + clientPhone + '?text=' + encodeURIComponent(
        'Hola' + (nombre ? ' ' + nombre : '') + '! Soy Vency Atelier. Recibí tu solicitud de personalización y con gusto te ayudo. ¿Cuándo podemos coordinar?'
      )
    : null;

  // URL for the customer to contact Vency
  const waText = encodeURIComponent(
    'Hola Vency Atelier! Hice una solicitud de personalización:\n\n'
    + (telefono   ? '📱 WhatsApp: '     + telefono   + '\n' : '')
    + '🌿 Fragancia base: ' + fragancia + '\n'
    + '✨ Notas a potenciar: ' + notas + '\n'
    + (intensidad ? '💧 Intensidad: ' + intensidad + '\n' : '')
    + (ocasion    ? '📍 Ocasión: '    + ocasion    + '\n' : '')
    + (mensaje    ? '💬 Nota: '       + mensaje    + '\n' : '')
    + '\nCorreo: ' + email
  );
  const waUrl = 'https://wa.me/50672773156?text=' + waText;

  const resendKey  = context.env.RESEND_API_KEY;
  const vencyEmail = context.env.VENCY_EMAIL || 'vencyatelier@gmail.com';

  if (resendKey) {
    const customerHtml =
      '<div style="font-family:\'Manrope\',sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">'
      + '<p style="font-size:1.1rem;font-weight:600">¡Hola!</p>'
      + '<p>Recibimos tu solicitud de fragancia personalizada. Vency te va a contactar pronto por WhatsApp para coordinar los detalles y el precio.</p>'
      + '<p style="color:#666;font-size:.9rem">— Vency Atelier · Heredia, Costa Rica</p>'
      + '</div>';

    const vencyHtml =
      '<div style="font-family:sans-serif;max-width:520px;margin:0 auto">'
      + '<h2>Nueva solicitud de personalización</h2>'
      + '<p><strong>De:</strong> ' + esc(nombreDisplay) + ' &lt;' + esc(email) + '&gt;</p>'
      + (telefono ? '<p><strong>WhatsApp:</strong> ' + esc(telefono) + '</p>' : '')
      + '<p><strong>Fragancia base:</strong> ' + esc(fragancia) + '</p>'
      + '<p><strong>Notas:</strong> ' + esc(notas) + '</p>'
      + (intensidad ? '<p><strong>Intensidad:</strong> ' + esc(intensidad) + '</p>' : '')
      + (ocasion    ? '<p><strong>Ocasión:</strong> '    + esc(ocasion) + '</p>' : '')
      + (mensaje    ? '<p><strong>Nota adicional:</strong> ' + esc(mensaje) + '</p>' : '')
      + '<hr>'
      + (clientWaUrl
          ? '<a href="' + esc(clientWaUrl) + '" style="display:inline-block;padding:.6rem 1.2rem;background:#25D366;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">Escribir al cliente por WhatsApp</a>'
          : ''
        )
      + '</div>';

    await Promise.allSettled([
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Vency Atelier <noreply@vencyatelier.com>',
          to: [email],
          reply_to: vencyEmail,
          subject: 'Tu solicitud de personalización · Vency Atelier',
          html: customerHtml,
        }),
      }),
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + resendKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Vency Atelier <noreply@vencyatelier.com>',
          to: [vencyEmail],
          reply_to: email,
          subject: ('🌿 Personalización: ' + fragancia + ' · ' + notas).replace(/[\r\n]+/g, ' '),
          html: vencyHtml,
        }),
      }),
    ]);
  }

  return Response.json({ ok: true, waUrl: waUrl });
}
