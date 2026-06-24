# Modo vendedor — Guía para Anthonny

> Una sola vez (15 min) para configurarlo. Después, cada venta local son 3 toques.

---

## Qué es

Una página privada en tu teléfono. Accedés con una clave que solo vos sabés.
Desde ahí registrás ventas en el local **sin papel** — el pedido cae directo en
la misma hoja donde llegan los pedidos del sitio web. Un solo libro mayor.

---

## Paso 0 · Configurar la clave (lo hace el dev, una sola vez)

En Google Apps Script → Configuración ⚙️ → **Propiedades de secuencia de comandos**:

| Clave | Valor |
|---|---|
| `SELLER_TOKEN` | la frase que vos eligás (algo que recordés fácil pero no obvio) |

Ejemplos de clave: `vency-local-2026`, `perfumes-heredia-cr`, `atelier-tony-22`

Después de agregarla: **Implementar → Administrar implementaciones → editar ✏️ →
Versión: "Nueva versión" → Implementar**.

---

## Paso 1 · Abrir la página en tu teléfono

La URL es la misma del sitio pero terminando en `.../admin.html`. El dev te la pasa.

- Abrila en Chrome (Brave puede bloquear cosas).
- Te pide la clave → la ingresás → **Entrar**.
- Se guarda en el teléfono. La próxima vez entra directo.
- **Guardá la página como acceso directo** en tu pantalla de inicio:
  Chrome → menú ⋮ → "Agregar a pantalla de inicio".

---

## Paso 2 · Registrar una venta

1. Tocá **DECANT** en las fragancias que el cliente quiere (máx 3 para el set).
   O tocá **30ML** / **100ML** para frascos individuales.
2. Elegí el método de pago: **Efectivo** o **SINPE**.
3. Escribí el nombre del cliente si querés recordarlo (opcional).
4. Tocá **Registrar venta**.
5. Aparece una confirmación con la ref `VA####`. Listo.

> La venta cae al instante en la hoja "Vency — Pedidos" con `Canal=Local, Estado=Pagado`.

---

## Paso 3 · Ver métricas

La parte de arriba de la página muestra:
- **Hoy / Este mes** — plata confirmada (ventas locales + web SINPE recibido).
- **Web vs Local** — split por canal.
- **Efectivo vs SINPE** — split por método.
- **Top fragancias** — las 3 más vendidas del mes.

Se actualiza solo después de cada venta registrada.

---

## Si necesitás cambiar la clave

1. Cambiá `SELLER_TOKEN` en Script Properties.
2. Re-desplegá el Apps Script (Nueva versión).
3. En tu teléfono: **Cerrar sesión** (botón arriba a la derecha) → ingresá la nueva clave.

---

## Reglas de seguridad (simples)

- **La clave NO se comparte** con nadie. Solo la ingresás vos en el teléfono.
- Si alguien más necesita registrar ventas, cambiás la clave después.
- Si perdés el teléfono: cambiá la clave desde un computador. La sesión vieja
  deja de funcionar.
- **Bloqueá la pantalla** del teléfono cuando no lo estés usando.

---

## Qué es el modo vendedor vs el sitio web

| | Sitio web (clientes) | Modo vendedor (Tony) |
|---|---|---|
| Quién lo usa | Clientes | Solo vos |
| Canal en la hoja | Web | Local |
| Estado en la hoja | pendiente | Pagado |
| Abre WhatsApp | Sí | No |
| Requiere clave | No | Sí |

Los pedidos web quedan como `pendiente` hasta que vos confirmés el pago (en tu app del banco).
Las ventas locales quedan como `Pagado` inmediatamente porque vos cobrás en el momento.

---

> Para el flujo completo de WhatsApp (confirmaciones SINPE, etiquetas, respuestas rápidas),
> ver `WHATSAPP-SETUP-ANTHONNY.md` y `WHATSAPP-FLOW.md`.
