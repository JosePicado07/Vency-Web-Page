# Vency Atelier — Google Apps Script (Web App)

Copy-paste the entire block below into the Apps Script editor. Then:
1. `setupSheet()` — run once from the editor (Ejecutar → setupSheet)
2. Settings ⚙️ → Script properties → add `SELLER_TOKEN` = your passphrase
3. Deploy → New deployment → Web app → copy the URL → update `EXEC_URL` in admin.js

```javascript
/* ════════════════════════════════════════════════════
   VENCY ATELIER — Google Apps Script Web App
   ════════════════════════════════════════════════════ */

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

  /* Confirmar pedido web pendiente → Pagado + descuenta stock (requiere token) */
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
    var xRef = String(d.ref || '');
    if (!/^VA\d{4}$/.test(xRef)) return ContentService.createTextOutput('bad_ref');
    var xSheet = ss.getSheetByName(SHEET_NAME);
    var xData  = xSheet.getDataRange().getValues();
    for (var xi = 1; xi < xData.length; xi++) {
      if (String(xData[xi][1]) === xRef) {
        if (xData[xi][7] === 'Pagado') {
          var inv = getInventory_(ss);
          var restores = parseItemsToOilUpdates_(xData[xi][3], inv).map(function (u) {
            return { key: u.key, delta_ml: -u.delta_ml };
          });
          if (restores.length) updateStock_(ss, restores);
        }
        xSheet.deleteRow(xi + 1);
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

  /* Inventario — leer stock de aceite (requiere token) */
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

  var rangeStart, rangeEnd;
  if (p === 'hoy') {
    rangeStart = hoy;
    rangeEnd   = new Date(hoy.getTime() + 86400000);
  } else if (p === 'semana') {
    rangeStart = new Date(hoy);
    rangeStart.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
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
    if (!isPendiente && fecha >= calStart && fecha < calEnd) {
      var dk = fecha.getFullYear() + '-'
             + ('0' + (fecha.getMonth() + 1)).slice(-2) + '-'
             + ('0' + fecha.getDate()).slice(-2);
      s.daily[dk] = (s.daily[dk] || 0) + total;
    }
  }
  s.sales.reverse();
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

/* ── Stock público — booleano por formato (sin token) ── */

function getPublicStock_(ss) {
  var sheet = ss.getSheetByName('Inventario');
  if (!sheet) return {};
  var rows = sheet.getDataRange().getValues();
  var out  = {};
  for (var i = 1; i < rows.length; i++) {
    var key    = String(rows[i][0]);
    var oil_ml = parseFloat(rows[i][2]) || 0;
    if (!key) continue;
    out[key + ':decant'] = oil_ml >= 10;
    out[key + ':30ml']   = oil_ml >= 30;
    out[key + ':100ml']  = oil_ml >= 100;
  }
  return out;
}

/* ── Inventario — leer stock de aceite ── */

function getInventory_(ss) {
  var sheet = ss.getSheetByName('Inventario');
  if (!sheet) return {};
  var rows = sheet.getDataRange().getValues();
  var inv  = {};
  var byKeyword = {};

  for (var i = 1; i < rows.length; i++) {
    var key  = String(rows[i][0]);
    var name = String(rows[i][1]);
    var oil  = parseFloat(rows[i][2]) || 0;
    if (!key) continue;

    inv[key] = { oil_ml: oil };
    inv[name.toLowerCase().trim()] = { oil_ml: oil };

    String(name).toLowerCase().split(/\s+/).forEach(function(word) {
      if (word.length > 2) byKeyword[word] = { oil_ml: oil };
    });
  }

  inv._byKeyword = byKeyword;
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

    var bottleM = part.match(/^(.+?) \xb7 Frasco (\d+) ml(?:\s*\xb7\s*.+?\((\d+(?:\.\d+)?)%\))?/);
    if (bottleM) {
      var key   = slugify_(bottleM[1].trim());
      var fmtMl = parseInt(bottleM[2]);
      var pct   = bottleM[3] ? parseFloat(bottleM[3]) : (inv[key] && inv[key].pct);
      if (!inv[key] || !pct) return;
      updates.push({ key: key, delta_ml: -(pct / 100) * fmtMl });
      return;
    }

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
        sheet.getRange(row, 3).setValue(Math.max(0, parseFloat(u.set_oil_ml) || 0));
      } else if (u.delta_ml !== undefined) {
        var cell = sheet.getRange(row, 3);
        cell.setValue(Math.max(0, (parseFloat(cell.getValue()) || 0) + (parseFloat(u.delta_ml) || 0)));
      }
    } else {
      var oil_ml = u.set_oil_ml !== undefined ? parseFloat(u.set_oil_ml) || 0
                 : Math.max(0, parseFloat(u.delta_ml) || 0);
      if (oil_ml > 0) {
        var name = key.replace(/-/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); });
        sheet.appendRow([key, name, oil_ml]);
      }
    }
  });
}

/* ════════════════════════════════════════════════════
   SETUP — ejecutar UNA SOLA VEZ desde el editor
   ════════════════════════════════════════════════════ */

function setupSheet() {
  var ss    = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  sheet.setName(SHEET_NAME);

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

  sheet.setColumnWidth(1, 148);
  sheet.setColumnWidth(2, 78);
  sheet.setColumnWidth(3, 68);
  sheet.setColumnWidth(4, 340);
  sheet.setColumnWidth(5, 108);
  sheet.setColumnWidth(6, 85);
  sheet.setColumnWidth(7, 85);
  sheet.setColumnWidth(8, 98);
  sheet.setColumnWidth(9, 175);

  sheet.getRange('A2:A').setNumberFormat('dd/MM/yyyy  HH:mm');
  sheet.getRange('E2:E').setNumberFormat('"₡"#,##0');
  sheet.getRange('D2:D').setWrap(true);
  sheet.getRange('I2:I').setWrap(true);
  sheet.getRange('A2:A').setHorizontalAlignment('left');
  sheet.getRange('B2:C').setHorizontalAlignment('center');
  sheet.getRange('E2:E').setHorizontalAlignment('right');
  sheet.getRange('F2:H').setHorizontalAlignment('center');

  var dr = sheet.getRange('A2:I2000');
  var rules = [];

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$C2="Web"')
    .setBackground('#EBF4FB')
    .setRanges([dr])
    .build());

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$C2="Local"')
    .setBackground('#FEF7EC')
    .setRanges([dr])
    .build());

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('pendiente')
    .setBackground('#FFF2CC')
    .setFontColor('#7D4E00')
    .setFontWeight('bold')
    .setRanges([sheet.getRange('H2:H2000')])
    .build());

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Pagado')
    .setBackground('#D9EAD3')
    .setFontColor('#2A6020')
    .setRanges([sheet.getRange('H2:H2000')])
    .build());

  sheet.setConditionalFormatRules(rules);

  setupResumenSheet_(ss);
  setupInventarioSheet_(ss);

  SpreadsheetApp.flush();
  Logger.log('Setup completado — revisá las hojas Pedidos, Resumen e Inventario.');
}

function setupResumenSheet_(ss) {
  var name = 'Resumen';
  var rs   = ss.getSheetByName(name);
  if (!rs) rs = ss.insertSheet(name, 1);
  rs.clearContents();
  rs.clearFormats();
  rs.setTabColor('#1A2F2F');

  var mesStart = '=DATE(YEAR(TODAY()),MONTH(TODAY()),1)';
  var mesEnd   = '=DATE(YEAR(TODAY()),MONTH(TODAY())+1,1)';

  var rows = [
    ['VENCY ATELIER', 'Libro mayor', ''],
    ['', '', ''],
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
    ['', '', ''],
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
    ['', '', ''],
    ['Los totales excluyen Estado=pendiente', '', ''],
  ];

  rs.getRange(1, 1, rows.length, 3).setValues(rows);

  rs.getRange(1, 1, 1, 3)
    .merge()
    .setBackground('#1A2F2F')
    .setFontColor('#F0EDE6')
    .setFontWeight('bold')
    .setFontSize(13)
    .setHorizontalAlignment('left')
    .setVerticalAlignment('middle');
  rs.setRowHeight(1, 38);

  [3, 10].forEach(function (r) {
    rs.getRange(r, 1)
      .setFontWeight('bold')
      .setFontColor('#1A2F2F')
      .setFontSize(10);
  });

  rs.getRange(3, 1, 6, 3).setBackground('#F7F5F0');
  rs.getRange(10, 1, 4, 3).setBackground('#F7F5F0');
  rs.getRange('C4:C8').setNumberFormat('"₡"#,##0');
  rs.getRange('C11:C13').setNumberFormat('"₡"#,##0');

  rs.getRange(rows.length, 1)
    .setFontColor('#888888')
    .setFontStyle('italic')
    .setFontSize(9);

  rs.setColumnWidth(1, 250);
  rs.setColumnWidth(2, 16);
  rs.setColumnWidth(3, 160);
  rs.setFrozenRows(1);
}

function setupInventarioSheet_(ss) {
  var name  = 'Inventario';
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name, 2);
  sheet.clearContents();
  sheet.clearFormats();
  sheet.setTabColor('#5B8A5B');

  var headers = ['Clave', 'Fragancia', 'Aceite (ml)'];
  var hRow = sheet.getRange(1, 1, 1, 3);
  hRow.setValues([headers])
      .setBackground('#1A2F2F')
      .setFontColor('#F0EDE6')
      .setFontWeight('bold')
      .setFontSize(10)
      .setHorizontalAlignment('center');
  sheet.setRowHeight(1, 32);
  sheet.setFrozenRows(1);

  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 200);
  sheet.setColumnWidth(3, 100);

  sheet.getRange('C2:C').setNumberFormat('0.0" ml"');
  sheet.getRange('C2:C').setHorizontalAlignment('center');

  var rule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberEqualTo(0)
    .setBackground('#F4CCCC')
    .setFontColor('#880000')
    .setRanges([sheet.getRange('C2:C2000')])
    .build();
  sheet.setConditionalFormatRules([rule]);

  sheet.getRange(1, 4)
    .setValue('Las claves las genera el POS automáticamente. No editar columna A.')
    .setFontColor('#888888')
    .setFontStyle('italic')
    .setFontSize(9);
  sheet.setColumnWidth(4, 350);
}

/* ════════════════════════════════════════════════════
   DATA MAINTENANCE — ejecutar desde el editor según se necesite
   ════════════════════════════════════════════════════ */

/* Already executed — kept for reference only */
/*
function addMissing() {
  var ss    = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('Inventario');
  if (!sheet) { Logger.log('No sheet Inventario'); return; }

  var toAdd = [
    ['cloud','Cloud',0],
    ['cloud-pink','Cloud Pink',30],
    ['divine-le-parfum','Divine Le Parfum',0],
    ['very-good-girl','Very Good Girl',20],
    ['noir-extreme','Noir Extreme',55],
    ['kakuno','Kakuno',120],
    ['le-male-le-parfum','Le Male Le Parfum',25],
    ['beginner-oud-vency','Beginner Oud Vency',130],
    ['armani-code','Armani Code',120],
    ['vency-boise','Vency Boise',130],
    ['versace-pour-homme-hybrid','Versace Pour Homme Hybrid',120],
    ['absolu-authority','Aventus Absolu',20],
    ['luminous-dream','Imagination',15],
    ['il-femme','Il Femme',120],
    ['phantom-intense','Phantom Intense',25],
    ['tyrant','Tyrant',120],
    ['apple-whisper','Layton',0],
    ['black-afgano','Black Afgano',0],
  ];

  var existing = {};
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) existing[String(data[i][0])] = true;
  }

  var added = 0;
  toAdd.forEach(function (row) {
    if (!existing[row[0]]) {
      sheet.appendRow([row[0], row[1], row[2], 0]);
      added++;
    }
  });

  Logger.log('Agregadas ' + added + ' fragancias nuevas');
}
*/

/* Already executed — kept for reference only */
/*
function syncInventory() {
  var ss    = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('Inventario');
  if (!sheet) { Logger.log('No sheet Inventario'); return; }

  var lr = sheet.getLastRow();
  if (lr > 1) sheet.deleteRows(2, lr - 1);

  var all = [
    ['amber-oud','Amber Oud',120],
    ['infusion-carmesi','Obsesion Carmesi',10],
    ['citrus-enigma','Vency Citrus Enigma',90],
    ['vency-rouge','Vency Rouge',120],
    ['prime-authority','Aventus',120],
    ['absolu-authority','Aventus Absolu',20],
    ['inner-wild','Centaurus',100],
    ['fresh-signature','Bleu de Chanel',30],
    ['citrus-melody','Symphony',150],
    ['fresh-coast','Pacific Chill',120],
    ['luminous-dream','Imagination',15],
    ['dream-trap','Attrape Reves',60],
    ['nomad-ritual','Ombre Nomade',120],
    ['endless-horizon','L\'Immensité',120],
    ['jagger-index','Smoking Hot',40],
    ['phantom-ratio','Black Phantom',120],
    ['green-profile','Green Irish Tweed',120],
    ['cherry-desire','Carmina',35],
    ['queen-essence','Queen Of Silk',120],
    ['fireside-memory','Replica: By the Fireplace',120],
    ['night-light','Replica: Jazz Club',45],
    ['sacred-oud','Oud for Greatness',75],
    ['after-effect','Side Effect',0],
    ['neutral-state','Rehab',65],
    ['santal-embrace','Santal Pao Rosa',120],
    ['golden-citrine','God of Fire',120],
    ['exotic-contrast','Oud Maracuja',130],
    ['rouge-elixir','Baccarat Rouge 540',60],
    ['santal-code','Santal 33',110],
    ['last-light','Grand Soir',35],
    ['midnight-coffee','Amore Cafe',80],
    ['crush-effect','Instant Crush',35],
    ['golden-heritage','Naxos',120],
    ['shadow-leather','Ombre Leather',120],
    ['aurum-mirage','Lamar',80],
    ['vanille-skin','Vanilla Powder',135],
    ['silver-veil','Pegasus',120],
    ['apple-whisper','Layton',0],
    ['rose-desire','Delina',30],
    ['smoky-mandarin','Tobacco Mandarin Byredo',120],
    ['citrus-nirvana','Elysium',120],
    ['dark-sinner','Fetish',60],
    ['private-reserve','X For Men',120],
    ['grape-fantasy','Grape Fantasy',50],
    ['marshmellow','Marshmellow',120],
    ['boise-sandalwood','Boise Sandalwood',120],
    ['matiere-premiere-falcon-leather','Falcón Leather',120],
    ['rabanne-fame-couture','Fame Couture',130],
    ['monegal-flamenco','Flamenco',180],
    ['rasasi-hawas-fire','Hawas Fire',120],
    ['dolce-gabbana-imperatrice','Imperatrice',130],
    ['rabanne-invictus-aqua','Invictus Aqua',80],
    ['rabanne-le-male-elixir-absolu','Le Male Elixir Absolu',130],
    ['victorias-secret-mango-temptation','Mango Temptation',120],
    ['miami-blossom','Miami Blossom',120],
    ['lorenzo-pazzaglia-sangria','Sangria',120],
    ['shakira-shakira-rock','Shakira Rock',130],
    ['giorgio-armani-si','Sì',120],
    ['lorenzo-pazzaglia-summer-hammer','Summer Hammer',150],
    ['bond-no-9-tribeca','Tribeca',120],
    ['rabanne-1-million-elixir','1 Million Elixir',130],
    ['paco-rabanne-1-million-golden-oud','1 Million Golden Oud',120],
    ['rabanne-1-million-golden-oud-elixir','1 Million Golden Oud Elixir',120],
    ['rabanne-1-million-lucky','1 Million Lucky',120],
    ['bff','BFF',0],
    ['silver','Silver',140],
    ['allure','Allure',120],
    ['212-vip','212 VIP',45],
    ['212-black','212 Black',15],
    ['bad-boy','Bad Boy',60],
    ['gucci-ll','Gucci ll',80],
    ['invictus-victory-elixir','Invictus Victory Elixir',25],
    ['sauvage-elixir','Sauvage Elixir',10],
    ['boss-scent-elixir','Boss Scent Elixir',120],
    ['starwalker','Starwalker',60],
    ['le-beau-paradise','Le Beau Paradise',22],
    ['le-beau-parfum','Le Beau Parfum',90],
    ['ultramale','Ultramale',70],
    ['scandal-pour-homme','Scandal Pour Homme',60],
    ['born-in-rome-edt-hombre','Born in Rome EDT Hombre',120],
    ['eros','Eros',60],
    ['dylan-blue-hombre','Dylan Blue Hombre',130],
    ['no-limit','No Limit',35],
    ['vency-marshmallow','Vency Marshmallow',30],
    ['miss-dior-edt','Miss Dior EDT',60],
    ['vency-kiwi','Vency Kiwi',90],
    ['dior-homme-sport','Dior Homme Sport',15],
    ['women-burberry','Women Burberry',130],
    ['fame-blooming-pink','Fame Blooming Pink',150],
    ['her-elixir','Her Elixir',15],
    ['la-bomba','La Bomba',80],
    ['divine','Divine',30],
    ['lady-million-royal','Lady Million Royal',120],
    ['libre','Libre',120],
    ['black-opium','Black Opium',120],
    ['mademoiselle','Mademoiselle',60],
    ['chance-eau-fraiche','Chance Eau Fraiche',120],
    ['no-5-cologne','No. 5 Cologne',50],
    ['dylan-blue-mujer','Dylan Blue Mujer',130],
    ['la-vie-est-belle-elixir','La Vie Est Belle Elixir',80],
    ['la-vie-est-belle','La Vie Est Belle',80],
    ['devotion','Devotion',120],
    ['banofi','Banofi',120],
    ['lacoste-blanc','Lacoste Blanc',45],
    ['nina-ricci','Nina Ricci',130],
    ['altair','Althaïr',80],
    ['mayar-cherry','Mayar Cherry',120],
    ['bharara-king','Bharara King',120],
    ['herod','Herod',60],
    ['sparkling-lychee','Sparkling Lychee',0],
    ['delina-exclusif','Delina Exclusif',130],
    ['nomade','Nomade',60],
    ['sauvage-edt','Sauvage EDT',0],
    ['her-edp','Her EDP',120],
    ['dylan-purple','Dylan Purple',15],
    ['si-armani','Si Armani',120],
    ['megamare','Megamare',80],
    ['dahab','Dahab',35],
    ['sugar-daddy','Sugar Daddy',130],
    ['ralph-laurent-mujer','Ralph Laurent Mujer',120],
    ['parisian-musc','Parisian Musc',25],
    ['blue-talisman','Blue Talisman',40],
    ['the-scent-of-peace','The Scent of Peace',40],
    ['eden-juicy-apple','Eden Juicy Apple',25],
    ['red-tobacco','Red Tobacco',120],
    ['baccarat','Baccarat',60],
    ['bleecker-st','Bleecker St',120],
    ['falcon-leather','Falcon Leather',120],
    ['lafayette-st','Lafayette St',35],
    ['erba-pura','Erba Pura',120],
    ['mangrove','Mangrove',35],
    ['nolita','Nolita',40],
    ['oud-satin-mood','Oud Satin Mood',130],
    ['carmina','Carmina',35],
    ['noir-tf','Noir TF',40],
    ['goddess-intense','Goddess Intense',130],
    ['scandal-mujer','Scandal Mujer',120],
    ['turath','Turath',80],
    ['gentleman','Gentleman',120],
    ['lord-george','Lord George',90],
    ['soleil-de-feu','Soleil de Feu',120],
    ['bergamotto-calabria-aqua-si-parma','Bergamotto Calabria Aqua si Parma',120],
    ['no-1-imperial-clive','No.1 Imperial Clive',180],
    ['hundred-silent-ways','Hundred Silent Ways',120],
    ['green-irish','Green Irish',20],
    ['unlimited-boss','Unlimited Boss',90],
    ['angels-share-paradis','Angels\' Share Paradis',80],
    ['blamage','Blamage',120],
    ['shem','Shem',80],
    ['oud-noir-versace','Oud Noir Versace',80],
    ['issey-miyake-mujer','Issey Miyake Mujer',120],
    ['corazon-del-desierto','Corazon del Desierto',110],
    ['outcast-exnihilo','Outcast Exnihilo',130],
    ['blue-sapphire-boadicea','Blue Sapphire Boadicea',90],
    ['boss-bottled-night','Boss Bottled Night',60],
    ['almaz-kajal','Almaz Kajal',35],
    ['gris-dior','Gris Dior',80],
    ['bianco-latte','Bianco Latte',25],
    ['invictus-platinum','Invictus Platinum',20],
    ['fahrenheit','Fahrenheit',120],
    ['sunshine-amouge','Sunshine Amouge',120],
    ['queen-of-silk-creed','Queen of Silk Creed',65],
    ['omnia-coral','Omnia Coral',10],
    ['bvlgari-man-in-black','Bvlgari Man in Black',120],
    ['ange-ou-demon','Ange ou Demon',25],
    ['good-girl','Good Girl',0],
    ['the-one-mujer','The One Mujer',60],
    ['cedrat-boise','Cedrat Boise',0],
    ['vert-malachite','Vert Malachite',55],
    ['vency-fresh-tobacco','Vency Fresh Tobacco',90],
    ['alexandria-ii','Alexandria II',20],
    ['solo-loewe','Solo Loewe',20],
    ['hacivat','Hacivat',80],
    ['sungria','Sungria',90],
    ['miss-dior-parfum','Miss Dior Parfum',65],
    ['terroni','Terroni',230],
    ['jazz-club','Jazz Club',45],
    ['cloud','Cloud',0],
    ['cloud-pink','Cloud Pink',30],
    ['divine-le-parfum','Divine Le Parfum',0],
    ['very-good-girl','Very Good Girl',20],
    ['noir-extreme','Noir Extreme',55],
    ['kakuno','Kakuno',120],
    ['le-male-le-parfum','Le Male Le Parfum',25],
    ['beginner-oud-vency','Beginner Oud Vency',130],
    ['armani-code','Armani Code',120],
    ['vency-boise','Vency Boise',130],
    ['versace-pour-homme-hybrid','Versace Pour Homme Hybrid',120],
    ['il-femme','Il Femme',120],
    ['phantom-intense','Phantom Intense',25],
    ['tyrant','Tyrant',120],
    ['black-afgano','Black Afgano',0],
  ];

  all.forEach(function (row) { sheet.appendRow(row); });
  Logger.log('Inventario sincronizado — ' + all.length + ' fragancias');
}
*/
1. Save (Ctrl+S)
2. Run `setupSheet()` once from the editor (Ejecutar → setupSheet)
3. Settings ⚙️ → Script properties → add `SELLER_TOKEN` = your passphrase
4. Deploy → New deployment → Web app → copy URL
5. Update the URL in `admin.js`, `decants.js`, `carrito.js` if it changed
