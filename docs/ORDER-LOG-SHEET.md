RESTO DEL ARCHIVO...

## Corrección de nombres en Inventario

```javascript
function fixInventoryNames_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('Inventario');
  if (!sheet) { Logger.log('No sheet'); return; }
  
  var nameMapping = {
    'Cocktail Maracuja': 'Oud Maracujá',
    'Oud Satin Mood MFK': 'Oud Satin Mood',
    'Amore Cafè': 'Amore Café',
    'Sungría': 'Sungría'
  };
  
  var data = sheet.getDataRange().getValues();
  var updated = 0;
  
  for (var i = 1; i < data.length; i++) {
    var oldName = String(data[i][1]);
    var newName = nameMapping[oldName];
    
    if (newName) {
      sheet.getRange(i + 1, 2).setValue(newName);
      updated++;
      Logger.log('Cambió: ' + oldName + ' → ' + newName);
    }
  }
  
  Logger.log('Total actualizadas: ' + updated);
}
```

**Uso**: Copia esta función a Apps Script, ejecutá `fixInventoryNames_()`, y luego vuelve a ejecutar `syncAllInventory()`.

---

## Security: doPost endurecido con validación de token

```javascript
function doPost(e) {
  var d = {};
  try { d = JSON.parse(e.postData.contents); } catch (err) {
    return ContentService.createTextOutput('error');
  }

  var props = PropertiesService.getScriptProperties();
  var realToken = props.getProperty('SELLER_TOKEN') || '';
  var sentToken = String(d.token || '');
  var tokenOk = realToken.length > 0 && sentToken.length === realToken.length && sentToken === realToken;

  if (d.action === 'summary') {
    if (!tokenOk) return ContentService.createTextOutput('{}').setMimeType(ContentService.MimeType.JSON);
    return ContentService.createTextOutput(JSON.stringify(buildSummary_())).setMimeType(ContentService.MimeType.JSON);
  }

  if (!tokenOk && isRateLimited_()) {
    return ContentService.createTextOutput('slow');
  }

  var ref = String(d.ref || '');
  var items = String(d.items || '');
  var total = Number(d.total);
  if (!/^VA\d{4}$/.test(ref)) return ContentService.createTextOutput('bad_ref');
  if (items.length === 0 || items.length > 500) return ContentService.createTextOutput('bad_items');
  if (isNaN(total) || total <= 0 || total > 500000) return ContentService.createTextOutput('bad_total');

  if (!tokenOk) {
    var cache = CacheService.getScriptCache();
    if (cache.get('ref_' + ref)) return ContentService.createTextOutput('dup');
    cache.put('ref_' + ref, '1', 600);
  }

  var canal = tokenOk ? 'Local' : 'Web';
  var estado = tokenOk ? 'Pagado' : 'pendiente';
  var pago = tokenOk ? String(d.pago || 'Efectivo') : String(d.pago || 'SINPE');
  var entrega = tokenOk ? 'En sitio' : (d.entrega === 'Recoger' ? 'Recoger' : 'SINPE');
  var cliente = tokenOk ? String(d.cliente || '') : '';

  SpreadsheetApp.openById(SHEET_ID).getSheets()[0].appendRow([new Date(), ref, canal, items, total, pago, entrega, estado, cliente]);

  return ContentService.createTextOutput('ok');
}

function isRateLimited_() {
  var cache = CacheService.getScriptCache();
  var key = 'rate_' + Math.floor(Date.now() / 60000);
  var count = parseInt(cache.get(key) || '0', 10);
  if (count >= 30) return true;
  cache.put(key, String(count + 1), 70);
  return false;
}

function buildSummary_() {
  var rows = SpreadsheetApp.openById(SHEET_ID).getSheets()[0].getDataRange().getValues();
  var hoy = new Date(); hoy.setHours(0,0,0,0);
  var mes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  var s = { today: 0, month: 0, web: 0, local: 0, efectivo: 0, sinpe: 0, fragrances: {} };

  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (r[7] === 'pendiente') continue;
    var fecha = new Date(r[0]);
    var total = Number(r[4]) || 0;
    if (fecha >= hoy) s.today += total;
    if (fecha >= mes) s.month += total;
    if (r[2] === 'Web') s.web += total;
    if (r[2] === 'Local') s.local += total;
    if (r[5] === 'Efectivo') s.efectivo += total;
    if (r[5] === 'SINPE') s.sinpe += total;
    String(r[3]).split('|').forEach(function(it) {
      var name = it.trim().replace(/^Set de 3 Decants \(10 ml\):/, '').split('·')[0].trim();
      if (name) s.fragrances[name] = (s.fragrances[name] || 0) + 1;
    });
  }
  return s;
}
```

**Setup**:
1. Apps Script → Configuración ⚙️ → Propiedades de secuencia de comandos
2. Agregar: `SELLER_TOKEN` = frase larga que Tony elija
3. Re-desplegar → nuevo EXEC_URL
4. Actualizar admin.js línea 4 con nuevo EXEC_URL

