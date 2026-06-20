# Registro de pedidos en Google Sheets

Registra cada pedido en una hoja de cálculo, automáticamente, **sin servidor**.
El sitio envía el pedido (con `navigator.sendBeacon`) a un Google Apps Script
que agrega una fila. Gratis.

## Qué es y qué no es

- **Es** un libro mayor: historial ordenable, totales, base para contabilidad.
- **No es** la fuente de verdad. Es *best-effort*: si el cliente no tiene
  internet al tocar "Enviar" o bloquea JS, el pedido igual llega por WhatsApp
  pero no a la hoja. **WhatsApp manda.** Reconciliar por la referencia `VA####`.
- No guarda nombre ni teléfono (el cliente es anónimo hasta WhatsApp). Tony
  cruza el pedido de la hoja con el chat por la ref.

## Setup (una vez, ~10 min)

1. **Crear la hoja.** Google Sheets nuevo, nómbralo "Vency — Pedidos".
   En la fila 1, los encabezados:
   ```
   Fecha | Ref | Artículos | Total | Entrega | Estado | Notas
   ```

2. **Agregar el script.** En la hoja: *Extensiones → Apps Script*. Borra lo que
   haya y pega esto. Reemplazá `PEGAR_ID_DE_LA_HOJA` por el ID de tu hoja (el
   pedazo largo de la URL entre `/d/` y `/edit`). Amarrar por ID evita que el
   script escriba en la hoja equivocada.
   ```javascript
   function doPost(e) {
     var sheet = SpreadsheetApp.openById('PEGAR_ID_DE_LA_HOJA').getSheets()[0];
     var d = {};
     try { d = JSON.parse(e.postData.contents); } catch (err) {}
     sheet.appendRow([
       new Date(),
       d.ref     || '',
       d.items   || '',
       d.total   || '',
       d.entrega || '',
       '',   // Estado (lo llena Tony)
       ''    // Notas
     ]);
     return ContentService.createTextOutput('ok');
   }
   ```
   Guardar (icono de disquete).

   > Si editás el script después de publicarlo, hay que **re-desplegar**:
   > Implementar → Administrar implementaciones → editar ✏️ → Versión: "Nueva
   > versión" → Implementar. La URL `/exec` no cambia.

   > ⚠️ La cuenta NO puede ser de Google Workspace de una organización (ej.
   > universidad): suelen bloquear el acceso "Cualquier persona" y el sitio
   > recibe error 401. Usá una cuenta `@gmail.com` personal.

3. **Publicar como Web App.** Botón *Implementar → Nueva implementación*.
   - Tipo: **Aplicación web**
   - Ejecutar como: **yo**
   - Quién tiene acceso: **Cualquier persona**
   - *Implementar*. Autorizar permisos cuando lo pida.
   - Copiar la **URL del Web App** (termina en `/exec`).

4. **Conectar el sitio.** Pegar esa URL en `src/scripts/decants.js`:
   ```javascript
   var SHEET_LOG_URL = 'https://script.google.com/macros/s/AKfycbyKLIQMvchVIeWXIPwZBegI-Hmc5SOzn4QJy1my18s6FeYBmYvcDPTithRmuJAji8j33g/exec';
   ```
   Subir el cambio (y subir el número de versión `?v=` del catálogo para romper
   caché). Listo: cada pedido aparece como fila nueva.

## Qué ve Tony

Una fila por pedido enviado:

| Fecha | Ref | Artículos | Total | Entrega | Estado | Notas |
|---|---|---|---|---|---|---|
| 2026-06-19 10:14 | VA4821 | Set de 3 Decants (10 ml): Citrus Enigma, Vency Rouge, Infusión Carmesí \| Acqua di Giò · Frasco 100 ml | 32000 | SINPE | | |

- `Estado` y `Notas` los llena Tony a mano (o sigue usando las etiquetas de
  WhatsApp para el estado y deja la hoja solo como registro).
- Para totales del mes: `=SUMA(D:D)` o una tabla dinámica.

## Cómo encaja con WhatsApp

- **Etiquetas de WhatsApp** = tablero vivo (triaje del día).
- **Google Sheet** = registro durable (historial, plata, contabilidad).
- Se cruzan por la ref `VA####`.

## Probar que funciona

1. En el sitio, armá un pedido y tocá "Enviar pedido por WhatsApp".
2. Mirá la hoja: debería aparecer una fila nueva en segundos.
3. Si no aparece: revisar que `SHEET_LOG_URL` esté pegada y que la
   implementación sea "Cualquier persona".

> ponytail: con esto alcanza para el volumen actual. Si algún día se necesita
> capturar nombre/teléfono o confirmar pagos automáticamente, eso ya es API de
> WhatsApp o pasarela de pago. No antes.
