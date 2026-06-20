# Flujo de pedidos por WhatsApp — Vency Atelier

> Documento operativo para Anthonny. Léelo una vez, configúralo una vez, y el
> día a día se vuelve 2 toques por pedido. Pensado para que **no tengas que
> estar pendiente del chat en vivo**.

---

## 1. Principio (YAGNI)

Vency es un atelier de lote pequeño, no un marketplace. El volumen de pedidos es
bajo. Por eso **no hay servidor, ni base de datos, ni API de WhatsApp, ni
pasarela de pago, ni bot.** El sitio web ya arma el mensaje y abre WhatsApp con
el pedido escrito. Lo único que agregamos es **configuración gratis de WhatsApp
Business**, no software.

La pieza clave: **el mensaje de bienvenida automático ES la confirmación de
recibido.** El cliente queda atendido al instante; vos procesás los pedidos
cuando podés, por lotes, nunca en vivo.

Regla de oro para distinguir pedidos de consultas normales: **todo pedido del
sitio trae una referencia `VA####`.** Si el mensaje no trae `VA`, es una
consulta normal, no un pedido.

---

## 2. El flujo de un vistazo

```
CLIENTE (en el sitio)
  arma el carrito → "Enviar pedido por WhatsApp"
  → WhatsApp abre con el mensaje ya escrito:
      "Pedido VA4821 — Set de 3 Decants + Acqua di Giò 100 ml.
       Total: ₡32.000. [SINPE: adjunto comprobante / Recoger en local]"
  → el cliente lo envía

AL INSTANTE (vos no hacés nada)
  Mensaje de bienvenida automático:
  "¡Gracias! Recibimos tu pedido. Te confirmamos en breve.
   SINPE Móvil: +506 7277-3156 — enviá el comprobante por aquí."

VOS (por lotes, cuando tenés un momento — ~2 toques por pedido)
  SINPE:   ves el comprobante → verificás contra el banco → "Pagado ✅" → etiqueta Pagado
  Recoger: respuesta rápida "Listo para recoger 📍" → etiqueta Listo
  al entregar → etiqueta Entregado
```

---

## 3. Setup inicial (una sola vez)

1. Instalar **WhatsApp Business** (gratis) con el número **+506 7277-3156**
   (el mismo que usa el sitio). Si ese número hoy es WhatsApp personal, decidir:
   migrarlo a Business, o usar otro número y actualizar `WA_NUMBER` en el código.
2. Completar el **perfil**: nombre "Vency Atelier", dirección Heredia, horario,
   link al catálogo.
3. Activar **mensaje de bienvenida** y **mensaje de ausencia** (textos abajo).
4. Crear las **respuestas rápidas** (textos abajo).
5. Crear las **etiquetas** (lista abajo).

> Verificar que `WA_NUMBER` en `src/scripts/decants.js` y el número SINPE en
> `catalogo.html` apunten al mismo número de Business.

---

## 4. Textos listos para pegar

### Mensaje de bienvenida (automático, al primer mensaje del día)
```
¡Gracias por escribir a Vency Atelier!
Si es un pedido, ya lo recibimos y te confirmamos en breve.

Pago por SINPE Móvil: +506 7277-3156 (Vency Atelier).
Enviá el comprobante por aquí y te confirmamos.

Heredia, Costa Rica · Hecho a mano en lote pequeño.
```

### Mensaje de ausencia (fuera de horario)
```
Gracias por tu mensaje. En este momento estamos fuera de horario.
Te respondemos apenas volvamos. Si es un pedido, ya quedó registrado;
podés ir adelantando el SINPE a +506 7277-3156 y enviar el comprobante.
```

### Respuestas rápidas (un toque)
| Atajo | Texto |
|---|---|
| `/pagado` | Pago confirmado ✅ Estamos preparando tu pedido. Te avisamos cuando esté listo. |
| `/recoger` | Tu pedido está listo para recoger en Heredia 📍 Coordinemos hora. El pago se realiza en el local. |
| `/enviado` | Tu pedido va en camino. ¡Gracias por elegir Vency! |
| `/datos-sinpe` | SINPE Móvil: +506 7277-3156 a nombre de Vency Atelier. Enviá el comprobante por aquí. |
| `/agotado` | Esa fragancia se agotó justo. Te ofrezco otra opción o reservártela en el próximo lote, ¿cómo preferís? |
| `/horario` | Atendemos [horario]. Recogidas en Heredia con cita. |

---

## 5. Etiquetas = tu tablero de pedidos (sin base de datos)

La lista de chats etiquetados ES el panel. Flujo de estados:

- `Pedido nuevo` → entró, falta procesar
- `Esperando pago` → SINPE pendiente de comprobante
- `Pagado` → comprobante verificado contra el banco
- `Listo / Recoger` → preparado, esperando entrega o cita
- `Entregado` → cerrado
- `Consulta` → mensaje normal, no es pedido
- `Seguimiento` → pendiente de respuesta del cliente

Para encontrar un pedido viejo: buscar `VA` + número en el buscador de WhatsApp.

---

## 6. Happy path (paso a paso)

### A. SINPE Móvil (pago en línea)
1. Llega el mensaje con `Pedido VA####`, ítems, total, "adjunto comprobante".
2. Bienvenida automática ya respondió (no hacés nada todavía).
3. El cliente envía el comprobante (captura).
4. **Verificás que el dinero llegó de verdad** (notificación del banco / SINPE),
   no solo la captura. Ver sección 7.
5. Toca `/pagado` + etiqueta `Pagado`.
6. Preparás. Al terminar: `/enviado` o `/recoger` + etiqueta correspondiente.

### B. Recoger en local (pago en sitio)
1. Llega el mensaje con `Pedido VA####` y "Recoger en local".
2. Respondés `/recoger` para coordinar hora + etiqueta `Listo / Recoger`.
3. El cliente llega, paga en sitio, entregás. Etiqueta `Entregado`.

---

## 7. Confirmación de pago (el único paso manual a propósito)

SINPE no tiene verificación automática barata para un micro-comercio, así que
este paso lo hace una persona. Es un vistazo, no un trabajo.

**Regla anti-fraude (importante):** confirmá contra la **notificación real del
banco/SINPE**, no contra la captura que manda el cliente. Las capturas se
falsifican. El dinero en tu cuenta es la verdad; la captura es solo el aviso.

- Monto correcto + dinero recibido → `/pagado`, etiqueta `Pagado`, preparás.
- Monto distinto / no llegó → pedir aclaración, mantener `Esperando pago`.

> ponytail: automatizar la verificación SINPE = backend + riesgo. Revisar solo
> si confirmar a mano se vuelve el cuello de botella, o si se quiere cobrar con
> tarjeta (ahí sí, pasarela tipo ONVO/Tilopay con webhook).

---

## 8. Bad paths y edge cases

| Caso | Qué pasa | Qué hacés |
|---|---|---|
| Pedido sin pago (SINPE) que nunca llega | Cliente manda pedido y desaparece | Etiqueta `Esperando pago`. A las 24 h, un toque de seguimiento. Sin respuesta en ~48 h, se cierra sin reservar stock. |
| Comprobante borroso o ilegible | No se puede verificar | Pedir que reenvíe; mantener `Esperando pago`. |
| Comprobante falso / monto que no llegó | Captura no coincide con el banco | No preparar. Avisar diferencia. Nunca confiar solo en la captura. |
| Pago parcial | Llegó menos del total | Avisar saldo pendiente, mantener `Esperando pago`. |
| Pedido duplicado | Cliente arma el carrito 2 veces (2 refs `VA` distintas) | Confirmar cuál es el bueno, cancelar el otro. La ref distinta lo delata. |
| Fragancia agotada tras el pedido | Ordenó antes de marcarse `soldOut` | `/agotado`: ofrecer alternativa o próximo lote. Si ya pagó, devolver o cambiar. |
| "Recoger" y nunca llega | Pedido listo, cliente no aparece | `Seguimiento` a las 24 h. Sin pago de por medio, sin pérdida. |
| Cliente quiere modificar el pedido | "agregá otro" / "quitá uno" | Ajustar a mano en el chat; la ref `VA` sigue siendo la misma. |
| Cliente pide envío a domicilio | El sitio solo ofrece SINPE/recoger | Coordinar envío manual (mensajería/Correos) y cobrar aparte. Si se vuelve común, agregarlo al sitio. |
| Mensaje en inglés / otro país | Cliente fuera de CR | Responder en su idioma; aclarar que SINPE es solo CR, ofrecer alternativa. |
| Reclamo / cancelación / reembolso | Post-venta | Resolver en el chat; etiqueta `Seguimiento`. Volumen bajo, caso por caso. |
| El cliente abre WhatsApp pero no envía | Abandono antes de mandar | No llega nada; no hay nada que hacer (no hay registro). Normal. |
| Varios mensajes por un pedido | Pedido + comprobante + pregunta | Todo queda en el mismo hilo del número. Resolver en orden. |
| Spam / número equivocado | Mensaje sin sentido | Etiqueta `Consulta` o ignorar. |

---

## 9. Mensajes normales (no pedidos)

La línea de Business **va a recibir consultas normales**, no solo pedidos:
"¿tienen tal perfume?", "¿dónde están?", "¿hacen envíos?", "¿me recomendás algo
para la noche?". Cómo manejarlo sin estrés:

- **Discriminador:** sin `VA####` = consulta, no pedido. Etiqueta `Consulta`.
- Respuestas rápidas para las preguntas frecuentes (`/horario`, `/datos-sinpe`,
  link al catálogo).
- Para recomendaciones de aroma: respuesta humana, es parte del valor del
  atelier. No automatizar eso.
- Si una consulta se convierte en pedido, pedile que lo arme en el sitio (así
  llega con ref y total correctos) o anotalo a mano con una ref manual.

---

## 10. Lo que NO automatizamos (y por qué)

- **Verificar pagos SINPE automático** → backend + riesgo de fraude. Un vistazo
  humano es más barato y seguro a este volumen.
- **Bot de respuestas** → las consultas de aroma son el valor de la marca;
  un bot las empobrece. Las respuestas rápidas cubren lo repetitivo.
- **CRM / base de datos** → el tablero de etiquetas + búsqueda por `VA` alcanza.

---

## 11. Diferido (cuándo reconsiderar)

| Construir | Solo cuando |
|---|---|
| WhatsApp Cloud API + función serverless (auto-etiqueta, auto-respuesta) | el volumen supere el procesamiento manual por lotes |
| Pasarela de pago (ONVO / Tilopay / Greenpay) con webhook que confirma solo | quieras cobrar con tarjeta, o reconciliar SINPE a mano moleste |
| Envíos integrados en el sitio | pedir envío deje de ser excepción |
| CRM / base de datos de pedidos | el tablero de etiquetas deje de escalar |

---

## Neto

Cliente: confirmación instantánea y paso siguiente claro.
Vos: ~2 toques por pedido, por lotes, nunca en vivo.
Costo: $0, sin código nuevo más allá de lo que ya existe.
```
[plan] → omitido: API/DB/pasarela/CRM. Agregar cuando el volumen rompa el flujo manual por lotes.
```
