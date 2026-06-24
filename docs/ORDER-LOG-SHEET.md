# Registro de pedidos en Google Sheets

Registra cada venta — web o local — en un solo libro mayor, sin servidor.
El sitio web usa `navigator.sendBeacon`; el modo vendedor usa `fetch`.
Ambos escriben al mismo Apps Script Web App.

## Qué es y qué no es

- **Es** el libro mayor: historial, totales, split web/local, base contable.
- **No es** la fuente de verdad para pedidos web. Best-effort: si el cliente
  no tiene internet al tocar "Enviar", el pedido llega por WhatsApp pero no a
  la hoja. **WhatsApp manda para web.** Reconciliar por la ref `VA####`.
- Las ventas locales (modo vendedor) son fuente de verdad porque Tony las
  registra él mismo.
- No guarda nombre ni teléfono del cliente web (anónimo hasta WhatsApp).

---

## Schema de la hoja "Pedidos" (9 columnas)

```
 A        B     C       D             E          F        G         H        I
Fecha    Ref   Canal   Artículos   Total (₡)   Pago   Entrega   Estado   Cliente / Nota
```

| Columna | Valores posibles |
|---|---|
| Canal | `Web` / `Local` |
| Pago | `SINPE` / `Efectivo` / `En sitio` |
| Entrega | `SINPE` / `Recoger` / `En sitio` |
| Estado | `pendiente` (web, esperando SINPE) / `Pagado` (local, cobrado) |
| Cliente / Nota | texto libre, solo en ventas locales |

---

## Setup (una vez, ~20 min)

### Paso 1 — Crear la hoja

Google Sheets nuevo desde una cuenta `@gmail.com` personal (no de organización).
Nómbrala **"Vency — Pedidos"**. Dejá la fila 1 en blanco — `setupSheet()` la llena.

### Paso 2 — Agregar el script

Extensiones → Apps Script. Borrá todo el contenido y pegá lo siguiente:

```javascript
var SHEET_ID         = '1grSye_o_5FnMSW6ajEttwfRP_bZWtbicIg60IejrJnA';
var SHEET_NAME       = 'Pedidos';
var SELLER_TOKEN_KEY = 'SELLER_TOKEN';

/* ── Web App entry point ── */

function doPost(e) {
  var d = {};
  try { d = JSON.parse(e.postData.contents); } catch (err) {
    return ContentService.createTextOutput('error');
  }

  var props     = PropertiesService.getScriptProperties();
  var realToken = props.getProperty(SELLER_TOKEN_KEY) || '';
  var sentToken = String(d.token || '');
  var tokenOk   = realToken.length > 0
               && sentToken.length === realToken.length
               && sentToken === realToken;

  var ss = SpreadsheetApp.openById(SHEET_ID);

  /* Resumen de métricas (requiere token) */
  if (d.action === 'summary') {
    if (!tokenOk) return ContentService.createTextOutput('{}')
      .setMimeType(ContentService.MimeType.JSON);
    return ContentService.createTextOutput(JSON.stringify(buildSummary_(d.month, d.period)))
      .setMimeType(ContentService.MimeType.JSON);
  }

  /* Confirmar pedido web pendiente → Estado: pendiente → Pagado + descuenta stock (requiere token) */
  if (d.action === 'confirm') {
    if (!tokenOk) return ContentService.createTextOutput('error');
    var cRef = String(d.ref || '');
    if (!/^VA\d{4}$/.test(cRef)) return ContentService.createTextOutput('bad_ref');
    var cSheet = ss.getSheetByName(SHEET_NAME);
    var cData  = cSheet.getDataRange().getValues();
    for (var ci = 1; ci < cData.length; ci++) {
      if (String(cData[ci][1]) === cRef && cData[ci][7] === 'pendiente') {
        cSheet.getRange(ci + 1, 8).setValue('Pagado');
        var inv = getInventory_(ss);
        var stockUpdates = parseItemsToOilUpdates_(cData[ci][3], inv);
        if (stockUpdates.length) updateStock_(ss, stockUpdates);
        return ContentService.createTextOutput('ok');
      }
    }
    return ContentService.createTextOutput('not_found');
  }

  /* Cancelar pedido → restaurar stock + eliminar fila (requiere token) */
  if (d.action === 'cancel') {
    if (!tokenOk) return ContentService.createTextOutput('error');
    var cRef = String(d.ref || '');
    if (!/^VA\d{4}$/.test(cRef)) return ContentService.createTextOutput('bad_ref');
    var cSheet = ss.getSheetByName(SHEET_NAME);
    var cData  = cSheet.getDataRange().getValues();
    for (var ci = 1; ci < cData.length; ci++) {
      if (String(cData[ci][1]) === cRef) {
        /* Solo restaurar aceite si el pedido fue confirmado (Pagado) */
        if (cData[ci][7] === 'Pagado') {
          var inv = getInventory_(ss);
          var restores = parseItemsToOilUpdates_(cData[ci][3], inv).map(function (u) {
            return { key: u.key, delta_ml: -u.delta_ml };
          });
          if (restores.length) updateStock_(ss, restores);
        }
        cSheet.deleteRow(ci + 1);
        return ContentService.createTextOutput('ok');
      }
    }
    return ContentService.createTextOutput('not_found');
  }

  /* Stock público — sin token, solo booleano disponible/agotado */
  if (d.action === 'stock-public') {
    return ContentService.createTextOutput(JSON.stringify(getPublicStock_(ss)))
      .setMimeType(ContentService.MimeType.JSON);
  }

  /* Inventario — leer stock actual (requiere token) */
  if (d.action === 'inventory') {
    if (!tokenOk) return ContentService.createTextOutput('{}')
      .setMimeType(ContentService.MimeType.JSON);
    return ContentService.createTextOutput(JSON.stringify(getInventory_(ss)))
      .setMimeType(ContentService.MimeType.JSON);
  }

  /* Inventario — actualizar stock tras venta o ajuste manual (requiere token) */
  if (d.action === 'stock') {
    if (!tokenOk) return ContentService.createTextOutput('{}')
      .setMimeType(ContentService.MimeType.JSON);
    updateStock_(ss, d.updates || []);
    return ContentService.createTextOutput('ok');
  }

  /* Rate limit para requests sin token: máx 30 por minuto */
  if (!tokenOk && isRateLimited_()) {
    return ContentService.createTextOutput('slow');
  }

  /* Validación de schema */
  var ref   = String(d.ref   || '');
  var items = String(d.items || '');
  var total = Number(d.total);
  if (!/^VA\d{4}$/.test(ref))                     return ContentService.createTextOutput('bad_ref');
  if (items.length === 0 || items.length > 500)   return ContentService.createTextOutput('bad_items');
  if (isNaN(total) || total <= 0 || total > 500000) return ContentService.createTextOutput('bad_total');

  /* Dedupe por ref (solo escrituras web, TTL 10 min) */
  if (!tokenOk) {
    var cache = CacheService.getScriptCache();
    if (cache.get('ref_' + ref)) return ContentService.createTextOutput('dup');
    cache.put('ref_' + ref, '1', 600);
  }

  /* El servidor decide canal/estado. Nunca confía en el cliente */
  var canal   = tokenOk ? 'Local'    : 'Web';
  var estado  = tokenOk ? 'Pagado'   : 'pendiente';
  var pago    = tokenOk ? String(d.pago || 'Efectivo') : String(d.pago || 'SINPE');
  var entrega = tokenOk ? 'En sitio' : (d.entrega === 'Recoger' ? 'Recoger' : 'SINPE');
  var cliente = tokenOk ? String(d.cliente || '') : '';

  ss.getSheetByName(SHEET_NAME)
    .appendRow([new Date(), ref, canal, items, total, pago, entrega, estado, cliente]);

  return ContentService.createTextOutput('ok');
}

/* ── Rate limiter ── */

function isRateLimited_() {
  var cache = CacheService.getScriptCache();
  var key   = 'rate_' + Math.floor(Date.now() / 60000);
  var count = parseInt(cache.get(key) || '0', 10);
  if (count >= 30) return true;
  cache.put(key, String(count + 1), 70);
  return false;
}

/* ── Aggregation (used by admin panel metrics) ── */

function buildSummary_(monthParam, period) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  var rows  = sheet.getDataRange().getValues();
  var hoy   = new Date(); hoy.setHours(0, 0, 0, 0);
  var p     = String(period || 'mes');

  /* Date range for the selected period */
  var rangeStart, rangeEnd;
  if (p === 'hoy') {
    rangeStart = hoy;
    rangeEnd   = new Date(hoy.getTime() + 86400000);
  } else if (p === 'semana') {
    rangeStart = new Date(hoy);
    rangeStart.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7)); /* lunes */
    rangeEnd   = new Date(hoy.getTime() + 86400000);
  } else {
    var mp = String(monthParam || '').match(/^(\d{4})-(\d{2})$/);
    if (mp) {
      rangeStart = new Date(parseInt(mp[1]), parseInt(mp[2]) - 1, 1);
      rangeEnd   = new Date(parseInt(mp[1]), parseInt(mp[2]),     1);
    } else {
      rangeStart = new Date(hoy.getFullYear(), hoy.getMonth(),     1);
      rangeEnd   = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
    }
  }

  /* Calendar daily totals always span the selected month, regardless of period */
  var mp2 = String(monthParam || '').match(/^(\d{4})-(\d{2})$/);
  var calStart = mp2
    ? new Date(parseInt(mp2[1]), parseInt(mp2[2]) - 1, 1)
    : new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  var calEnd = new Date(calStart.getFullYear(), calStart.getMonth() + 1, 1);

  var s = { today: 0, month: 0, web: 0, local: 0, efectivo: 0, sinpe: 0,
            webPendiente: 0, fragrances: {}, sales: [], daily: {} };

  for (var i = 1; i < rows.length; i++) {
    var r           = rows[i];
    var isPendiente = r[7] === 'pendiente';
    var fecha       = new Date(r[0]);
    var total       = Number(r[4]) || 0;

    if (fecha >= hoy && fecha < new Date(hoy.getTime() + 86400000)) s.today += total;

    if (fecha >= rangeStart && fecha < rangeEnd) {
      s.month += total;
      if (r[2] === 'Web')   s.web   += total;
      if (r[2] === 'Local') s.local += total;
      if (isPendiente && r[2] === 'Web') s.webPendiente += total;
      if (!isPendiente) {
        if (r[5] === 'Efectivo') s.efectivo += total;
        if (r[5] === 'SINPE')   s.sinpe    += total;
      }
      String(r[3]).split(/\n|\|/).forEach(function (it) {
        var name = it.trim()
          .replace(/^Set de 3 Decants \(10 ml\):/, '')
          .split('\xb7')[0].trim();
        if (name) s.fragrances[name] = (s.fragrances[name] || 0) + 1;
      });
      if (s.sales.length < 30) {
        var hora = '--:--';
        try {
          var fd = new Date(r[0]);
          hora   = ('0' + fd.getHours()).slice(-2) + ':' + ('0' + fd.getMinutes()).slice(-2);
        } catch (e) {}
        var saleDate = fecha.getFullYear() + '-'
                     + ('0' + (fecha.getMonth() + 1)).slice(-2) + '-'
                     + ('0' + fecha.getDate()).slice(-2);
        s.sales.push({
          ref:    String(r[1]),
          items:  summarizeItems_(r[3]),
          raw:    String(r[3]),
          total:  total,
          pago:   String(r[5]),
          hora:   hora,
          estado: String(r[7]),
          fecha:  saleDate
        });
      }
    }
    /* Daily calendar totals — always for the selected calendar month, independent of period */
    if (!isPendiente && fecha >= calStart && fecha < calEnd) {
      var dk = fecha.getFullYear() + '-'
             + ('0' + (fecha.getMonth() + 1)).slice(-2) + '-'
             + ('0' + fecha.getDate()).slice(-2);
      s.daily[dk] = (s.daily[dk] || 0) + total;
    }
  }
  s.sales.reverse();
  /* Pending first so Tony sees what needs action immediately */
  s.sales.sort(function (a, b) {
    if (a.estado === 'pendiente' && b.estado !== 'pendiente') return -1;
    if (a.estado !== 'pendiente' && b.estado === 'pendiente') return  1;
    return 0;
  });
  return s;
}

function summarizeItems_(raw) {
  var parts  = String(raw).split(/\n| \| /);
  var labels = parts.map(function (p) {
    p = p.trim();
    if (p.indexOf('Set de 3 Decants') === 0) return '3 Decants';
    var m = p.match(/^(.+?) \xb7 (Frasco (\d+) ml|Decant 10 ml)/);
    if (m) {
      var nm  = m[1].length > 16 ? m[1].slice(0, 14) + '…' : m[1];
      var fmt = m[3] ? m[3] + 'ml' : '10ml';
      return nm + ' ' + fmt;
    }
    return p.length > 20 ? p.slice(0, 18) + '…' : p;
  });
  var summary = labels.join(', ');
  return summary.length > 46 ? summary.slice(0, 45) + '…' : summary;
}

/* ── Stock público — booleano por formato derivado del aceite (sin token) ── */

function getPublicStock_(ss) {
  var sheet = ss.getSheetByName('Inventario');
  if (!sheet) return {};
  var rows = sheet.getDataRange().getValues();
  var out  = {};
  for (var i = 1; i < rows.length; i++) {
    var key    = String(rows[i][0]);
    var pct    = parseFloat(rows[i][2]) || 0;
    var oil_ml = parseFloat(rows[i][3]) || 0;
    if (!key || pct <= 0) continue;
    var frac = pct / 100;
    out[key + ':decant'] = oil_ml >= frac * 10;
    out[key + ':30ml']   = oil_ml >= frac * 30;
    out[key + ':100ml']  = oil_ml >= frac * 100;
  }
  return out;
}

/* ── Inventario — leer stock de aceite ── */

function getInventory_(ss) {
  var sheet = ss.getSheetByName('Inventario');
  if (!sheet) return {};
  var rows = sheet.getDataRange().getValues();
  var inv  = {};
  for (var i = 1; i < rows.length; i++) {
    var key = String(rows[i][0]);
    if (key) inv[key] = {
      pct:    parseFloat(rows[i][2]) || 0,
      oil_ml: parseFloat(rows[i][3]) || 0
    };
  }
  return inv;
}

/* ── Parsear artículos del pedido → updates de aceite ── */

function slugify_(s) {
  return s.toLowerCase()
    .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i')
    .replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u').replace(/ñ/g, 'n')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function parseItemsToOilUpdates_(rawItems, inv) {
  var updates = [];
  String(rawItems).split(' | ').forEach(function (part) {
    part = part.trim();

    /* Set de 3 Decants (10 ml): Citrus Enigma (20%), Vency Rouge (35%), ... */
    var setM = part.match(/^Set de 3 Decants \(10 ml\): (.+)$/);
    if (setM) {
      setM[1].split(',').forEach(function (entry) {
        entry = entry.trim();
        var pctM  = entry.match(/\((\d+(?:\.\d+)?)%\)$/);
        var pct   = pctM ? parseFloat(pctM[1]) : null;
        var name  = pctM ? entry.slice(0, entry.lastIndexOf('(')).trim() : entry;
        var key   = slugify_(name);
        var stock = inv[key];
        if (!stock) return;
        var usedPct = pct || stock.pct;
        if (!usedPct) return;
        updates.push({ key: key, delta_ml: -(usedPct / 100) * 10 });
      });
      return;
    }

    /* Citrus Enigma · Frasco 30 ml · Extrait (40%)   (pct optional for legacy rows) */
    var bottleM = part.match(/^(.+?) \xb7 Frasco (\d+) ml(?:\s*\xb7\s*.+?\((\d+(?:\.\d+)?)%\))?/);
    if (bottleM) {
      var key   = slugify_(bottleM[1].trim());
      var fmtMl = parseInt(bottleM[2]);
      var pct   = bottleM[3] ? parseFloat(bottleM[3]) : (inv[key] && inv[key].pct);
      if (!inv[key] || !pct) return;
      updates.push({ key: key, delta_ml: -(pct / 100) * fmtMl });
      return;
    }

    /* Citrus Enigma · Decant 10 ml · EDP (20%)   (pct optional for legacy rows) */
    var decantM = part.match(/^(.+?) \xb7 Decant 10 ml(?:\s*\xb7\s*.+?\((\d+(?:\.\d+)?)%\))?/);
    if (decantM) {
      var key = slugify_(decantM[1].trim());
      var pct = decantM[2] ? parseFloat(decantM[2]) : (inv[key] && inv[key].pct);
      if (!inv[key] || !pct) return;
      updates.push({ key: key, delta_ml: -(pct / 100) * 10 });
    }
  });
  return updates;
}

/* ── Inventario — actualizar stock de aceite ── */

function updateStock_(ss, updates) {
  if (!updates || !updates.length) return;
  var sheet = ss.getSheetByName('Inventario');
  if (!sheet) return;
  var data     = sheet.getDataRange().getValues();
  var keyToRow = {};
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) keyToRow[String(data[i][0])] = i + 1;
  }
  updates.forEach(function (u) {
    var key = String(u.key || '');
    if (!key) return;
    var row = keyToRow[key];
    if (row) {
      if (u.set_oil_ml !== undefined) {
        sheet.getRange(row, 4).setValue(Math.max(0, parseFloat(u.set_oil_ml) || 0));
      } else if (u.delta_ml !== undefined) {
        var cell = sheet.getRange(row, 4);
        cell.setValue(Math.max(0, (parseFloat(cell.getValue()) || 0) + (parseFloat(u.delta_ml) || 0)));
      }
      if (u.set_pct !== undefined) {
        sheet.getRange(row, 3).setValue(Math.min(100, Math.max(0, parseFloat(u.set_pct) || 0)));
      }
    } else {
      /* Fila nueva: crear solo si hay aceite o concentración para guardar */
      var oil_ml = u.set_oil_ml !== undefined ? parseFloat(u.set_oil_ml) || 0
                 : Math.max(0, parseFloat(u.delta_ml) || 0);
      var pct    = Math.min(100, Math.max(0, parseFloat(u.set_pct || u.pct) || 0));
      if (oil_ml > 0 || pct > 0) {
        var name = key.replace(/-/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); });
        sheet.appendRow([key, name, pct, oil_ml]);
      }
    }
  });
}

/* ════════════════════════════════════════════════════
   SETUP — ejecutar UNA SOLA VEZ desde el editor
   (Ejecutar → setupSheet)
   ════════════════════════════════════════════════════ */

function setupSheet() {
  var ss    = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  sheet.setName(SHEET_NAME);

  /* 1 — Encabezados */
  var headers = [
    'Fecha', 'Ref', 'Canal', 'Artículos', 'Total (₡)',
    'Pago', 'Entrega', 'Estado', 'Cliente / Nota'
  ];
  var hRow = sheet.getRange(1, 1, 1, headers.length);
  hRow.setValues([headers])
      .setBackground('#1A2F2F')
      .setFontColor('#F0EDE6')
      .setFontWeight('bold')
      .setFontSize(10)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 34);
  sheet.setFrozenRows(1);

  /* 2 — Anchos de columna */
  sheet.setColumnWidth(1, 148); // Fecha
  sheet.setColumnWidth(2, 78);  // Ref
  sheet.setColumnWidth(3, 68);  // Canal
  sheet.setColumnWidth(4, 340); // Artículos
  sheet.setColumnWidth(5, 108); // Total
  sheet.setColumnWidth(6, 85);  // Pago
  sheet.setColumnWidth(7, 85);  // Entrega
  sheet.setColumnWidth(8, 98);  // Estado
  sheet.setColumnWidth(9, 175); // Cliente / Nota

  /* 3 — Formatos de número */
  sheet.getRange('A2:A').setNumberFormat('dd/MM/yyyy  HH:mm');
  sheet.getRange('E2:E').setNumberFormat('"₡"#,##0');

  /* 4 — Ajuste de texto en columnas largas */
  sheet.getRange('D2:D').setWrap(true);
  sheet.getRange('I2:I').setWrap(true);

  /* 5 — Alineación */
  sheet.getRange('A2:A').setHorizontalAlignment('left');
  sheet.getRange('B2:C').setHorizontalAlignment('center');
  sheet.getRange('E2:E').setHorizontalAlignment('right');
  sheet.getRange('F2:H').setHorizontalAlignment('center');

  /* 6 — Formato condicional
     Orden: las reglas más específicas van al final (mayor prioridad) */
  var dr = sheet.getRange('A2:I2000');
  var rules = [];

  /* Filas Web: fondo azul muy suave */
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$C2="Web"')
    .setBackground('#EBF4FB')
    .setRanges([dr])
    .build());

  /* Filas Local: fondo parchment cálido */
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$C2="Local"')
    .setBackground('#FEF7EC')
    .setRanges([dr])
    .build());

  /* Estado "pendiente": celda ámbar — necesita atención */
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('pendiente')
    .setBackground('#FFF2CC')
    .setFontColor('#7D4E00')
    .setFontWeight('bold')
    .setRanges([sheet.getRange('H2:H2000')])
    .build());

  /* Estado "Pagado": celda verde — confirmado */
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Pagado')
    .setBackground('#D9EAD3')
    .setFontColor('#2A6020')
    .setRanges([sheet.getRange('H2:H2000')])
    .build());

  sheet.setConditionalFormatRules(rules);

  /* 7 — Hoja de resumen */
  setupResumenSheet_(ss);

  /* 8 — Hoja de inventario */
  setupInventarioSheet_(ss);

  SpreadsheetApp.flush();
  Logger.log('Setup completado. Chequeá las hojas Pedidos, Resumen e Inventario.');
}

/* ── Hoja de resumen con fórmulas ── */

function setupResumenSheet_(ss) {
  var name = 'Resumen';
  var rs   = ss.getSheetByName(name);
  if (!rs) rs = ss.insertSheet(name, 1); /* segunda pestaña */
  rs.clearContents();
  rs.clearFormats();
  rs.setTabColor('#1A2F2F');

  /* Fórmulas de mes actual */
  var mesStart = '=DATE(YEAR(TODAY()),MONTH(TODAY()),1)';
  var mesEnd   = '=DATE(YEAR(TODAY()),MONTH(TODAY())+1,1)';

  var rows = [
    /* fila 1 — título */
    ['VENCY ATELIER', 'Libro mayor', ''],
    /* fila 2 — vacía */
    ['', '', ''],
    /* fila 3 — bloque mes actual */
    ['MES ACTUAL', '', '=TEXT(TODAY(),"MMMM YYYY")'],
    ['Ventas confirmadas (Pagado)',
      '',
      '=SUMPRODUCT((Pedidos!H$2:H$2000="Pagado")*(Pedidos!A$2:A$2000>=' + mesStart + ')*(Pedidos!A$2:A$2000<' + mesEnd + ')*Pedidos!E$2:E$2000)'],
    ['Canal Web',
      '',
      '=SUMPRODUCT((Pedidos!C$2:C$2000="Web")*(Pedidos!H$2:H$2000="Pagado")*(Pedidos!A$2:A$2000>=' + mesStart + ')*(Pedidos!A$2:A$2000<' + mesEnd + ')*Pedidos!E$2:E$2000)'],
    ['Canal Local',
      '',
      '=SUMPRODUCT((Pedidos!C$2:C$2000="Local")*(Pedidos!A$2:A$2000>=' + mesStart + ')*(Pedidos!A$2:A$2000<' + mesEnd + ')*Pedidos!E$2:E$2000)'],
    ['Efectivo',
      '',
      '=SUMPRODUCT((Pedidos!F$2:F$2000="Efectivo")*(Pedidos!H$2:H$2000="Pagado")*(Pedidos!A$2:A$2000>=' + mesStart + ')*(Pedidos!A$2:A$2000<' + mesEnd + ')*Pedidos!E$2:E$2000)'],
    ['SINPE confirmado',
      '',
      '=SUMPRODUCT((Pedidos!F$2:F$2000="SINPE")*(Pedidos!H$2:H$2000="Pagado")*(Pedidos!A$2:A$2000>=' + mesStart + ')*(Pedidos!A$2:A$2000<' + mesEnd + ')*Pedidos!E$2:E$2000)'],
    /* fila 9 — vacía */
    ['', '', ''],
    /* fila 10 — bloque global */
    ['TOTAL HISTÓRICO', '', ''],
    ['Total confirmado (todos los meses)',
      '',
      '=SUMIF(Pedidos!H:H,"Pagado",Pedidos!E:E)'],
    ['Pedidos web sin confirmar (pendientes)',
      '',
      '=COUNTIF(Pedidos!H:H,"pendiente")'],
    ['Monto pendiente web',
      '',
      '=SUMIF(Pedidos!H:H,"pendiente",Pedidos!E:E)'],
    /* fila 14 — vacía */
    ['', '', ''],
    /* fila 15 — nota */
    ['Los totales excluyen Estado=pendiente', '', ''],
  ];

  rs.getRange(1, 1, rows.length, 3).setValues(rows);

  /* Estilo fila 1 (título) */
  rs.getRange(1, 1, 1, 3)
    .merge()
    .setBackground('#1A2F2F')
    .setFontColor('#F0EDE6')
    .setFontWeight('bold')
    .setFontSize(13)
    .setHorizontalAlignment('left')
    .setVerticalAlignment('middle');
  rs.setRowHeight(1, 38);

  /* Estilo encabezados de bloque (filas 3 y 10) */
  [3, 10].forEach(function (r) {
    rs.getRange(r, 1)
      .setFontWeight('bold')
      .setFontColor('#1A2F2F')
      .setFontSize(10);
  });

  /* Fondo suave en filas de datos (3-8 y 10-13) */
  rs.getRange(3, 1, 6, 3).setBackground('#F7F5F0');
  rs.getRange(10, 1, 4, 3).setBackground('#F7F5F0');

  /* Formato moneda en columna C (valores numéricos) */
  rs.getRange('C4:C8').setNumberFormat('"₡"#,##0');
  rs.getRange('C11:C13').setNumberFormat('"₡"#,##0');

  /* Nota al pie en gris */
  rs.getRange(rows.length, 1)
    .setFontColor('#888888')
    .setFontStyle('italic')
    .setFontSize(9);

  /* Anchos de columna */
  rs.setColumnWidth(1, 250);
  rs.setColumnWidth(2, 16);
  rs.setColumnWidth(3, 160);

  rs.setFrozenRows(1);
}

/* ── Hoja de inventario ── */

function setupInventarioSheet_(ss) {
  var name  = 'Inventario';
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name, 2); /* tercera pestaña */
  sheet.clearContents();
  sheet.clearFormats();
  sheet.setTabColor('#5B8A5B');

  /* Encabezados */
  var headers = ['Clave', 'Fragancia', 'Conc. (%)', 'Aceite (ml)'];
  var hRow = sheet.getRange(1, 1, 1, 4);
  hRow.setValues([headers])
      .setBackground('#1A2F2F')
      .setFontColor('#F0EDE6')
      .setFontWeight('bold')
      .setFontSize(10)
      .setHorizontalAlignment('center');
  sheet.setRowHeight(1, 32);
  sheet.setFrozenRows(1);

  /* Anchos */
  sheet.setColumnWidth(1, 200); /* Clave */
  sheet.setColumnWidth(2, 200); /* Fragancia */
  sheet.setColumnWidth(3, 90);  /* Conc. % */
  sheet.setColumnWidth(4, 100); /* Aceite ml */

  /* Formato numérico */
  sheet.getRange('C2:C').setNumberFormat('0"%"');
  sheet.getRange('D2:D').setNumberFormat('0.0" ml"');
  sheet.getRange('C2:D').setHorizontalAlignment('center');

  /* Formato condicional: aceite = 0 → rojo suave */
  var rule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberEqualTo(0)
    .setBackground('#F4CCCC')
    .setFontColor('#880000')
    .setRanges([sheet.getRange('D2:D2000')])
    .build();
  sheet.setConditionalFormatRules([rule]);

  /* Nota en fila 1 de columna E */
  sheet.getRange(1, 5)
    .setValue('Las claves las genera el POS automáticamente. No editar columna A.')
    .setFontColor('#888888')
    .setFontStyle('italic')
    .setFontSize(9);
  sheet.setColumnWidth(5, 350);
}
```

Guardar (Ctrl + S).

### Paso 3 — Ejecutar `setupSheet` (una sola vez)

En el editor de Apps Script:
1. En el menú desplegable de funciones (arriba), seleccioná **`setupSheet`**.
2. Clic en ▶ **Ejecutar**.
3. Autorizá los permisos si los pide.
4. Esperá el mensaje "Setup completado" en el log.

Esto hace automáticamente:
- Crea los encabezados con formato (fondo oscuro, texto parchment)
- Congela la primera fila
- Ajusta el ancho de cada columna
- Formatea Fecha como `20/06/2026 10:14` y Total como `₡12.000`
- Activa formato condicional:
  - Filas Web: tinte azul claro
  - Filas Local: tinte parchment cálido
  - Estado `pendiente`: celda ámbar (necesita acción)
  - Estado `Pagado`: celda verde (cobrado)
- Crea la segunda pestaña **Resumen** con fórmulas de totales
- Crea la tercera pestaña **Inventario** para control de stock

> Solo se corre una vez. Si necesitás re-aplicar el formato, volvé a ejecutarla — no borra datos.

### Paso 4 — Configurar la clave del vendedor

Apps Script → Configuración ⚙️ → **Propiedades de secuencia de comandos**.
Agregar: clave `SELLER_TOKEN`, valor = la clave que Tony va a usar.

### Paso 5 — Publicar como Web App

Implementar → Nueva implementación.
- Tipo: **Aplicación web**
- Ejecutar como: **yo**
- Quién tiene acceso: **Cualquier persona**
- Implementar. Autorizar permisos.
- Copiar la URL `/exec`.

### Paso 6 — Conectar al sitio

La URL va en dos lugares:

```
src/scripts/decants.js  →  SHEET_LOG_URL = 'https://script.google.com/...'
src/scripts/admin.js    →  EXEC_URL      = 'https://script.google.com/macros/s/AKfycbyPrmg66PX0O-J07JefNR7X-o9s6VWxieHGJS0mKslUbVAt3iD6s-Tc9CMc1OsPuFCJ/exec'
```

> Cada vez que editás el script: Implementar → Administrar implementaciones →
> editar ✏️ → **Nueva versión** → Implementar. **La URL no cambia.**

---

## Cómo se ve la hoja "Pedidos" después del setup

| Fecha | Ref | Canal | Artículos | Total (₡) | Pago | Entrega | Estado | Cliente / Nota |
|---|---|---|---|---|---|---|---|---|
| 20/06/2026 10:14 | VA4821 | Web | Set de 3 Decants (10 ml): Citrus Enigma, Vency Rouge · Frasco 30 ml | ₡24.000 | SINPE | SINPE | **pendiente** *(ámbar)* | |
| 20/06/2026 11:30 | VA5902 | Local | Citrus Enigma · Frasco 30 ml · Extrait (40%) | ₡12.000 | Efectivo | En sitio | **Pagado** *(verde)* | María |

- Filas **Web** tienen fondo azul claro — son pedidos que llegaron por el sitio.
- Filas **Local** tienen fondo parchment — ventas que Tony registró en el local.
- `pendiente` en ámbar = aún no confirmaste el SINPE en tu app del banco.
- `Pagado` en verde = cobrado y cerrado.

Cuando confirmás el SINPE de un pedido web, tocá **Confirmar** en el admin panel. Eso:
1. Cambia `pendiente` → `Pagado` en la columna H.
2. Descuenta automáticamente el stock en la pestaña Inventario (−1 por cada decant o frasco del pedido).

---

## Datos de prueba (borrar antes de producción)

Para ver el calendario con colores reales, pegá esta función en el editor de Apps Script y ejecutala **una sola vez**. Crea ~16 días de ventas en junio 2026 con montos variados que cubren todos los colores del calendario.

**Borrar después:** seleccioná las filas desde la 2 hasta el final y eliminá.

```javascript
function loadTestData() {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

  // Guard: abort if test refs already exist to prevent double-run
  var existing = sheet.getDataRange().getValues();
  for (var i = 1; i < existing.length; i++) {
    if (String(existing[i][1]) === 'VA2001') {
      Logger.log('loadTestData: ya existe, abortando.');
      return;
    }
  }

  // [Fecha, Ref, Canal, Artículos, Total, Pago, Entrega, Estado, Cliente]
  var rows = [
    [new Date(2026,5,2,10,14), 'VA2001', 'Local', 'Citrus Enigma · Frasco 30 ml · Parfum (35%)\nVency Rouge · Decant 10 ml',                                    60000, 'Efectivo', 'En sitio', 'Pagado', 'Andrea'],
    [new Date(2026,5,4,11,30), 'VA2002', 'Web',   'Citrus Enigma · Decant 10 ml\nInfusión Carmesí · Decant 10 ml',                                              24000, 'SINPE',    'SINPE',    'Pagado', ''],
    [new Date(2026,5,5, 9,45), 'VA2003', 'Local', 'Set de 3 Decants (10 ml): Citrus Enigma, Vency Rouge, Absolu Authority\nVency Rouge · Frasco 100 ml',         84000, 'Efectivo', 'En sitio', 'Pagado', 'Luis'],
    [new Date(2026,5,6,17, 0), 'VA2004', 'Web',   'Set de 3 Decants (10 ml): Citrus Enigma, Infusión Carmesí, Absolu Authority',                                 36000, 'SINPE',    'Recoger',  'Pagado', ''],
    [new Date(2026,5,8,12,20), 'VA2005', 'Web',   'Citrus Enigma · Decant 10 ml',                                                                                12000, 'SINPE',    'SINPE',    'Pagado', ''],
    [new Date(2026,5,9,10, 5), 'VA2006', 'Local', 'Set de 3 Decants (10 ml): Vency Rouge, Infusión Carmesí, Citrus Enigma\nAbsolu Authority · Decant 10 ml',     48000, 'Efectivo', 'En sitio', 'Pagado', 'Sofía'],
    [new Date(2026,5,10,16,30),'VA2007', 'Local', 'Citrus Enigma · Frasco 30 ml · Extrait (40%)\nVency Rouge · Frasco 30 ml · Parfum (35%)',                     72000, 'Efectivo', 'En sitio', 'Pagado', 'Marco'],
    [new Date(2026,5,12,11,15),'VA2008', 'Web',   'Vency Rouge · Decant 10 ml',                                                                                  15000, 'SINPE',    'SINPE',    'Pagado', ''],
    [new Date(2026,5,13,14,50),'VA2009', 'Local', 'Set de 3 Decants (10 ml): Citrus Enigma, Vency Rouge, Infusión Carmesí\nCitrus Enigma · Frasco 30 ml',        60000, 'Efectivo', 'En sitio', 'Pagado', 'Daniela'],
    [new Date(2026,5,14, 9,30),'VA2010', 'Local', 'Citrus Enigma · Frasco 30 ml · Parfum (35%)\nVency Rouge · Frasco 30 ml · Parfum (35%)\nSet de 3 Decants (10 ml): Absolu Authority, Infusión Carmesí, Citrus Enigma', 96000, 'Efectivo', 'En sitio', 'Pagado', 'Carlos + Elena'],
    [new Date(2026,5,16,13, 0),'VA2011', 'Web',   'Set de 3 Decants (10 ml): Vency Rouge, Absolu Authority, Citrus Enigma',                                      36000, 'SINPE',    'Recoger',  'Pagado', ''],
    [new Date(2026,5,17,10,45),'VA2012', 'Web',   'Infusión Carmesí · Decant 10 ml',                                                                             12000, 'SINPE',    'SINPE',    'Pagado', ''],
    [new Date(2026,5,18,15,20),'VA2013', 'Local', 'Citrus Enigma · Frasco 30 ml · EDP (20%)\nSet de 3 Decants (10 ml): Vency Rouge, Citrus Enigma, Absolu Authority', 48000, 'Efectivo', 'En sitio', 'Pagado', 'Valeria'],
    [new Date(2026,5,20,11, 0),'VA2014', 'Local', 'Set de 3 Decants (10 ml): Citrus Enigma, Infusión Carmesí, Vency Rouge\nAbsolu Authority · Frasco 100 ml',    84000, 'Efectivo', 'En sitio', 'Pagado', 'Roberto'],
    [new Date(2026,5,21,14,30),'VA2015', 'Web',   'Vency Rouge · Decant 10 ml\nAbsolu Authority · Decant 10 ml',                                                  24000, 'SINPE',    'SINPE',    'Pagado', ''],
    [new Date(2026,5,22,12,15),'VA2016', 'Local', 'Set de 3 Decants (10 ml): Citrus Enigma, Vency Rouge, Infusión Carmesí\nCitrus Enigma · Frasco 30 ml',        60000, 'Efectivo', 'En sitio', 'Pagado', 'Patricia'],
  ];

  rows.forEach(function (r) { sheet.appendRow(r); });
  SpreadsheetApp.flush();
  Logger.log('loadTestData: ' + rows.length + ' filas agregadas.');
}
```

**Qué produce en el calendario:**

| Grado | Días |
|---|---|
| Rojo (< ₡20k) | 8, 12, 17 |
| Ámbar claro (₡20–35k) | 4, 15, 21 |
| Ámbar (₡35–50k) | 6, 9, 13, 16, 18, 22 |
| Verde (≥ ₡50k) | 2, 5, 10, 13, 14, 20 |
| Vacío | resto del mes |

Total del mes: ₡771.000 (dentro del rango ámbar del mes).

---

## Hoja "Resumen" — qué muestra

| Fila | Descripción |
|---|---|
| Ventas confirmadas del mes | `SUMPRODUCT` filtrando por Pagado + mes actual |
| Canal Web / Local | split por canal del mes |
| Efectivo / SINPE | split por método del mes |
| Total histórico | todos los meses, solo Pagado |
| Pedidos pendientes | cantidad de web sin confirmar |
| Monto pendiente | total en espera de confirmación SINPE |

Las fórmulas se actualizan solas al abrir la hoja. No requieren intervención.

---

## Cómo encaja con el resto

- **WhatsApp** = fuente de verdad para pedidos web (chat + etiquetas).
- **Google Sheet** = libro mayor durable (todas las ventas, web y local).
- **admin.html** = modo vendedor: POS + métricas filtradas por mes.
- Referencia cruzada: ref `VA####` aparece en el chat de WhatsApp y en la hoja.

---

## Verificación rápida

1. **Flujo web**: armar pedido en catalogo.html → WhatsApp → fila en Pedidos con `Canal=Web, Estado=pendiente`, fondo azul.
2. **Venta local**: admin.html → token → fragancias → Registrar → fila con `Canal=Local, Estado=Pagado`, fondo parchment.
3. **POST forjado** (sin token con Canal=Local): hoja recibe `Canal=Web, Estado=pendiente`. No se puede forjar Pagado.
4. **Summary sin token**: responde `{}`. No filtra ingresos.

---

> ponytail: el Sheet alcanza para el volumen actual. BSP + CRM cuando el volumen
> lo rompa.
