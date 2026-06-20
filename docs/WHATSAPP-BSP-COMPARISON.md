# WhatsApp → Sheet/Inbox: comparación de proveedores (BSP)

> Para cuando el volumen justifique pasar de "registro desde el sitio" a una
> bandeja real con auto-registro. **No es urgente.** Mientras tanto, el sitio →
> Google Sheet ya cubre el libro mayor.
>
> ⚠️ Precios aproximados (cambian seguido). Verificar en los links al final
> antes de contratar.

---

## El "pero" que aplica a TODAS las opciones oficiales

Conectar el número a la WhatsApp Business Platform (cualquier BSP o la Cloud API
directa) **saca el número del modo app simple**. Es decir: pierdes la bandeja de
WhatsApp Business normal y, con ella, el mensaje de bienvenida / respuestas
rápidas / etiquetas que configuramos. El BSP **te devuelve** esas funciones,
pero ahora viven en su panel, no en la app verde. Por eso solo vale la pena
cuando realmente necesitás bandeja de equipo o auto-registro fiable.

## Costo de Meta aparte del BSP
Meta cobra por "conversación", pero las **iniciadas por el cliente (servicio)
son gratis** (cambio de finales de 2024). Como los pedidos los inicia el
cliente, a nivel Meta es prácticamente **$0**. Lo que pagás es la **suscripción
del BSP**.

---

## Comparación

| Proveedor | Qué es | Bandeja incluida | Google Sheets | Precio aprox (mes) | Bueno para |
|---|---|---|---|---|---|
| **Meta Cloud API (directa)** | API cruda de Meta | ❌ (la construís) | vía Make/Zapier | **$0** (1.000 conv. servicio gratis) | devs que arman su propio flujo |
| **360dialog** | reventa de API, sin markup por conversación | ❌ (traés tu inbox/Make) | vía Make/Zapier | **~$5–9** (hosting API) | el más barato con soporte oficial |
| **Wati** | inbox no-code enfocado en WhatsApp | ✅ | ✅ nativo + Zapier | **~$39–49** | PyME que quiere todo listo sin código |
| **Zoko** | WhatsApp para comercio (catálogo/pedidos) | ✅ | vía integraciones | **~$35** | tiendas tipo Shopify |
| **Respond.io** | bandeja omnicanal + workflows | ✅ | vía integraciones/Zapier | **~$79+** | varios agentes / multicanal |
| **Twilio (WhatsApp)** | API pago por uso | ❌ | vía Make/Zapier | **pago por uso** (~$0.005/msj + Meta) | devs, volumen variable |

---

## Recomendación para Vency (volumen bajo)

1. **Hoy:** quedarse con **sitio → Google Sheet** (gratis, ya cableado) + app de
   WhatsApp Business simple (bienvenida/etiquetas). Cubre 95%.

2. **Cuando necesites bandeja real o el teléfono del cliente automático**, dos
   caminos según gusto:
   - **Más barato (DIY):** **360dialog** (API ~$5–9/mo) **+ Make.com**
     (tier gratis) → escribe en Google Sheets y manda auto-respuestas. Vos
     mantenés el flujo, pero es lo más económico.
   - **Listo sin código:** **Wati** (~$39–49/mo). Bandeja + Sheets nativo +
     chatbot. Pagás por no armar nada.

3. **Evitá** Respond.io por ahora (precio para varios agentes, no lo necesitás
   con una persona).

**Disparador para migrar:** cuando reconciliar pedidos a mano (cruzar Sheet con
chats) te empiece a quitar tiempo real, o cuando quieras que varias personas
respondan el WhatsApp. Antes de eso, no.

---

## Cómo decidir en 30 segundos

```
¿Necesitás que MÁS de una persona conteste el WhatsApp?
  Sí → BSP con bandeja (Wati barato / Respond.io si son varios)
  No → ¿El registro desde el sitio te alcanza?
         Sí → no cambiar nada
         No (querés teléfono del cliente + auto-log fiable)
            → 360dialog + Make (barato)  o  Wati (sin código)
```

---

## Links para verificar precios actuales
- Meta Cloud API (precios de conversación): https://developers.facebook.com/docs/whatsapp/pricing
- 360dialog: https://www.360dialog.com/whatsapp-api-pricing
- Wati: https://www.wati.io/pricing
- Zoko: https://www.zoko.io/pricing
- Respond.io: https://respond.io/pricing
- Twilio WhatsApp: https://www.twilio.com/whatsapp/pricing
- Make (para el camino DIY): https://www.make.com/en/pricing

> ponytail: esto es decisión de "después". El sitio → Sheet + app simple es el
> default correcto hasta que el volumen lo rompa.
