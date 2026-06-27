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
  var SHEET_LOG_URL = 'https://script.google.com/macros/s/AKfycbzuJHp43JAzsQfAEpe6vWUzDqsOlA28vPSliOi4RsjgRr8d-m06t4MtzNKrdO2njZJW/exec';

  /* ---- State (persisted to localStorage so navigation keeps the cart) ---- */
  var CART_KEY = 'vency_cart_v1';
  var selection       = []; /* decants:  { id, name }, max 3 */
  var bottles         = []; /* bottles:  { id, name, fmt, price, qty } */
  var currentOrderRef = null;

  (function loadCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (Array.isArray(data.selection)) selection = data.selection;
      if (Array.isArray(data.bottles))   bottles   = data.bottles;
      if (typeof data.ref === 'string')  currentOrderRef = data.ref;
    } catch (e) { /* corrupt — ignore */ }
  })();

  function persistCart() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify({
        selection: selection,
        bottles:   bottles,
        ref:       currentOrderRef
      }));
    } catch (e) { /* quota or disabled — silent */ }
  }

  function clearCart() {
    selection.length = 0;
    bottles.length   = 0;
    currentOrderRef  = null;
    persistCart();
  }

  var BOTTLE_PRICE  = { '30ml': 12000, '100ml': 20000 };
  var BOTTLE_LABEL  = { '30ml': '30 ml', '100ml': '100 ml' };
  var SET_PRICE     = 12000;
  var DECANT_PRICE  = 5000;

  function generateRef() {
    return 'VA' + (Math.floor(Math.random() * 9000) + 1000);
  }

  function colones(n) { return '₡' + Number(n).toLocaleString('es-CR'); }

  var esc = window.escHtml;

  function showToast(msg) {
    var t = document.createElement('div');
    t.className = 'vency-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('vency-toast--in'); });
    setTimeout(function () {
      t.classList.remove('vency-toast--in');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
    }, 2500);
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
    var counts = {}, order = [];
    selection.forEach(function (s) {
      if (!counts[s.id]) { counts[s.id] = 0; order.push(s); }
      counts[s.id]++;
    });
    return order.map(function (s) {
      return s.name + (counts[s.id] > 1 ? ' ×' + counts[s.id] : '');
    }).join(', ');
  }

  function bottleIndex(id, fmt) {
    for (var i = 0; i < bottles.length; i++) {
      if (bottles[i].id === id && bottles[i].fmt === fmt) return i;
    }
    return -1;
  }

  function decantComplete() { return selection.length === 3; }
  function decantPartial()  { return selection.length === 1 || selection.length === 2; }
  function bottlesTotal()   { return bottles.reduce(function (s, b) { return s + b.price * (b.qty || 1); }, 0); }
  function decantCost()     { return decantComplete() ? SET_PRICE : selection.length * DECANT_PRICE; }
  function cartTotal()      { return decantCost() + bottlesTotal(); }
  function canCheckout()    { return selection.length > 0 || bottles.length > 0; }

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
      var replaced = selection[selection.length - 1];
      selection.pop();
      selection.push({ id: id, name: name });
      showToast('Se reemplazó ' + replaced.name);
    }
    updateUI();
  }

  function setDecantQty(id, name, qty) {
    for (var i = selection.length - 1; i >= 0; i--) {
      if (selection[i].id === id) selection.splice(i, 1);
    }
    var available = 3 - selection.length;
    var toAdd = Math.min(qty, available);
    for (var j = 0; j < toAdd; j++) selection.push({ id: id, name: name });
    updateUI();
  }

  function handleBottleClick(id, name, fmt) {
    var idx = bottleIndex(id, fmt);
    if (idx >= 0) bottles.splice(idx, 1);
    else bottles.push({ id: id, name: name, fmt: fmt, price: BOTTLE_PRICE[fmt], qty: 1 });
    updateUI();
  }

  function setBottleQty(id, name, fmt, qty) {
    var idx = bottleIndex(id, fmt);
    if (qty <= 0) {
      if (idx >= 0) bottles.splice(idx, 1);
    } else if (idx >= 0) {
      bottles[idx].qty = qty;
    } else {
      bottles.push({ id: id, name: name, fmt: fmt, price: BOTTLE_PRICE[fmt], qty: qty });
    }
    updateUI();
  }

  function getBottleQty(id, fmt) {
    var idx = bottleIndex(id, fmt);
    return idx >= 0 ? (bottles[idx].qty || 1) : 0;
  }

  /* ---- Tray slot removal (decants only) ---- */
  function removeFromSlot(slotIndex) {
    if (slotIndex < 0 || slotIndex >= selection.length) return;
    selection.splice(slotIndex, 1);
    updateUI();
  }

  /* ---- UI sync ---- */
  function updateUI() {
    persistCart();
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

    /* set-complete signature moment */
    var banner = document.querySelector('.dc-set-banner');
    if (banner) {
      if (dCount === 3 && !banner.classList.contains('dc-set-banner--complete')) {
        banner.classList.add('dc-set-banner--complete');
        setTimeout(function () { banner.classList.remove('dc-set-banner--complete'); }, 900);
      }
    }

    /* decant slots — only shown while building / holding a set */
    if (traySlotsWrap) traySlotsWrap.hidden = dCount === 0;
    traySlots.forEach(function (slot, i) {
      var item = selection[i] || null;
      slot.classList.toggle('dc-tray__slot--filled', !!item);
      var nameEl = slot.querySelector('.dc-tray__slot-name');
      if (nameEl) nameEl.textContent = item ? item.name : '—';
      var removeBtn = slot.querySelector('.js-remove-decant');
      if (removeBtn) {
        removeBtn.hidden = !item;
        if (item) removeBtn.dataset.slotIndex = String(i);
      }
    });

    /* bottles chip */
    if (trayBottles) {
      if (bottles.length) {
        var prefix = dCount > 0 ? '+ ' : '';
        trayBottles.innerHTML = prefix + bottles.map(function (b, i) {
          var qty = b.qty || 1;
          return '<span class="dc-tray__bottle-chip">'
            + esc(b.name) + ' ' + BOTTLE_LABEL[b.fmt] + (qty > 1 ? ' ×' + qty : '')
            + ' <button class="dc-tray__bottle-remove js-remove-bottle" data-bottle-index="' + i + '" aria-label="Quitar ' + esc(b.name) + '">×</button>'
            + '</span>';
        }).join(' · ');
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

    /* hint — bundle nudge when partial */
    var trayHint = tray.querySelector('.js-tray-hint');
    if (trayHint) {
      if (decantPartial()) {
        var r = 3 - dCount;
        trayHint.textContent = 'Añadí ' + r + (r === 1 ? ' más' : ' más') + ' y armá el set por ' + colones(SET_PRICE);
        trayHint.hidden = false;
      } else {
        trayHint.hidden = true;
      }
    }

    /* order button — always points at the cart page now */
    if (orderBtn) {
      var can = canCheckout();
      orderBtn.disabled = !can;
      orderBtn.setAttribute('aria-disabled', String(!can));
      orderBtn.textContent = can ? 'Ver carrito · ' + colones(cartTotal()) : 'Carrito vacío';
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
    } else if (decantPartial()) {
      selection.forEach(function (s) {
        items.push({ name: s.name + ' · Decant 10 ml', sub: '', price: DECANT_PRICE,
                     wa: s.name + ' · Decant 10 ml' });
      });
    }
    bottles.forEach(function (b) {
      var qty   = b.qty || 1;
      var qtySfx = qty > 1 ? ' ×' + qty : '';
      items.push({ name: b.name + ' · Frasco ' + BOTTLE_LABEL[b.fmt] + qtySfx, sub: '', price: b.price * qty,
                   wa: b.name + ' · Frasco ' + BOTTLE_LABEL[b.fmt] + qtySfx });
    });
    return items;
  }

  /* Best-effort order log to Google Sheets. Fires on checkout; if it fails,
     the order still goes through WhatsApp (the source of truth). */
  function logOrder() {
    if (!SHEET_LOG_URL) return;
    if (!currentOrderRef) currentOrderRef = generateRef();
    var delivery = getSelectedDelivery();
    var payload = {
      ref:     currentOrderRef,
      items:   buildItems().map(function (it) { return it.wa; }).join(' | '),
      total:   cartTotal(),
      pago:    delivery === 'local' ? 'En sitio' : 'SINPE',
      entrega: delivery === 'local' ? 'Recoger'  : 'SINPE',
      canal:   'Web',
      cliente: ''
    };
    fetch(SHEET_LOG_URL, {
      method: 'POST',
      body:   JSON.stringify(payload)
    }).catch(function () { /* best-effort — WhatsApp es la fuente de verdad */ });
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
    var msg   = (ref ? '*Pedido ' + ref + ' — Vency Atelier*\n\n' : '')
              + 'Hola! Quisiera ordenar:\n'
              + items.map(function (it) { return '• ' + it.wa; }).join('\n')
              + '\n\nTotal: ' + colones(cartTotal()) + '\n'
              + tail;

    if (summaryEl) summaryEl.innerHTML = renderLines(items);
    if (priceEl)   priceEl.textContent = colones(cartTotal());
    var sinpeAmt = panel.querySelector('.js-sinpe-amount');
    if (sinpeAmt) sinpeAmt.textContent = colones(cartTotal());

    var ticketEl = panel.querySelector('.js-dc-order-ticket');
    var refEl    = panel.querySelector('.js-dc-order-ref');
    if (ticketEl) ticketEl.hidden = !ref;
    if (refEl)    refEl.textContent = ref || '';

    if (waBtn) {
      waBtn.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
      var btnLabel = isLocal
        ? ('Enviar pedido' + (ref ? ' ' + ref : '') + ' por WhatsApp')
        : ('Enviar comprobante' + (ref ? ' \xb7 ' + ref : '') + ' por WhatsApp');
      waBtn.textContent = btnLabel;
      waBtn.setAttribute('aria-label', btnLabel);
    }

    var confirmEl = panel.querySelector('.order-panel__confirm');
    if (confirmEl) {
      confirmEl.textContent = isLocal
        ? 'Enviá tu pedido por WhatsApp con tu nombre. El pago se realiza en el local.'
        : 'Transferí el monto exacto por SINPE. Luego tocá el botón y adjuntá el comprobante como imagen en ese mismo chat.';
    }
  }

  function openPanel() {
    if (!currentOrderRef) currentOrderRef = generateRef();
    syncPanel();
    panel.classList.add('is-open');
    if (orderBtn) {
      orderBtn.setAttribute('aria-expanded', 'true');
      orderBtn.textContent = 'Cerrar';
    }
    setTimeout(function () {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  }

  function closePanel() {
    panel.classList.remove('is-open');
    currentOrderRef = null;
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
      trigger.addEventListener('click', function () {
        if (trigger.disabled || block.dataset.soldOut === 'true') return;
        handleClick(id, name);
      });
    }

    block.querySelectorAll('.fmt-rail__buy-btn[data-fmt]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.disabled) return;
        handleBottleClick(id, name, btn.dataset.fmt);
      });
    });
  });

  /* ---- Event delegation: decant remove + bottle remove + clear decants ---- */
  tray.addEventListener('click', function (e) {
    var decantRemove = e.target.closest('.js-remove-decant');
    if (decantRemove) {
      var idx = parseInt(decantRemove.dataset.slotIndex, 10);
      if (!isNaN(idx)) removeFromSlot(idx);
      return;
    }
    var bottleRemove = e.target.closest('.js-remove-bottle');
    if (bottleRemove) {
      var idx = parseInt(bottleRemove.dataset.bottleIndex, 10);
      if (!isNaN(idx)) { bottles.splice(idx, 1); updateUI(); }
      return;
    }
    var clearBtn = e.target.closest('.js-clear-decants');
    if (clearBtn) { selection = []; updateUI(); }
  });

  /* ---- Wire up order button: navigate to dedicated cart page ---- */
  if (orderBtn) {
    orderBtn.addEventListener('click', function () {
      if (orderBtn.disabled) return;
      window.location.href = 'carrito.html';
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

  // Sold-out state now computed in catalogo.js render path (single source).
  // Late-applying script was causing AGOTADO to flash in during scroll.

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

  window.vencyCart = {
    setBottleQty:  setBottleQty,
    getBottleQty:  getBottleQty,
    setDecantQty:  setDecantQty,
    getDecantQty:  countFor,
    showToast:     showToast,
    // Read-only snapshots for /carrito.html (it doesn't load decants.js):
    getState:      function () { return { selection: selection.slice(), bottles: bottles.slice(), ref: currentOrderRef }; },
    clear:         clearCart
  };

  // Show the tray on load if the cart already has items from a prior session
  if (selection.length > 0 || bottles.length > 0) updateUI();

})();
