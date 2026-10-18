/**
 * Autenticación de las rutas de escritura del admin.
 *
 * El token se compara en tiempo constante con ADMIN_TOKEN. Si la variable no
 * está configurada (o es demasiado corta), las escrituras quedan CERRADAS
 * (503) en lugar de aceptar cualquier valor.
 */
import { timingSafeEqual } from './util.js';

const MIN_TOKEN_LENGTH = 12;

function deny(error, status) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

/** Devuelve null si `tok` es válido; si no, la Response de error a devolver. */
export async function requireAdmin(env, tok) {
  const valid = env.ADMIN_TOKEN;
  if (typeof valid !== 'string' || valid.length < MIN_TOKEN_LENGTH) return deny('admin_not_configured', 503);
  if (typeof tok !== 'string' || !(await timingSafeEqual(tok, valid))) return deny('unauthorized', 401);
  return null;
}

/** IDs de producto: los mismos slugs que usa el catálogo. */
export const PRODUCT_ID_RE = /^[a-z0-9-]{1,100}$/;
