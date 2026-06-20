/**
 * Vency Atelier — Unified Cart (decant set + full bottles)
 *
 * One cart holds the decant set (0 or 3, bundle ₡12.000) plus any number of
 * full bottles (30ml / 100ml). One tray, one checkout, one WhatsApp message.
 */
(function () {
  'use strict';

  var WA_NUMBER = '50672773156'; /* WhatsApp Business de Vency Atelier (+506 7277-3156) */

  /* Registro opcional de pedidos en Google Sheets (best-effort, sin backend).
     Pegar aquí la URL del Web App de Apps Script. Vacío = desactivado.
     Ver docs/ORDER-LOG-SHEET.md para el setup. */
  var SHEET_LOG_URL = 'https://script.google.com/macros/s/AKfycbyqzvh10eup6nLlrILJEefExiwXBxvacqbbAj3l5CzQoKFsCR2XzBcniDbVMzQTetE6/exec';

  /* ---- State ---- */
  var selection       = []; /* decants:  { id, name }, max 3 */
  var bottles         = []; /* bottles:  { id, name, fmt, price } */
  var currentOrderRef = null;

  var BOTTLE_PRICE = { '30ml': 12000, '100ml': 20000 };
  var BOTTLE_LABEL = { '30ml': '30 ml', '100ml': '100 ml' };
  var SET_PRICE    = 12000;

  function generateRef() {
    return 'VA' + (Math.floor(Math.random() * 9000) + 1000);
  }

  function colones(n) {
    return '₡' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function esc(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ---- DOM ---- */
  var tray         = document.getElementById('dc-tray');
  var traySlotsWrap = tray ? tray.querySelector('.dc-tray__slots') : null;
  var traySlots    = tray ? Array.prototype.slice.call(tray.querySelectorAll('.dc-tray__slot')) : [];
  var trayBottles  = tray ? tray.querySelector('.js-tray-bottles') : null;
  var trayPrice    = tray ? tray.querySelector('.js-dc-tray-price') : null;
  var orderBtn     = tray ? tray.querySelector('.js-dc-order-btn') : null;
  var panel        = document.getElementById('dc-order-panel');
  var summaryEl    = panel ? panel.querySelector('.js-dc-order-summary') : null;
  var priceEl      = panel ? panel.querySelector('.js-dc-order-price') : null;
  var sinpeNote    = panel ? panel.querySelector('.js-dc-sinpe-note') : null;
  var waBtn        = panel ? panel.querySelector('.js-dc-wa-btn') : null;

  if (!tray || !panel) return;

  /* ---- Helpers ---- */
  function countFor(id) {
    var n = 0;
    for (var i = 0; i < selection.length; i++) {
      if (selection[i].id === id) n++;
    }
    return n;
  }

  function selectionNames() {
    return selection.map(function (s) { return s.name; }).join(', ');
  }

  function bottleIndex(id, fmt) {
    for (var i = 0; i < bottles.length; i++) {
      if (bottles[i].id === id && bottles[i].fmt === fmt) return i;
    }
    return -1;
  }

  function decantComplete() { return selection.length === 3; }
  function decantPartial()  { return selection.length === 1 || selection.length === 2; }
  function bottlesTotal()   { return bottles.reduce(function (s, b) { return s + b.price; }, 0); }
  function cartTotal()      { return (decantComplete() ? SET_PRICE : 0) + bottlesTotal(); }
  function canCheckout()    { return !decantPartial() && (decantComplete() || bottles.length > 0); }

  /* ---- Selection logic ---- */
  function handleClick(id, name) {
    var count = countFor(id);
    if (count > 0) {
      for (var i = selection.length - 1; i >= 0; i--) {
        if (selection[i].id === id) { selection.splice(i, 1); break; }
      }
    } else if (selection.length < 3) {
      selection.push({ id: id, name: name });
    } else {
      selection.pop();
      selection.push({ id: id, name: name });
    }
    updateUI();
  }

  function handleBottleClick(id, name, fmt) {
    var idx = bottleIndex(id, fmt);
    if (idx >= 0) bottles.splice(idx, 1);
    else bottles.push({ id: id, name: name, fmt: fmt, price: BOTTLE_PRICE[fmt] });
    updateUI();
  }

  /* ---- Tray slot removal (decants only) ---- */
  function removeFromSlot(slotIndex) {
    if (slotIndex < 0 || slotIndex >= selection.length) return;
    selection.splice(slotIndex, 1);
    updateUI();
  }

  /* ---- UI sync ---- */
  function updateUI() {
    updateBlocks();
    updateTray();
    if (panel.classList.contains('is-open')) syncPanel();

    var hasTray = selection.length > 0 || bottles.length > 0;
    document.body.classList.toggle('has-tray', hasTray);
    if (hasTray) {
      document.documentElement.style.setProperty('--tray-h', tray.offsetHeight + 'px');
    }
  }

  function updateBlocks() {
    document.querySelectorAll('[data-fragrance-id]').forEach(function (block) {
      if (block.dataset.soldOut === 'true') return;
      var id    = block.dataset.fragranceId;
      var name  = block.dataset.fragranceName;
      var count = countFor(id);

      block.classList.toggle('dblock--selected', count > 0);

      var trigger = block.querySelector('.dblock__trigger');
      if (trigger) {
        trigger.setAttribute('aria-pressed', count > 0 ? 'true' : 'false');
        trigger.setAttribute('aria-label', count > 0
          ? name + ' en el set. Tocar para quitar.'
          : 'Agregar ' + name + ' al Set de 3 Decants');

        var titleEl = trigger.querySelector('.fmt-rail__set-title');
        if (titleEl) titleEl.textContent = count > 0 ? 'En el set' : 'Añadir al set';

        var hintEl = trigger.querySelector('.js-set-hint');
        if (hintEl) {
          if (count > 0) { hintEl.textContent = 'Toca para quitar'; hintEl.hidden = false; }
          else hintEl.hidden = true;
        }
      }

      /* bottle buy buttons */
      block.querySelectorAll('.fmt-rail__buy-btn[data-fmt]').forEach(function (btn) {
        btn.setAttribute('aria-pressed', bottleIndex(id, btn.dataset.fmt) >= 0 ? 'true' : 'false');
      });
    });
  }

  function updateTray() {
    var dCount  = selection.length;
    var hasTray = dCount > 0 || bottles.length > 0;

    tray.classList.toggle('dc-tray--visible', hasTray);

    /* banner slots */
    document.querySelectorAll('.dc-set-banner__slot').forEach(function (slot, i) {
      slot.classList.toggle('dc-set-banner__slot--filled', i < dCount);
    });

    /* decant slots — only shown while building / holding a set */
    if (traySlotsWrap) traySlotsWrap.hidden = dCount === 0;
    traySlots.forEach(function (slot, i) {
      var item = selection[i] || null;
      slot.classList.toggle('dc-tray__slot--filled', !!item);
      slot.classList.toggle('dc-tray__slot--removable', !!item);
      if (item) {
        slot.setAttribute('role', 'button');
        slot.setAttribute('tabindex', '0');
        slot.setAttribute('aria-label', 'Quitar ' + item.name + ' del set');
        slot.dataset.slotIndex = String(i);
      } else {
        slot.removeAttribute('role');
        slot.removeAttribute('tabindex');
        slot.removeAttribute('aria-label');
        delete slot.dataset.slotIndex;
      }
      var nameEl = slot.querySelector('.dc-tray__slot-name');
      if (nameEl) nameEl.textContent = item ? item.name : '—';
    });

    /* bottles chip */
    if (trayBottles) {
      if (bottles.length) {
        var word = bottles.length === 1 ? ' frasco' : ' frascos';
        trayBottles.textContent = (dCount > 0 ? '+ ' : '') + bottles.length + word;
        trayBottles.hidden = false;
      } else {
        trayBottles.hidden = true;
      }
    }

    if (trayPrice) {
      var total    = cartTotal();
      var newPrice = total > 0 ? colones(total) : '';
      var changed  = trayPrice.textContent !== newPrice;
      trayPrice.textContent = newPrice;
      if (changed && newPrice) {
        trayPrice.classList.remove('dc-tray__price--tick');
        void trayPrice.offsetWidth; /* restart the animation */
        trayPrice.classList.add('dc-tray__price--tick');
      }
    }

    /* hint — only when set is partial */
    var trayHint = tray.querySelector('.js-tray-hint');
    if (trayHint) {
      if (decantPartial()) {
        var r = 3 - dCount;
        trayHint.textContent = 'Faltan ' + r + (r === 1 ? ' decant para el set' : ' decants para el set');
        trayHint.hidden = false;
      } else {
        trayHint.hidden = true;
      }
    }

    /* order button */
    if (orderBtn) {
      var can = canCheckout();
      orderBtn.disabled = !can;
      orderBtn.setAttribute('aria-disabled', String(!can));
      if (panel.classList.contains('is-open')) {
        orderBtn.textContent = 'Cerrar';
      } else if (decantPartial()) {
        orderBtn.textContent = 'Completa tu set (faltan ' + (3 - dCount) + ')';
      } else {
        orderBtn.textContent = 'Ordenar · ' + colones(cartTotal());
      }
    }

    if (!canCheckout() && panel.classList.contains('is-open')) closePanel();
  }

  /* ---- Order panel ---- */
  function getSelectedDelivery() {
    var checked = panel.querySelector('.js-delivery-radio:checked');
    return checked ? checked.value : 'sinpe';
  }

  function buildItems() {
    /* returns [{ name, sub, price, wa }] */
    var items = [];
    if (decantComplete()) {
      items.push({ name: 'Set de 3 Decants · 10 ml', sub: selectionNames(), price: SET_PRICE,
                   wa: 'Set de 3 Decants (10 ml): ' + selectionNames() });
    }
    bottles.forEach(function (b) {
      items.push({ name: b.name + ' · Frasco ' + BOTTLE_LABEL[b.fmt], sub: '', price: b.price,
                   wa: b.name + ' · Frasco ' + BOTTLE_LABEL[b.fmt] });
    });
    return items;
  }

  /* Best-effort order log to Google Sheets. Fires on checkout; if it fails,
     the order still goes through WhatsApp (the source of truth). */
  function logOrder() {
    if (!SHEET_LOG_URL || !navigator.sendBeacon) return;
    var payload = {
      ref:     currentOrderRef || '',
      items:   buildItems().map(function (it) { return it.wa; }).join(' | '),
      total:   cartTotal(),
      entrega: getSelectedDelivery() === 'local' ? 'Recoger' : 'SINPE'
    };
    try { navigator.sendBeacon(SHEET_LOG_URL, JSON.stringify(payload)); } catch (e) { /* noop */ }
  }

  function renderLines(items) {
    return items.map(function (it) {
      return '<div class="dc-order__line">' +
        '<span class="dc-order__line-name">' + esc(it.name) +
          (it.sub ? '<span class="dc-order__line-sub">' + esc(it.sub) + '</span>' : '') +
        '</span>' +
        '<span class="dc-order__line-price">' + colones(it.price) + '</span>' +
      '</div>';
    }).join('');
  }

  function syncPanel() {
    var isLocal = getSelectedDelivery() === 'local';
    var methods = panel.querySelector('.order-panel__methods');
    var pickup  = panel.querySelector('.js-pickup-note');

    if (methods) methods.classList.toggle('is-hidden', isLocal);
    if (pickup) {
      pickup.classList.toggle('is-visible', isLocal);
      pickup.setAttribute('aria-hidden', String(!isLocal));
    }

    var items = buildItems();
    var ref   = currentOrderRef;
    var tail  = isLocal ? 'Voy a recoger en el local.' : 'Adjunto comprobante de pago.';
    var msg   = 'Hola Vency Atelier! Quisiera ordenar:\n- '
              + items.map(function (it) { return it.wa; }).join('\n- ')
              + '\nTotal: ' + colones(cartTotal()) + '.'
              + (ref ? ' Pedido ' + ref + '.' : '') + ' ' + tail;

    if (summaryEl) summaryEl.innerHTML = renderLines(items);
    if (priceEl)   priceEl.textContent = colones(cartTotal());
    if (sinpeNote) sinpeNote.textContent = 'Incluir en el mensaje: tu pedido'
                                         + (ref ? ' · Pedido ' + ref : '');
    if (waBtn) {
      waBtn.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
      waBtn.textContent = isLocal ? 'Enviar pedido por WhatsApp' : 'Enviar comprobante por WhatsApp';
      waBtn.setAttribute('aria-label', isLocal
        ? 'Enviar pedido por WhatsApp'
        : 'Enviar comprobante de pago por WhatsApp');
    }

    /* Confirmation note: payment-on-site (local) has no comprobante to send */
    var confirmEl = panel.querySelector('.order-panel__confirm');
    if (confirmEl) {
      confirmEl.textContent = isLocal
        ? 'Envíe su pedido por WhatsApp con su nombre. El pago se realiza en el local.'
        : 'Su pedido se confirma una vez recibido el comprobante de pago. Envíelo por WhatsApp junto con su nombre.';
    }

    var refEl = panel.querySelector('.js-dc-order-ref');
    if (refEl) { refEl.textContent = ref ? 'Pedido ' + ref : ''; refEl.hidden = !ref; }
  }

  function openPanel() {
    if (!currentOrderRef) currentOrderRef = generateRef();
    syncPanel();
    panel.classList.add('is-open');
    if (orderBtn) {
      orderBtn.setAttribute('aria-expanded', 'true');
      orderBtn.textContent = 'Cerrar';
    }
    window._catScrollLock = true;
    setTimeout(function () {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(function () { window._catScrollLock = false; }, 800);
    }, 120);
  }

  function closePanel() {
    panel.classList.remove('is-open');
    currentOrderRef = null;
    window._catScrollLock = false;
    if (orderBtn) {
      orderBtn.setAttribute('aria-expanded', 'false');
      orderBtn.textContent = 'Ordenar · ' + colones(cartTotal());
    }
  }

  /* ---- Wire up decant triggers + bottle buy buttons ---- */
  document.querySelectorAll('[data-fragrance-id]').forEach(function (block) {
    if (block.dataset.soldOut === 'true') return;
    var id   = block.dataset.fragranceId;
    var name = block.dataset.fragranceName;

    var trigger = block.querySelector('.dblock__trigger');
    if (trigger) {
      trigger.addEventListener('click', function () { handleClick(id, name); });
    }

    block.querySelectorAll('.fmt-rail__buy-btn[data-fmt]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        handleBottleClick(id, name, btn.dataset.fmt);
      });
    });
  });

  /* ---- Wire up tray slot removal ---- */
  traySlots.forEach(function (slot) {
    slot.addEventListener('click', function () {
      var idx = parseInt(slot.dataset.slotIndex, 10);
      if (!isNaN(idx)) removeFromSlot(idx);
    });
    slot.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        var idx = parseInt(slot.dataset.slotIndex, 10);
        if (!isNaN(idx)) removeFromSlot(idx);
      }
    });
  });

  /* ---- Wire up order button ---- */
  if (orderBtn) {
    orderBtn.addEventListener('click', function () {
      if (orderBtn.disabled) return;
      if (panel.classList.contains('is-open')) closePanel();
      else openPanel();
    });
  }

  /* ---- Wire up delivery toggle ---- */
  panel.querySelectorAll('.js-delivery-radio').forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (panel.classList.contains('is-open')) syncPanel();
    });
  });

  /* ---- Log the order to the sheet when the customer sends it ---- */
  if (waBtn) waBtn.addEventListener('click', logOrder);

  /* ---- Keyboard: Escape closes panel ---- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) {
      closePanel();
      if (orderBtn) orderBtn.focus();
    }
  });

  /* ---- Pre-select a decant from URL param (?add=Fragrance+Name) ---- */
  (function initFromUrl() {
    try {
      var params  = new URLSearchParams(window.location.search);
      var addName = params.get('add');
      if (!addName) return;
      var block = null;
      document.querySelectorAll('[data-fragrance-id]').forEach(function (b) {
        if (b.dataset.fragranceName === addName) block = b;
      });
      if (!block) return;
      selection.push({ id: block.dataset.fragranceId, name: block.dataset.fragranceName });
      updateUI();
    } catch (e) { /* URLSearchParams unsupported — silent fallback */ }
  })();

})();
