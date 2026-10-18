# Auditoría de seguridad — octubre 2026

Revisión del código del repositorio: funciones de Cloudflare, frontend,
Apps Script, configuración e historial de git. La auditoría original no pudo
probar el sitio en vivo; los puntos marcados **Verificar** se comprobaron después
en producción (ver "Estado de las correcciones").

Severidad: 🔴 crítica (explotable hoy, sin credenciales) · 🟠 alta · 🟡 media · ⚪ baja.

## Estado de las correcciones (actualizado el 18 de octubre de 2026)

Todo lo crítico y lo alto está corregido y **verificado en el sitio en vivo**.
Las secciones de "Detalle" más abajo describen el problema tal como se encontró;
esta sección dice cómo quedó.

| # | Estado |
|---|---|
| 1, 2 | ✅ Todas las escrituras del admin (`availability`, `catalog-archive`, `inventory`, `catalog-request`) exigen la contraseña, comparada en tiempo constante (`functions/_lib/auth.js`). |
| 3 | ✅ Se borraron `functions/api/checkout.js` y el código de Stripe. `STRIPE_SECRET_KEY` nunca estuvo configurada. |
| 4 | ✅ El formulario de personalización valida tipo y largo de cada campo y el correo, escapa todo en el correo a Vency, y la copia al cliente es un texto fijo. Probado en vivo. Turnstile queda listo en el código: se activa al definir `TURNSTILE_SECRET`. |
| 5 | ✅ La variable de Cloudflare se llama **`SELLER_TOKEN`** (también se acepta `ADMIN_TOKEN`). Si falta o tiene menos de 12 caracteres, las rutas responden 503. |
| 6 | 🟡 La contraseña ya no viaja en la URL (la lista del catálogo usa el encabezado `X-Admin-Token`) y hay rate limiting. Sigue guardada en `localStorage` del dispositivo, a propósito, para no pedirla en cada venta. Cloudflare Access queda como opción. |
| 7 | ✅ Solo se aceptan imágenes JPEG, PNG, WebP o AVIF reales (se revisan los primeros bytes), máximo 5 MB. `catalog-image` sirve cualquier otro tipo como descarga, con `nosniff` y `sandbox`. |
| 8 | ✅ `src/_headers`: HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options` y **CSP en modo estricto**. Antes de activarla se revisaron 11 páginas en escritorio y móvil: la única advertencia era el script de Cloudflare Web Analytics, que se permitió. |
| 9 | ✅ Regla de rate limiting y Bot Fight Mode activos en Cloudflare. |
| 10 | ✅ Ver abajo. |
| 11 | ✅ El service worker no guarda en caché ninguna respuesta de `/api/`, salvo las imágenes del catálogo. |
| 12 | ✅ El Apps Script responde `error` genérico; el detalle queda en su registro de ejecuciones. |
| 13 | ⚪ Pendiente: es una decisión legal, no de código (ver "Pendiente"). |

**Registro de pedidos (punto 10).** El sitio en vivo apuntaba a un despliegue del
Apps Script que ya no existía, así que los pedidos web no llegaban a la hoja. Se
corrigió así:

- El script acepta pedidos **sin contraseña**, pero siempre los guarda como `Web` / `pendiente`. Todo lo demás (resumen, inventario, confirmar, cancelar, catálogo) exige la contraseña.
- Cualquier texto que empiece con `=`, `+`, `-`, `@`, tabulador o salto de línea se guarda con `'` delante, para que la hoja no lo ejecute como fórmula.
- Las columnas del script coinciden con la hoja real "Vency — Pedidos": Fecha · Ref · Canal · Artículos · Total · Pago · Entrega · Estado · Cliente / Nota.
- El envío usa `keepalive`, para que el pedido llegue aunque WhatsApp tome la pantalla en el celular.
- El script lee la propiedad `SELLER_TOKEN` (o `TOKEN`).

**Otros hallazgos, corregidos:**

- `catalog-request` ya no envía `Access-Control-Allow-Origin: *`, valida `brand`, `name`, `notes` y `badge`, y limita `cat` y `gender` a los valores del formulario del admin (`cat` define el nivel de precio).
- `inventory` valida claves y valores, y ya no falla con un cuerpo vacío.
- El pago con Tilopay está oculto (`TILOPAY_ENABLED = false`) hasta tener las credenciales de la API.

Pruebas: `node --test tests/security/*.unit.mjs tests/tilopay/*.unit.mjs` (35).

**Cómo se actualiza el Apps Script.** Cada cambio necesita una **nueva
implementación**, que da un ID nuevo. Ese ID va en `src/scripts/admin.js`,
`carrito.js` y `decants.js`, subiendo el `?v=` de cada script en su HTML.

## Resumen

| # | Hallazgo | Severidad | Esfuerzo |
|---|---|---|---|
| 1 | `POST /api/availability` sin autenticación: cualquiera marca productos como agotados o disponibles | 🔴 | Bajo |
| 2 | `POST /api/catalog-archive` sin autenticación: cualquiera archiva o borra fragancias del catálogo | 🔴 | Bajo |
| 3 | `POST /api/checkout` (Stripe) acepta el precio del navegador | 🔴 si `STRIPE_SECRET_KEY` está configurada | Bajo |
| 4 | `POST /api/personalizacion` envía correos HTML con contenido del visitante a **cualquier** dirección, desde tu dominio | 🟠 | Bajo |
| 5 | Si `ADMIN_TOKEN` no está definida, `inventory` y `catalog-request` aceptan **cualquier** token no vacío | 🔴 si no está definida (Verificar) | Bajo |
| 6 | Contraseña de admin única, sin límite de intentos, guardada en `localStorage` y enviada en la URL | 🟠 | Medio |
| 7 | Las imágenes subidas se sirven con el tipo MIME que mandó el navegador (HTML o SVG → XSS en tu dominio) | 🟡 | Bajo |
| 8 | Sin cabeceras de seguridad (CSP, HSTS, anti-clickjacking, etc.) | 🟡 | Bajo |
| 9 | Ningún endpoint público tiene límite de peticiones ni anti-bots | 🟡 | Bajo |
| 10 | Registro de pedidos en Google Sheets: el sitio lo llama sin token (o falla, o el script desplegado es abierto) | 🟡 Verificar | Bajo |
| 11 | El service worker guarda en caché respuestas de API, incluida una URL con el token de admin | ⚪ | Bajo |
| 12 | Apps Script devuelve mensajes de error internos (`error: …`) | ⚪ | Bajo |
| 13 | Datos personales (Tilopay, personalización) sin política de retención (Ley 8968) | ⚪ legal | Medio |

**Lo que está bien:**

- No se encontraron secretos en el código ni en el historial de git, y `.dev.vars` y `.env` están ignorados.
- No hay scripts de terceros: no hay riesgo de cadena de suministro en el navegador.
- Los datos que vienen del KV y del carrito se escapan antes de insertarse como HTML (`escHtml`).
- `admin.html` tiene `noindex`.
- La nueva integración de Tilopay calcula los precios en el servidor y verifica el webhook.

## Detalle y corrección

### 1 y 2 — Escrituras sin autenticación 🔴
`functions/api/availability.js` y `functions/api/catalog-archive.js` no piden token.
`admin.js` tampoco lo envía (líneas ~1728, ~1761 y ~1786). Un atacante puede:

- Marcar todo el catálogo como "No disponible": el carrito bloquea el pago.
- Archivar o borrar fragancias en masa.
- Agotar el cupo diario gratis de escrituras de KV (1.000 por día), lo que bloquea al admin real.

```bash
curl -X POST https://vencyatelier.com/api/catalog-archive -d '{"id":"absolu-authority","deleted":true}'
```

**Corrección.** Exigir `tok` igual a `ADMIN_TOKEN`, con comparación en tiempo
constante, en todos los `POST`, `PATCH` y `DELETE`. Enviar `tok: token` desde
`admin.js` y sacar la verificación a un `functions/_lib/auth.js` común.

### 3 — Stripe confía en el precio del navegador 🔴
`functions/api/checkout.js` usa `item.price` tal como llega del navegador.

**Corrección.** Borrar el archivo, porque ningún botón lo usa, y quitar
`STRIPE_SECRET_KEY` de Cloudflare.

### 4 — Formulario de personalización como relé de correo 🟠
`nombre`, `fragancia`, `notas` y `mensaje` se insertan como HTML sin escapar, y
el correo de confirmación va al `email` que escriba el visitante. Con eso se
pueden mandar correos de phishing con enlaces, firmados por
`noreply@vencyatelier.com`, a cualquier persona. Eso daña la reputación del
dominio y puede hacer que Resend suspenda la cuenta. Tampoco hay límite de envíos.

**Corrección.**
- Escapar todos los campos y limitar su largo.
- Validar el formato del correo.
- Agregar [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) al formulario y verificar el token en la función.
- Agregar un límite de peticiones (ver punto 9).
- Opcional: no mandar copia al cliente; contestarle por WhatsApp.

### 5 — `ADMIN_TOKEN` opcional 🔴 (Verificar)
`inventory.js` y `catalog-request.js` aceptan cualquier `tok` si la variable no existe.

**Verificar** en Cloudflare → Settings → Variables que `ADMIN_TOKEN` exista en
Production y en Preview.

**Corrección.** Si falta la variable, responder `503`, nunca "aceptar cualquiera".

### 6 — Autenticación del admin 🟠
Hoy es una sola contraseña compartida con el Apps Script, que:

- No tiene límite de intentos.
- Se guarda en `localStorage`: cualquier XSS la roba.
- Viaja en la URL en `/api/catalog-request?all=1&tok=…`, así que queda en logs y en caché.

**Corrección recomendada.** Proteger `/admin*` y las rutas de escritura de `/api/*`
con [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/)
(Zero Trust, gratis hasta 50 usuarios). Pide el correo de Google o un código por
correo antes de llegar al sitio, y las funciones pueden validar el JWT de Access
(`Cf-Access-Jwt-Assertion`).

**Mínimo, si no se usa Access:**
- Contraseña larga y aleatoria (`openssl rand -hex 24`), distinta del `TOKEN` del Apps Script.
- Mandarla siempre en el cuerpo de la petición, no en la URL.
- Una regla de rate limiting para las rutas de admin.

### 7 — Tipo MIME de imágenes subidas 🟡
`catalog-request.js` guarda `imageFile.type` y `catalog-image/[id].js` lo
devuelve tal cual. Un archivo `text/html` o `image/svg+xml` con script se
ejecutaría en tu dominio y podría robar el token de admin.

**Corrección.**
- Aceptar solo `image/jpeg`, `image/png`, `image/webp` y `image/avif`, y comprobar los primeros bytes del archivo.
- Limitar el tamaño (por ejemplo, 5 MB).
- Responder con `X-Content-Type-Options: nosniff` y `Content-Security-Policy: default-src 'none'`.

### 8 — Cabeceras de seguridad 🟡
No hay archivo `src/_headers`. Las cabeceras recomendadas son estas. La CSP hay
que probarla, porque el sitio usa atributos `onerror` y estilos en línea:

```
/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  X-Frame-Options: DENY
  Content-Security-Policy-Report-Only: default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; connect-src 'self' https://script.google.com https://script.googleusercontent.com; frame-ancestors 'none'; form-action 'self'; base-uri 'self'

/admin*
  Cache-Control: no-store
```

Conviene empezar con `Report-Only`, revisar la consola y luego pasar a
`Content-Security-Policy`. Documentación:
[Pages `_headers`](https://developers.cloudflare.com/pages/configuration/headers/).

### 9 — Límite de peticiones y bots 🟡
En el panel de Cloudflare → Security → WAF → **Rate limiting rules**. El plan
gratuito incluye una regla, que puede cubrir varias rutas con una expresión:

- `POST /api/personalizacion`, `/api/tilopay/create-order` y todas las escrituras de admin: por ejemplo, 10 peticiones por minuto por IP.

Además, activar **Bot Fight Mode** y Turnstile en los formularios públicos.

### 10 — Registro de pedidos en Google Sheets 🟡 (Verificar)
`vency-sheets.gs` exige `token` incluso para registrar ventas, pero `carrito.js`
y `decants.js` lo llaman **sin** token. Pueden estar pasando dos cosas:

- **El script desplegado es igual al del repo:** los pedidos web no se están registrando.
- **El desplegado no exige token:** cualquiera puede llenar la hoja de ventas falsas, y las celdas que empiezan con `=` se interpretan como fórmulas.

**Verificar:** comparar el script desplegado con el del repo. **Corrección:**

- Registrar los pedidos desde una función de Cloudflare, con un token que nunca llegue al navegador.
- Anteponer `'` a los valores que empiecen con `=`, `+`, `-` o `@`.

Lo mismo aplica a `ORDER_LOG_URL` en el webhook de Tilopay: hoy no envía token.

### 11 a 13 — Menores
- **Service worker (`src/sw.js`):** no guardar en caché `/api/*`. Ya se excluye `/api/tilopay/`; conviene extenderlo a todo `/api/` o al menos a las rutas de admin.
- **Apps Script:** responder `error` genérico en lugar de `err.message`.
- **Datos personales:**
  - Definir cuánto tiempo se guardan los pedidos y datos de clientes, y borrarlos periódicamente.
  - Mencionarlo en `legal.html`.
  - Referencia: [Ley 8968 – PRODHAB](https://www.prodhab.go.cr/).

## Pendiente (opcional)

Ninguno es urgente.

- **Contraseña guardada en el dispositivo (6):** pasarla a `sessionStorage` obliga a escribirla cada vez que se cierra el navegador. Recomendable solo en una computadora compartida.
- **Una sola contraseña para el sitio y la hoja:** separarlas limita el daño si una se filtra.
- **Pedidos falsos en la hoja:** cualquiera puede agregar filas `pendiente` llamando al script directamente. No puede confirmar ventas, leer datos ni tocar el inventario. Se acepta como costo de registrar pedidos sin contraseña.
- **Turnstile (4):** el código ya lo soporta; falta crear las claves y agregar el widget al formulario.
- **Cloudflare Access para `/admin*` (6).**
- **Retención de datos (13):** definir cuánto tiempo se guardan pedidos y solicitudes de personalización, y mencionarlo en `legal.html` (Ley 8968).
- **Correo:** confirmar SPF, DKIM y DMARC del dominio en Resend.

## Recursos

**Guías generales:**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/): los riesgos más comunes.
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/): guías concretas de XSS, autenticación, carga de archivos, cabeceras y validación de entrada.
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/): lista de verificación por niveles. El nivel 1 alcanza para una tienda pequeña.

**Herramientas para medir el sitio:**
- [MDN HTTP Observatory](https://developer.mozilla.org/en-US/observatory): calificación gratuita de cabeceras.
- [Security Headers](https://securityheaders.com/): lo mismo, otra herramienta.
- [Google CSP Evaluator](https://csp-evaluator.withgoogle.com/): revisa la política CSP.
- [OWASP ZAP](https://www.zaproxy.org/): escáner gratuito. Usarlo sobre un despliegue Preview, no sobre producción.

**Documentación de Cloudflare:**
- [Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Cabeceras con `_headers`](https://developers.cloudflare.com/pages/configuration/headers/)
- [WAF rate limiting](https://developers.cloudflare.com/waf/rate-limiting-rules/)
- [Turnstile](https://developers.cloudflare.com/turnstile/)
- [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/)

**Correo:** en [Resend](https://resend.com/docs), configurar SPF, DKIM y DMARC del dominio, para que nadie pueda suplantar `@vencyatelier.com`.
