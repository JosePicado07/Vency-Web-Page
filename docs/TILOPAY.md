# Pagos con Tilopay

Pago con tarjeta desde `carrito.html` usando la **página de pago alojada** de
Tilopay (redirección). Moneda: **solo CRC**. Envío: mismas reglas que el carrito
(₡2.500 a domicilio, gratis desde ₡30.000, retiro en local sin costo).

## 1. Qué está verificado y qué no

La documentación oficial (`tilopay.com/en/developers`) no se pudo abrir desde el
entorno donde se escribió este código: la red bloqueó el dominio. Lo de abajo
sale de los extractos públicos que devolvió una búsqueda web.

**Confirmado en páginas oficiales de Tilopay:**

| Hecho | Fuente |
|---|---|
| Flujo "Hosted payment page": tu servidor pide a la API una URL de pago, redirige al cliente a esa página de Tilopay y recibe el resultado en tu URL de retorno. | https://tilopay.com/en/developers/hosted-payment-page |
| No hay credenciales sandbox compartidas; cada desarrollador obtiene las suyas al registrarse. | https://tilopay.com/en/developers/hosted-payment-page, https://web.tilopay.com/developers |
| Existen `POST /api/v1/loginSdk` (token del SDK) y `POST /api/v1/createLinkPayment` (enlaces de pago, con `webhook_url`). | https://tilopay.com/en/developers/sdk, https://tilopay.com/en/developers/agentes/mcp/enlaces-de-pago |
| El portal tiene secciones "API · Hosted payment page" y "Webhooks". No se pudo leer su contenido. | https://tilopay.com/en/developers |

**NO VERIFICADO.** Todo está aislado en `functions/_lib/tilopay.js` y marcado
`[NO VERIFICADO]`. Los nombres vienen de integraciones públicas de terceros
(plugins de WooCommerce y Odoo), no de la documentación oficial:

- La URL base de la API para sandbox y para producción (sale de `TILOPAY_BASE_URL`, que no tiene valor por defecto).
- Login: `POST {base}/login` con `{ apiuser, password }`, que devuelve `access_token`. El encabezado sería `Authorization: bearer <token>` y no se conoce la duración del token.
- Crear el pago: `POST {base}/processPayment` y todos sus campos: `redirect`, `key`, `amount`, `currency`, `orderNumber`, `capture`, `subscription`, `platform`, `billTo*`. Tampoco se conoce el formato del monto (se envía `"29400.00"`) ni que la respuesta traiga `url`.
- Consulta del estado: `POST {base}/consult` con `{ key, orderNumber }`, y la forma de su respuesta (`code` `"1"` = aprobado, `amount`, `currency`, `auth`).
- Formato del cuerpo del webhook y el nombre del campo con el número de orden.
- **La firma oficial de las notificaciones**, ya sea `OrderHash` o un encabezado. No es pública: una integración de terceros indica que Tilopay entrega el algoritmo a pedido, por soporte. El código de este repositorio **no la verifica**.
- Las restricciones del número de orden (largo y caracteres). Se usa `VA` + 16 caracteres hexadecimales.

Si una respuesta de Tilopay no tiene la forma esperada, el código falla cerrado:
la orden queda `pending` y nunca se marca pagada por error.

## 2. Cómo funciona

```
Navegador                      Cloudflare Functions                    Tilopay
──────────                     ────────────────────                    ───────
POST /api/tilopay/create-order ─► valida id/formato/cantidad
  { items:[{id,format,quantity}],  calcula monto (catálogo del servidor)
    delivery, customer }           guarda orden "pending" en D1 ───────► login + processPayment
                               ◄── { orderId, amount, url } ◄────────── url de pago
redirige a url ──────────────────────────────────────────────────────► el cliente paga
                                                                         │
/carrito?vorder=VA… ◄───────────────────────────────────── retorno ─────┤
GET /api/tilopay/order-status ─► lee D1 (ignora los parámetros         │
  (consulta cada 3 s ~2 min)       que Tilopay pone en la URL)          │
                                                                         │
                               POST /api/tilopay/webhook/<TOKEN> ◄──────┘
                                 1. token de la URL = secreto (tiempo constante) o 401
                                 2. del cuerpo solo se toma el número de orden
                                 3. consulta a Tilopay el estado real (servidor a servidor)
                                 4. monto y moneda = orden guardada; si no, "mismatch"
                                 5. UPDATE … WHERE status IN ('pending','rejected') → "paid" una sola vez
```

**Autenticidad del webhook.** Como la firma de Tilopay no está documentada, la
verificación se basa en dos cosas:

1. Un secreto en la URL. Solo Cloudflare y tu configuración en Tilopay conocen `TILOPAY_WEBHOOK_TOKEN`. Si no coincide, la respuesta es 401 y no se lee el cuerpo.
2. Se ignora el contenido de la notificación y se consulta a Tilopay. Así, aunque alguien conozca la URL, no puede marcar una orden como pagada sin que Tilopay lo confirme.

Cuando obtengás la especificación de la firma oficial, agregá esa verificación
en `functions/api/tilopay/webhook/[token].js`, justo después del paso 1.

**Idempotencia.**

- Las notificaciones repetidas se reconocen por el hash SHA-256 del cuerpo (tabla `webhook_events`).
- El paso a `paid` es un `UPDATE` condicional. Solo la notificación que efectivamente cambia la fila ejecuta `onOrderPaid`, que registra el pedido en la hoja si `ORDER_LOG_URL` está configurada.

**Logs.** Todo pasa por `logOrder(orderId, status)`. No se registran cuerpos,
datos del cliente, tokens ni respuestas de Tilopay.

### Archivos

| Archivo | Qué hace |
|---|---|
| `functions/api/tilopay/create-order.js` | Calcula el monto y crea la orden y la URL de pago |
| `functions/api/tilopay/webhook/[token].js` | Recibe la notificación: verifica, consulta y marca pagada |
| `functions/api/tilopay/order-status.js` | Estado para el navegador (`processing`/`approved`/`rejected`/`error`) |
| `functions/_lib/tilopay.js` | Adaptador de Tilopay (**todo lo no verificado está aquí**) |
| `functions/_lib/catalog.js` | Precios en CRC y reglas de cálculo (fuente de verdad del cobro) |
| `functions/_lib/catalog-products.js` | id → nivel de precio; se genera con `node tools/build-server-catalog.mjs` |
| `functions/_lib/orders.js`, `migrations/0001_tilopay_orders.sql` | Órdenes en D1 |
| `src/carrito.html`, `src/scripts/carrito.js` | Botón "Pagar con Tilopay" y pantallas de estado |
| `tests/tilopay/tilopay.unit.mjs` | Pruebas: `node --test tests/tilopay/*.unit.mjs` |

> **Precios duplicados.** `src/scripts/fragrance-data.js` (lo que ve el cliente)
> y `functions/_lib/catalog.js` (lo que se cobra) tienen la misma tabla. Si
> cambiás un precio, cambialo en los dos. Si agregás fragancias al catálogo,
> corré `node tools/build-server-catalog.mjs`. Las fragancias que se aprueban
> desde el admin se leen del KV y no hace falta regenerar nada.

## 3. Configuración en Cloudflare Pages

### 3.1 Base de datos D1 (una vez)

```bash
npx wrangler d1 create vency-orders
```

1. Copiá el `database_id` que imprime ese comando.
2. En `wrangler.toml`, descomentá el bloque `[[d1_databases]]` y pegá ahí el ID.
3. Aplicá la migración:

```bash
npx wrangler d1 migrations apply vency-orders --remote
```

Como el proyecto tiene `wrangler.toml` con `pages_build_output_dir`, los
bindings (KV, D1) se toman de ese archivo y no del panel.

### 3.2 Variables y secretos

En **Workers & Pages → vency-web-page → Settings → Variables and Secrets**,
cargá cada variable de `.env.example` dos veces, una por entorno. Usá el tipo
**Secret** (cifrado) para las credenciales. Con `wrangler.toml` presente, las
variables de texto plano del panel pueden quedar bloqueadas, así que lo más
simple es cargarlas todas como Secret.

| Variable | Preview (pruebas) | Production |
|---|---|---|
| `TILOPAY_ENV` | `sandbox` | `production` |
| `TILOPAY_BASE_URL` | URL de sandbox (confirmar en la doc) | URL de producción (confirmar en la doc) |
| `TILOPAY_API_USER` / `TILOPAY_API_PASSWORD` / `TILOPAY_API_KEY` | credenciales sandbox | credenciales reales |
| `TILOPAY_WEBHOOK_TOKEN` | `openssl rand -hex 32` | **otro** valor `openssl rand -hex 32` |
| `TILOPAY_INTEGRATION_VERIFIED` | no hace falta | `true` solo al terminar la sección 5 |
| `ORDER_LOG_URL` | opcional | opcional |

Alternativa por línea de comandos: `npx wrangler pages secret put TILOPAY_API_KEY --project-name vency-web-page`.
Agregá `--env preview` para el entorno Preview.

Después de cambiar variables, hay que **volver a desplegar**: los cambios no se
aplican a despliegues anteriores.

### 3.3 En el panel de Tilopay

- Configurá la URL de notificación (webhook) como
  `https://<tu-dominio>/api/tilopay/webhook/<TILOPAY_WEBHOOK_TOKEN>`.
  Hacelo en sandbox con el dominio de Preview, y en producción con el dominio real.
- Confirmá si la URL de retorno que manda el código
  (`https://<dominio>/carrito?vorder=VA…`) debe estar registrada o permitida en Tilopay.

### 3.4 Desarrollo local

1. Copiá `.env.example` a `.dev.vars` y completalo con datos de sandbox.
2. Corré `npx wrangler pages dev src --d1 DB=vency-orders`.
3. Aplicá la migración en local: `npx wrangler d1 migrations apply vency-orders --local`.

Tilopay no puede llegar a `localhost`. Para recibir webhooks en local necesitás
un túnel (ver `docs/cloudflare-tunnel.md`).

## 4. Pruebas

### Automáticas (sin red; Tilopay simulado)

```bash
node --test tests/tilopay/*.unit.mjs
```

Cubren estos casos:

- El monto se calcula en el servidor e ignora los precios que mande el navegador.
- Set de 3 decants, envío y umbral de envío gratis.
- Productos desconocidos, agotados y cantidades inválidas.
- **Pago aprobado.**
- **Pago rechazado.**
- **Webhook con firma (token) inválida:** responde 401, no consulta a Tilopay y la orden no cambia.
- Webhook duplicado y webhooks concurrentes: un solo pedido.
- Monto o moneda alterados: estado `mismatch`.
- Respuesta desconocida de Tilopay: la orden sigue `pending`.
- Los logs contienen solo `orderId` y `status`.
- Bloqueo de producción mientras `TILOPAY_INTEGRATION_VERIFIED` no sea `true`.

Las respuestas simuladas siguen la forma **asumida** del adaptador. Estas
pruebas validan la lógica propia, no el contrato con Tilopay.

### Manuales en sandbox (despliegue Preview)

Usá las tarjetas de prueba que Tilopay entrega con las credenciales sandbox.
No se incluyen aquí porque no se pudieron verificar.

1. **Aprobado.**
   1. Agregá un frasco al carrito, elegí entrega a domicilio y pagá con la tarjeta de prueba aprobada.
   2. Al volver, la pantalla debe decir "Procesando pago…" y luego "Pago aprobado.".
   3. En D1: `npx wrangler d1 execute vency-orders --remote --command "SELECT id,status,amount FROM orders ORDER BY created_at DESC LIMIT 5"`. La orden debe estar en `paid` con el monto correcto.
2. **Rechazado.** Pagá con la tarjeta de prueba de rechazo. Debe aparecer "Pago rechazado.", la orden debe quedar en `rejected` y el carrito debe conservarse.
3. **Firma inválida:**

   ```bash
   curl -i -X POST "https://<preview>.pages.dev/api/tilopay/webhook/token-incorrecto" -d "orderNumber=VA0000000000000000"
   ```

   Debe responder `401`. En los logs (Functions → Real-time logs) solo debe aparecer `{"orderId":null,"status":"webhook_rejected_signature"}`.
4. **Retorno falsificado.** Abrí `/carrito?vorder=<id de una orden pending>&code=1` sin haber pagado. Debe quedarse en "Procesando…" y terminar en "No pudimos confirmar el pago". La orden **no** debe pasar a `paid`.
5. **Webhook repetido.** En el panel de Tilopay (o reenviando la misma notificación) mandá la notificación dos veces. El pedido debe aparecer una sola vez en la hoja o en `webhook_events`.

## 5. Antes de pasar a producción (verificación manual)

**Contrato con Tilopay** (lo marcado `[NO VERIFICADO]` en `functions/_lib/tilopay.js`):

- [ ] URL base de sandbox y de producción.
- [ ] Endpoint y campos de login, esquema del encabezado `Authorization` y duración del token.
- [ ] Endpoint y campos para crear el pago, formato de `amount`, valor de `currency` para colones (`CRC`) y el campo de la URL en la respuesta.
- [ ] Restricciones de `orderNumber`: ¿acepta `VA` + 16 hexadecimales?
- [ ] Endpoint de consulta por orden y forma exacta de su respuesta: ¿qué código significa aprobado? ¿el monto viene como decimal?
- [ ] Formato del cuerpo del webhook y nombre del campo de la orden.
- [ ] **Firma oficial del webhook.** Pedila a soporte si no está en la doc. Implementala y agregá una prueba de firma inválida para ella.
- [ ] ¿Tilopay reintenta los webhooks ante un 5xx? Si no reintenta, programá una conciliación periódica: consultar las órdenes `pending` de más de 15 minutos.
- [ ] ¿La página alojada permite reintentar con la misma orden después de un rechazo? El código lo soporta (`rejected` → `paid`).

**Operación:**

- [ ] Pruebas manuales de la sección 4 hechas en sandbox, con resultado correcto.
- [ ] Credenciales de producción cargadas solo en el entorno *Production* y como **Secret**. Ninguna aparece en el repositorio (`git log -p | grep -i tilopay_api`).
- [ ] `TILOPAY_WEBHOOK_TOKEN` de producción distinto al de sandbox y de 64 caracteres hexadecimales.
- [ ] URL del webhook configurada en Tilopay producción con el dominio real (HTTPS).
- [ ] Binding D1 `DB` activo en Production y migración aplicada con `--remote`.
- [ ] Precios de `functions/_lib/catalog.js` iguales a los de `src/scripts/fragrance-data.js`. Catálogo regenerado.
- [ ] Una compra real de monto bajo con tarjeta propia, y su reembolso desde el panel de Tilopay.
- [ ] Logs revisados: solo `orderId` y `status`.
- [ ] Una regla de rate limiting en Cloudflare (WAF) para `/api/tilopay/create-order`.
- [ ] Texto legal (`legal.html`): política de reembolsos y de pago con tarjeta.
- [ ] Proceso definido para órdenes `mismatch`: revisarlas a mano en el panel de Tilopay.
- [ ] Recién entonces: `TILOPAY_INTEGRATION_VERIFIED=true` en Production y volver a desplegar.

## 6. Pendientes fuera de este cambio

- `functions/api/checkout.js` (Stripe) **acepta el precio que manda el
  navegador**: cualquiera puede llamarlo con `price: 1`. Hoy ningún botón lo
  usa, pero si `STRIPE_SECRET_KEY` está configurada en Cloudflare, el endpoint
  sigue activo. Conviene eliminarlo o quitar esa variable.
