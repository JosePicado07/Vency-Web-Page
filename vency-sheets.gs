/**
 * Vency Atelier — Google Apps Script backend
 *
 * SETUP:
 *  1. Open your Google Sheet → Extensions → Apps Script → paste this file.
 *  2. Run setupSheets() once to create the two sheets with headers.
 *  3. Go to Project Settings → Script Properties → add:
 *       TOKEN  =  <the same password the seller uses in admin.html>
 *  4. Deploy → New deployment → Web app
 *       Execute as: Me
 *       Who has access: Anyone
 *  5. Copy the /exec URL and paste it into admin.js as EXEC_URL.
 *  6. Re-deploy (Manage deployments → Edit) whenever you update this script.
 *
 * SHEET LAYOUT
 * ─────────────────────────────────────────────────────────────
 *  Ventas     A:ref  B:fecha  C:hora  D:items  E:total
 *             F:pago  G:entrega  H:canal  I:cliente  J:estado
 *
 *  Inventario A:key  B:nombre  C:oil_ml  D:pct
 * ─────────────────────────────────────────────────────────────
 */

var TZ            = 'America/Costa_Rica';
var SHEET_VENTAS  = 'Ventas';
var SHEET_INV     = 'Inventario';

/* ── Request router ──────────────────────────────────────── */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Token gate
    var token = PropertiesService.getScriptProperties().getProperty('TOKEN');
    if (!token || data.token !== token) {
      return text('unauthorized');
    }

    var action = data.action;

    // No action = register a new sale
    if (!action) return registerSale(data);

    switch (action) {
      case 'summary':   return summary(data);
      case 'inventory': return inventory();
      case 'stock':     return updateStock(data);
      case 'confirm':        return confirmSale(data);
      case 'cancel':         return cancelSale(data);
      case 'addCatalogEntry': return addCatalogEntry(data);
      default:               return text('unknown action: ' + action);
    }
  } catch (err) {
    return text('error: ' + err.message);
  }
}

// CORS pre-flight / health check
function doGet() {
  return text('ok');
}

/* ── Helpers ─────────────────────────────────────────────── */

function text(s) {
  return ContentService.createTextOutput(String(s));
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function today() {
  return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
}

function nowDate() {
  return new Date();
}

function pad2(n) {
  return n < 10 ? '0' + n : '' + n;
}

/* ── Register sale ───────────────────────────────────────── */

function registerSale(data) {
  var s   = sheet(SHEET_VENTAS);
  var now = nowDate();
  var fecha = Utilities.formatDate(now, TZ, 'yyyy-MM-dd');
  var hora  = Utilities.formatDate(now, TZ, 'HH:mm');

  // Web orders start as "pendiente" until confirmed manually
  var estado = (data.canal === 'Web') ? 'pendiente' : 'confirmado';

  s.appendRow([
    String(data.ref      || ''),
    fecha,
    hora,
    String(data.items    || ''),
    Number(data.total    || 0),
    String(data.pago     || ''),
    String(data.entrega  || 'En sitio'),
    String(data.canal    || 'Local'),
    String(data.cliente  || ''),
    estado
  ]);

  return text('ok');
}

/* ── Summary (metrics + sales list + calendar daily) ─────── */

function summary(data) {
  var s     = sheet(SHEET_VENTAS);
  var rows  = s.getDataRange().getValues();
  var period = data.period || 'hoy';
  var now   = nowDate();

  // Resolve period date range
  var todayStr = today();
  var rangeStart, rangeEnd;

  if (period === 'hoy') {
    rangeStart = rangeEnd = todayStr;

  } else if (period === 'semana') {
    var dow   = now.getDay(); // 0 = Sunday
    var start = new Date(now);
    start.setDate(now.getDate() - dow);
    rangeStart = Utilities.formatDate(start, TZ, 'yyyy-MM-dd');
    rangeEnd   = todayStr;

  } else { // mes
    var mp  = data.month || Utilities.formatDate(now, TZ, 'yyyy-MM');
    var parts = mp.split('-');
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    rangeStart = y + '-' + pad2(m) + '-01';
    var lastDay = new Date(y, m, 0).getDate();
    rangeEnd   = y + '-' + pad2(m) + '-' + pad2(lastDay);
  }

  // Calendar month for daily heat-map (always the requested month)
  var calMonth = data.month || Utilities.formatDate(now, TZ, 'yyyy-MM');
  var cp     = calMonth.split('-');
  var cy = parseInt(cp[0], 10);
  var cm = parseInt(cp[1], 10);
  var calStart = cy + '-' + pad2(cm) + '-01';
  var calLast  = new Date(cy, cm, 0).getDate();
  var calEnd   = cy + '-' + pad2(cm) + '-' + pad2(calLast);

  // Totals
  var total = 0, web = 0, local = 0, efectivo = 0, sinpe = 0, webPendiente = 0;
  var fragrances = {};
  var sales      = [];
  var daily      = {};

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var ref     = String(row[0] || '').trim();
    if (!ref) continue;

    var fecha   = '';
    try {
      fecha = row[1] instanceof Date
        ? Utilities.formatDate(row[1], TZ, 'yyyy-MM-dd')
        : String(row[1]).substring(0, 10);
    } catch (_) { continue; }

    var hora    = String(row[2] || '');
    var items   = String(row[3] || '');
    var amt     = Number(row[4] || 0);
    var pago    = String(row[5] || '');
    var entrega = String(row[6] || '');
    var canal   = String(row[7] || '');
    var cliente = String(row[8] || '');
    var estado  = String(row[9] || 'confirmado');

    if (estado === 'cancelado') continue;

    // Calendar daily totals (always for the display month)
    if (fecha >= calStart && fecha <= calEnd) {
      daily[fecha] = (daily[fecha] || 0) + amt;
    }

    // Period filter
    if (fecha < rangeStart || fecha > rangeEnd) continue;

    // Aggregates
    total += amt;
    if (canal === 'Web') {
      web += amt;
      if (estado === 'pendiente') webPendiente += amt;
    } else {
      local += amt;
    }
    if (pago === 'Efectivo') efectivo += amt;
    else if (pago === 'SINPE') sinpe += amt;

    // Fragrance counts for Top display
    items.split(' | ').forEach(function (part) {
      // "Citrus Enigma · Decant 10 ml · EDT (10%)" → "Citrus Enigma"
      var name = part.split('·')[0].trim();
      // Strip "Set de 3 Decants (10 ml): " prefix if present
      name = name.replace(/^Set de 3 Decants[^:]*:\s*/i, '').split(',')[0].trim();
      if (name) fragrances[name] = (fragrances[name] || 0) + 1;
    });

    // Items preview (first line only; raw has everything)
    var itemParts   = items.split(' | ');
    var itemPreview = itemParts[0] || '';

    sales.push({
      ref:    ref,
      fecha:  fecha,
      hora:   hora,
      items:  itemPreview,
      raw:    items,
      total:  amt,
      pago:   pago,
      canal:  canal,
      estado: estado
    });
  }

  // Most-recent first
  sales.sort(function (a, b) {
    var da = a.fecha + a.hora;
    var db = b.fecha + b.hora;
    return da < db ? 1 : da > db ? -1 : 0;
  });

  return json({
    month:        total,   // "month" is the period total regardless of period name
    web:          web,
    local:        local,
    efectivo:     efectivo,
    sinpe:        sinpe,
    webPendiente: webPendiente,
    fragrances:   fragrances,
    sales:        sales,
    daily:        daily
  });
}

/* ── Inventory ───────────────────────────────────────────── */

function inventory() {
  var s    = sheet(SHEET_INV);
  var rows = s.getDataRange().getValues();
  var inv  = {};

  for (var i = 1; i < rows.length; i++) {
    var key = String(rows[i][0] || '').trim();
    if (!key) continue;
    inv[key] = {
      oil_ml: Number(rows[i][2] || 0),
      pct:    Number(rows[i][3] || 0)
    };
  }

  return json(inv);
}

/* ── Update stock ────────────────────────────────────────── */

function updateStock(data) {
  var s    = sheet(SHEET_INV);
  var rows = s.getDataRange().getValues();

  // Build key → row-index map (1-based for getRange)
  var keyRow = {};
  for (var i = 1; i < rows.length; i++) {
    var k = String(rows[i][0] || '').trim();
    if (k) keyRow[k] = i + 1;
  }

  var updates = data.updates || [];
  updates.forEach(function (u) {
    var rowIdx = keyRow[String(u.key || '')];
    if (!rowIdx) return;
    var cell    = s.getRange(rowIdx, 3); // C = oil_ml
    var current = Number(cell.getValue() || 0);

    if (u.set_oil_ml !== undefined) {
      cell.setValue(Math.max(0, Number(u.set_oil_ml)));
    } else if (u.delta_ml !== undefined) {
      cell.setValue(Math.max(0, current + Number(u.delta_ml)));
    }
  });

  return text('ok');
}

/* ── Confirm sale ────────────────────────────────────────── */

function confirmSale(data) {
  return setSaleStatus(data.ref, 'confirmado');
}

/* ── Cancel / delete sale ────────────────────────────────── */

function cancelSale(data) {
  return setSaleStatus(data.ref, 'cancelado');
}

function setSaleStatus(ref, status) {
  var s    = sheet(SHEET_VENTAS);
  var rows = s.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(ref).trim()) {
      s.getRange(i + 1, 10).setValue(status); // J = estado
      return text('ok');
    }
  }

  return text('not found');
}

/* ── Add catalog entry (seed inventory rows) ─────────────── */

/**
 * Called by admin when approving a customer catalog request.
 * data: { brand, name, cat, gender, notes }
 * Adds three inventory rows: decant, 30ml, 100ml.
 */
function addCatalogEntry(data) {
  var s      = sheet(SHEET_INV);
  var brand  = String(data.brand || '').trim();
  var name   = String(data.name  || '').trim();

  if (!brand || !name) return text('missing brand or name');

  var prefix = brand + '|' + name;
  var nombre = brand + ' — ' + name;

  var rows = s.getDataRange().getValues();
  // Skip if first format already exists
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === prefix + ':decant') {
      return text('exists');
    }
  }

  s.appendRow([prefix + ':decant', nombre + ' · Decant',  0, 20]);
  s.appendRow([prefix + ':30ml',   nombre + ' · 30ml',    0, 20]);
  s.appendRow([prefix + ':100ml',  nombre + ' · 100ml',   0, 20]);

  return text('ok');
}

/* ── One-time sheet setup ────────────────────────────────── */

/**
 * Run this once from the Apps Script editor (Run → setupSheets).
 * Creates the two sheets with header rows if they don't exist.
 */
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Ventas
  var ventas = ss.getSheetByName(SHEET_VENTAS);
  if (!ventas) {
    ventas = ss.insertSheet(SHEET_VENTAS);
  }
  if (ventas.getLastRow() === 0) {
    ventas.appendRow(['ref', 'fecha', 'hora', 'items', 'total', 'pago', 'entrega', 'canal', 'cliente', 'estado']);
    ventas.getRange(1, 1, 1, 10).setFontWeight('bold');
    ventas.setFrozenRows(1);
    ventas.setColumnWidth(4, 400); // items column wider
  }

  // Inventario
  var inv = ss.getSheetByName(SHEET_INV);
  if (!inv) {
    inv = ss.insertSheet(SHEET_INV);
  }
  if (inv.getLastRow() === 0) {
    inv.appendRow(['key', 'nombre', 'oil_ml', 'pct']);
    inv.getRange(1, 1, 1, 4).setFontWeight('bold');
    inv.setFrozenRows(1);
    inv.setColumnWidth(1, 260);
    inv.setColumnWidth(2, 220);
  }

  SpreadsheetApp.getUi().alert('Sheets created: ' + SHEET_VENTAS + ', ' + SHEET_INV);
}
