/**
 * Vency Atelier · Cart page (carrito.html)
 *
 * Standalone: reads/writes the same localStorage key as decants.js, so adding
 * a fragrance on catalogo.html and navigating here shows the same cart.
 */
(function () {
  'use strict';

  var CART_KEY  = 'vency_cart_v1';
  var WA_NUMBER = '50672773156';
  var SHEET_URL = 'https://script.google.com/macros/s/AKfycbzuJHp43JAzsQfAEpe6vWUzDqsOlA28vPSliOi4RsjgRr8d-m06t4MtzNKrdO2njZJW/exec';

  var SET_PRICE    = 12000;
  var DECANT_PRICE = 5000;
  var BOTTLE_PRICE = { '30ml': 12000, '100ml': 20000 };
  var BOTTLE_LABEL = { '30ml': '30 ml', '100ml': '100 ml' };

  var esc = window.escHtml || function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
  };

  // ─── State ─────────────────────────────────────────────────────────────
  // pending = { ref, sentAt, waHref } when the user has tapped WhatsApp.
  // While pending, the cart shows a confirmation card instead of the order form.
  var state = { selection: [], bottles: [], ref: null, pending: null };
  var PENDING_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

  function load() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (Array.isArray(data.selection)) state.selection = data.selection;
      if (Array.isArray(data.bottles))   state.bottles   = data.bottles;
      if (typeof data.ref === 'string')  state.ref       = data.ref;
      if (data.pending && typeof data.pending === 'object') {
        // Expire pending if older than TTL
        if (Date.now() - (data.pending.sentAt || 0) < PENDING_TTL_MS) {
          state.pending = data.pending;
        }
      }
    } catch (e) { /* corrupt — start fresh */ }
  }

  function save() {
    try { localStorage.setItem(CART_KEY, JSON.stringify({
      selection: state.selection,
      bottles:   state.bottles,
      ref:       state.ref,
      pending:   state.pending
    })); } catch (e) {}
  }

  function generateRef() {
    return 'VA' + (Math.floor(Math.random() * 9000) + 1000);
  }

  function colones(n) { return '₡' + Number(n).toLocaleString('es-CR'); }

  // ─── Selectors ─────────────────────────────────────────────────────────
  function isEmpty()       { return state.selection.length === 0 && state.bottles.length === 0; }
  function decantCount()   { return state.selection.length; }
  function decantPrice()   { return decantCount() === 3 ? SET_PRICE : decantCount() * DECANT_PRICE; }
  function bottlesPrice()  { return state.bottles.reduce(function (s, b) { return s + b.price * (b.qty || 1); }, 0); }
  function total()         { return decantPrice() + bottlesPrice(); }

  function selectionGrouped() {
    var counts = {}, order = [];
    state.selection.forEach(function (s) {
      if (counts[s.id] == null) { counts[s.id] = 0; order.push(s); }
      counts[s.id]++;
    });
    return order.map(function (s) { return { id: s.id, name: s.name, qty: counts[s.id] }; });
  }

  // ─── Mutations ─────────────────────────────────────────────────────────
  function setBottleQty(id, fmt, qty) {
    var idx = -1;
    for (var i = 0; i < state.bottles.length; i++) {
      if (state.bottles[i].id === id && state.bottles[i].fmt === fmt) { idx = i; break; }
    }
    if (qty <= 0) {
      if (idx >= 0) state.bottles.splice(idx, 1);
    } else if (idx >= 0) {
      state.bottles[idx].qty = qty;
    }
    save();
  }

  function removeDecant(id, allOfId) {
    if (allOfId) {
      state.selection = state.selection.filter(function (s) { return s.id !== id; });
    } else {
      for (var i = state.selection.length - 1; i >= 0; i--) {
        if (state.selection[i].id === id) { state.selection.splice(i, 1); break; }
      }
    }
    save();
  }

  function addDecant(id, name) {
    if (state.selection.length >= 3) return;
    state.selection.push({ id: id, name: name });
    save();
  }

  function clearAll() {
    state.selection.length = 0;  // mutate in place — safer than reassignment
    state.bottles.length   = 0;
    state.ref = null;
    state.pending = null;
    save();
  }

  // ─── DOM ───────────────────────────────────────────────────────────────
  var emptyEl    = document.getElementById('js-cart-empty');
  var cartEl     = document.getElementById('js-cart');
  var itemsEl    = document.getElementById('js-cart-items');
  var totalEl    = document.getElementById('js-cart-total');
  var nudgeEl    = document.getElementById('js-cart-nudge');
  var pickupNote = document.querySelector('.js-pickup-note');
  var methodsEl  = document.getElementById('js-methods');
  var sinpeAmt   = document.querySelector('.js-sinpe-amount');
  var ticketEl   = document.getElementById('js-cart-ticket');
  var refEl      = document.getElementById('js-cart-ref');
  var confirmTxt = document.getElementById('js-cart-confirm-text');
  var waBtn      = document.getElementById('js-cart-wa');
  var clearBtn   = document.getElementById('js-cart-clear');
  // Post-order confirmation card
  var sentEl     = document.getElementById('js-cart-sent');
  var sentRefEl  = document.getElementById('js-sent-ref');
  var sentResend = document.getElementById('js-sent-resend');
  var sentNewBtn = document.getElementById('js-sent-new');

  // ─── Render ────────────────────────────────────────────────────────────
  function renderItems() {
    var lines = [];

    // Decants
    var grouped = selectionGrouped();
    if (grouped.length > 0) {
      var setHeader = decantCount() === 3
        ? '<span class="carrito__item-meta">Set de 3 decants · ahorrás ₡3.000</span>'
        : (decantCount() < 3
            ? '<span class="carrito__item-meta">' + (3 - decantCount()) + ' más para set (₡12.000 los 3)</span>'
            : '');
      lines.push(
        '<div class="carrito__group">' +
          '<div class="carrito__group-head">' +
            '<span class="label ochre-label">DECANTS · 10 ML</span>' +
            setHeader +
          '</div>' +
          grouped.map(function (g) {
            return '<div class="carrito__item" data-id="' + esc(g.id) + '" data-fmt="decant">' +
              '<div class="carrito__item-info">' +
                '<p class="carrito__item-name">' + esc(g.name) + '</p>' +
                '<p class="carrito__item-price">' + colones(DECANT_PRICE) + ' c/u</p>' +
              '</div>' +
              '<div class="carrito__qty">' +
                '<button class="carrito__qty-btn js-qty-dec" type="button" aria-label="Quitar uno">−</button>' +
                '<span class="carrito__qty-val">' + g.qty + '</span>' +
                '<button class="carrito__qty-btn js-qty-inc" type="button" aria-label="Agregar uno"' + (decantCount() >= 3 ? ' disabled' : '') + '>+</button>' +
                '<button class="carrito__qty-rm js-qty-remove" type="button" aria-label="Quitar ' + esc(g.name) + '">×</button>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>'
      );
    }

    // Bottles
    if (state.bottles.length > 0) {
      lines.push(
        '<div class="carrito__group">' +
          '<div class="carrito__group-head"><span class="label ochre-label">FRASCOS</span></div>' +
          state.bottles.map(function (b) {
            var qty = b.qty || 1;
            return '<div class="carrito__item" data-id="' + esc(b.id) + '" data-fmt="' + esc(b.fmt) + '">' +
              '<div class="carrito__item-info">' +
                '<p class="carrito__item-name">' + esc(b.name) + '</p>' +
                '<p class="carrito__item-price">Frasco ' + esc(BOTTLE_LABEL[b.fmt] || b.fmt) + ' · ' + colones(b.price) + ' c/u</p>' +
              '</div>' +
              '<div class="carrito__qty">' +
                '<button class="carrito__qty-btn js-qty-dec" type="button" aria-label="Quitar uno">−</button>' +
                '<span class="carrito__qty-val">' + qty + '</span>' +
                '<button class="carrito__qty-btn js-qty-inc" type="button" aria-label="Agregar uno">+</button>' +
                '<button class="carrito__qty-rm js-qty-remove" type="button" aria-label="Quitar ' + esc(b.name) + '">×</button>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>'
      );
    }

    itemsEl.innerHTML = lines.join('');
  }

  function render() {
    // Post-order takes priority: cart still in storage so the user can
    // re-send the same message if needed, but the form is replaced with
    // a confirmation card.
    if (state.pending && state.pending.ref) {
      if (emptyEl) emptyEl.hidden = true;
      if (cartEl)  cartEl.hidden  = true;
      if (sentEl)  sentEl.hidden  = false;
      if (sentRefEl)  sentRefEl.textContent = state.pending.ref;
      if (sentResend && state.pending.waHref) sentResend.href = state.pending.waHref;
      return;
    }
    if (sentEl) sentEl.hidden = true;

    var empty = isEmpty();
    emptyEl.hidden = !empty;
    cartEl.hidden  = empty;
    if (empty) return;

    renderItems();
    var grand = total();
    totalEl.textContent = colones(grand);
    if (sinpeAmt) sinpeAmt.textContent = colones(grand);

    // Set-nudge
    if (nudgeEl) {
      if (decantCount() > 0 && decantCount() < 3) {
        nudgeEl.hidden = false;
        nudgeEl.innerHTML = 'Añadí ' + (3 - decantCount()) + ' más para armar un set por <strong>' + colones(SET_PRICE) + '</strong> y ahorrar ' + colones(3 * DECANT_PRICE - SET_PRICE) + '.';
      } else if (decantCount() === 3) {
        nudgeEl.hidden = false;
        nudgeEl.innerHTML = 'Set completo · ahorrás <strong>' + colones(3 * DECANT_PRICE - SET_PRICE) + '</strong>.';
      } else {
        nudgeEl.hidden = true;
      }
    }

    // Delivery method toggles
    var isLocal = (document.querySelector('.js-delivery-radio:checked') || {}).value === 'local';
    if (methodsEl) methodsEl.classList.toggle('is-hidden', isLocal);
    if (pickupNote) {
      pickupNote.classList.toggle('is-visible', isLocal);
      pickupNote.setAttribute('aria-hidden', String(!isLocal));
    }

    // Reference ticket
    if (!state.ref) { state.ref = generateRef(); save(); }
    if (ticketEl) ticketEl.hidden = !state.ref;
    if (refEl)    refEl.textContent = state.ref || '';

    // WhatsApp link + confirm text
    var items = [];
    if (decantCount() === 3) {
      items.push('Set de 3 Decants (10 ml): ' + grouped_wa());
    } else {
      selectionGrouped().forEach(function (g) {
        items.push(g.name + ' · Decant 10 ml' + (g.qty > 1 ? ' ×' + g.qty : ''));
      });
    }
    state.bottles.forEach(function (b) {
      var qty = b.qty || 1;
      items.push(b.name + ' · Frasco ' + (BOTTLE_LABEL[b.fmt] || b.fmt) + (qty > 1 ? ' ×' + qty : ''));
    });

    var tail = isLocal ? 'Voy a recoger en el local.' : 'Adjunto comprobante de pago.';
    var msg  = '*Pedido ' + state.ref + ' · Vency Atelier*\n\n'
             + 'Hola! Quisiera ordenar:\n'
             + items.map(function (x) { return '• ' + x; }).join('\n')
             + '\n\nTotal: ' + colones(grand) + '\n'
             + tail;

    if (waBtn) {
      waBtn.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
      var label = isLocal
        ? 'Enviar pedido ' + state.ref + ' por WhatsApp'
        : 'Enviar comprobante ' + state.ref + ' por WhatsApp';
      waBtn.textContent = label;
      waBtn.setAttribute('aria-label', label);
    }
    if (confirmTxt) {
      confirmTxt.textContent = isLocal
        ? 'Enviá tu pedido por WhatsApp con tu nombre. El pago se realiza en el local.'
        : 'Transferí el monto exacto por SINPE. Luego tocá el botón y adjuntá el comprobante en el mismo chat.';
    }
  }

  function grouped_wa() {
    return selectionGrouped().map(function (g) {
      return g.name + (g.qty > 1 ? ' ×' + g.qty : '');
    }).join(', ');
  }

  // ─── Wire-up ───────────────────────────────────────────────────────────
  itemsEl.addEventListener('click', function (e) {
    var row = e.target.closest('.carrito__item');
    if (!row) return;
    var id  = row.dataset.id;
    var fmt = row.dataset.fmt;
    if (e.target.closest('.js-qty-remove')) {
      if (fmt === 'decant') removeDecant(id, true);
      else setBottleQty(id, fmt, 0);
    } else if (e.target.closest('.js-qty-dec')) {
      if (fmt === 'decant') removeDecant(id, false);
      else {
        var b = state.bottles.find(function (x) { return x.id === id && x.fmt === fmt; });
        if (b) setBottleQty(id, fmt, (b.qty || 1) - 1);
      }
    } else if (e.target.closest('.js-qty-inc')) {
      if (fmt === 'decant') {
        var existing = state.selection.find(function (x) { return x.id === id; });
        if (existing) addDecant(id, existing.name);
      } else {
        var b2 = state.bottles.find(function (x) { return x.id === id && x.fmt === fmt; });
        if (b2) setBottleQty(id, fmt, (b2.qty || 1) + 1);
      }
    } else {
      return;
    }
    render();
  });

  document.querySelectorAll('.js-delivery-radio').forEach(function (r) {
    r.addEventListener('change', render);
  });

  // In-page undo toast — replaces the native confirm() that exposed the
  // tunnel URL and clashed with the brand visually.
  function showUndoToast(snapshot) {
    var existing = document.querySelector('.vency-toast--undo');
    if (existing) existing.remove();

    var t = document.createElement('div');
    t.className = 'vency-toast vency-toast--undo';
    t.innerHTML =
      '<span>Carrito vaciado.</span>' +
      '<button class="vency-toast__undo" type="button">Deshacer</button>';
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('vency-toast--in'); });

    var timer = setTimeout(dismiss, 5000);
    function dismiss() {
      clearTimeout(timer);
      t.classList.remove('vency-toast--in');
      setTimeout(function () { if (t.parentNode) t.remove(); }, 300);
    }
    t.querySelector('.vency-toast__undo').addEventListener('click', function () {
      state.selection = snapshot.selection.slice();
      state.bottles   = snapshot.bottles.slice();
      state.ref       = snapshot.ref;
      save();
      render();
      dismiss();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      if (isEmpty()) return;
      var snap = {
        selection: state.selection.slice(),
        bottles:   state.bottles.slice(),
        ref:       state.ref
      };
      clearAll();
      render();
      showUndoToast(snap);
    });
  }

  // Log order to Sheets + mark pending when the user opens WhatsApp.
  if (waBtn) {
    waBtn.addEventListener('click', function () {
      if (isEmpty()) return;
      var delivery = (document.querySelector('.js-delivery-radio:checked') || {}).value || 'sinpe';
      var items = [];
      if (decantCount() === 3) items.push('Set de 3 Decants (10 ml): ' + grouped_wa());
      else selectionGrouped().forEach(function (g) {
        items.push(g.name + ' · Decant 10 ml' + (g.qty > 1 ? ' ×' + g.qty : ''));
      });
      state.bottles.forEach(function (b) {
        var qty = b.qty || 1;
        items.push(b.name + ' · Frasco ' + (BOTTLE_LABEL[b.fmt] || b.fmt) + (qty > 1 ? ' ×' + qty : ''));
      });

      if (SHEET_URL) {
        fetch(SHEET_URL, {
          method: 'POST',
          body: JSON.stringify({
            ref:     state.ref || '',
            items:   items.join(' | '),
            total:   total(),
            pago:    delivery === 'local' ? 'En sitio' : 'SINPE',
            entrega: delivery === 'local' ? 'Recoger'  : 'SINPE',
            canal:   'Web',
            cliente: ''
          })
        }).catch(function () {});
      }

      // Mark the cart as pending so the next render shows the
      // confirmation card instead of the order form. We do NOT clear the
      // cart items — the user might come back to re-send the same order.
      state.pending = {
        ref:    state.ref,
        sentAt: Date.now(),
        waHref: waBtn.getAttribute('href') || ''
      };
      save();
    });
  }

  // Confirmation card actions
  if (sentNewBtn) {
    sentNewBtn.addEventListener('click', function () {
      clearAll();   // resets cart + pending; render() will show the empty state
      render();
    });
  }

  // When the user returns from WhatsApp (tab visible again), re-render so
  // the confirmation card surfaces without needing a manual refresh.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      load();
      render();
    }
  });

  // ─── Init ──────────────────────────────────────────────────────────────
  load();
  render();
})();
