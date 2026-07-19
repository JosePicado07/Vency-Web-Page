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
  var SHEET_URL = 'https://script.google.com/macros/s/AKfycbxjcXCiK8xVVr9ZbB54Cfxpr9NZr8HQ1Kt7dbnW3QIP0kIFhb694RunK_3lUkScdKk/exec';

  var _P           = window.VENCY_PRICES;
  var SET_PRICE    = _P.set3;
  var DECANT_PRICE = _P.decant;
  var BOTTLE_PRICE = { '30ml': _P.b30.vency, '100ml': _P.b100.vency };
  var BOTTLE_LABEL = { '30ml': '30 ml', '100ml': '100 ml' };
  var SHIPPING_FEE        = _P.shipping;
  var FREE_SHIP_THRESHOLD = _P.freeShipping;

  var esc = window.escHtml;

  // Build id → webp thumbnail map from both catalogs
  var toWebp400 = window.toWebp400;
  var slug_     = window.slugify;
  var imgMap = {};
  (window.VENCY_CATALOG || []).forEach(function (f) { if (f.id && f.image) imgMap[f.id] = toWebp400(f.image); });
  (window.VENCY_FULL_CATALOG || []).forEach(function (f) {
    if (!f.image) return;
    imgMap[slug_((f.brand || '') + '-' + f.name)] = toWebp400(f.image);
  });

  function thumbHtml(id) {
    var src = imgMap[id];
    if (!src) return '';
    return '<img class="carrito__item-thumb" src="' + esc(src) + '" alt="" loading="lazy"' +
      ' onerror="this.style.display=\'none\'">';
  }

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

  var generateRef = window.generateRef;
  var colones     = window.fmtCRC;

  // ─── Selectors ─────────────────────────────────────────────────────────
  function isEmpty()       { return state.selection.length === 0 && state.bottles.length === 0; }
  function decantCount()   { return state.selection.length; }
  function decantPrice()   { var n = decantCount(); return Math.floor(n / 3) * SET_PRICE + (n % 3) * DECANT_PRICE; }
  function bottlesPrice()  { return state.bottles.reduce(function (s, b) { return s + b.price * (b.qty || 1); }, 0); }
  function subtotal()      { return decantPrice() + bottlesPrice(); }
  function isDelivery()    { var r = document.querySelector('.js-delivery-radio:checked'); return !r || r.value !== 'local'; }
  function shippingFee()   { return isDelivery() && subtotal() < FREE_SHIP_THRESHOLD ? SHIPPING_FEE : 0; }
  function total()         { return subtotal() + shippingFee(); }

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
  var emptyEl       = document.getElementById('js-cart-empty');
  var cartEl        = document.getElementById('js-cart');
  var itemsEl       = document.getElementById('js-cart-items');
  var totalEl       = document.getElementById('js-cart-total');
  var nudgeEl       = document.getElementById('js-cart-nudge');
  var shippingRowEl = document.getElementById('js-shipping-row');
  var shippingAmtEl = document.getElementById('js-shipping-amount');
  var shipNudgeEl   = document.getElementById('js-ship-nudge');
  if (shippingAmtEl) shippingAmtEl.textContent = colones(SHIPPING_FEE);
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
    var focusId = null, focusFmt = null, focusCls = null;
    var ae = document.activeElement;
    if (ae && itemsEl.contains(ae)) {
      var focusRow = ae.closest('.carrito__item');
      if (focusRow) {
        focusId  = focusRow.dataset.id;
        focusFmt = focusRow.dataset.fmt;
        focusCls = ae.classList.contains('js-qty-dec')    ? 'js-qty-dec'
                 : ae.classList.contains('js-qty-inc')    ? 'js-qty-inc'
                 : ae.classList.contains('js-qty-remove') ? 'js-qty-remove'
                 : null;
      }
    }

    var lines = [];

    // Decants
    var grouped = selectionGrouped();
    if (grouped.length > 0) {
      var _n = decantCount(), _rem = _n % 3, _sets = Math.floor(_n / 3);
      var setHeader = _rem === 0
        ? '<span class="carrito__item-meta">Set' + (_sets > 1 ? 's ' + _sets : '') + ' completo' + (_sets > 1 ? 's' : '') + ' · ahorrás ' + colones(_sets * 3000) + '</span>'
        : '<span class="carrito__item-meta">' + (3 - _rem) + ' más para ' + (_sets > 0 ? 'otro ' : 'el ') + 'set (₡12.000 los 3)</span>';
      lines.push(
        '<div class="carrito__group">' +
          '<div class="carrito__group-head">' +
            '<h3 class="label ochre-label carrito__group-label">DECANTS · 10 ML</h3>' +
            setHeader +
          '</div>' +
          grouped.map(function (g) {
            return '<div class="carrito__item" data-id="' + esc(g.id) + '" data-fmt="decant">' +
              thumbHtml(g.id) +
              '<div class="carrito__item-info">' +
                '<p class="carrito__item-name">' + esc(g.name) + '</p>' +
                '<p class="carrito__item-price">' + colones(DECANT_PRICE) + ' c/u</p>' +
              '</div>' +
              '<div class="carrito__qty">' +
                '<button class="carrito__qty-btn js-qty-dec" type="button" aria-label="Quitar uno de ' + esc(g.name) + '">−</button>' +
                '<span class="carrito__qty-val">' + g.qty + '</span>' +
                '<button class="carrito__qty-btn js-qty-inc" type="button" aria-label="Agregar uno de ' + esc(g.name) + '">+</button>' +
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
          '<div class="carrito__group-head"><h3 class="label ochre-label carrito__group-label">FRASCOS</h3></div>' +
          state.bottles.map(function (b) {
            var qty = b.qty || 1;
            return '<div class="carrito__item" data-id="' + esc(b.id) + '" data-fmt="' + esc(b.fmt) + '">' +
              thumbHtml(b.id) +
              '<div class="carrito__item-info">' +
                '<p class="carrito__item-name">' + esc(b.name) + '</p>' +
                '<p class="carrito__item-price">Frasco ' + esc(BOTTLE_LABEL[b.fmt] || b.fmt) + ' · ' + colones(b.price) + ' c/u</p>' +
              '</div>' +
              '<div class="carrito__qty">' +
                '<button class="carrito__qty-btn js-qty-dec" type="button" aria-label="Quitar uno de ' + esc(b.name) + '">−</button>' +
                '<span class="carrito__qty-val">' + qty + '</span>' +
                '<button class="carrito__qty-btn js-qty-inc" type="button" aria-label="Agregar uno de ' + esc(b.name) + '">+</button>' +
                '<button class="carrito__qty-rm js-qty-remove" type="button" aria-label="Quitar ' + esc(b.name) + '">×</button>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>'
      );
    }

    itemsEl.innerHTML = lines.join('');

    if (focusId && focusCls) {
      var restoreRow = itemsEl.querySelector('[data-id="' + focusId + '"][data-fmt="' + focusFmt + '"]');
      if (restoreRow) {
        var restoreBtn = restoreRow.querySelector('.' + focusCls);
        if (restoreBtn) restoreBtn.focus();
      }
    }
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
      var _isStripe = state.pending.type === 'stripe';
      var _subEl = sentEl && sentEl.querySelector('.carrito-sent__sub');
      if (_subEl) {
        _subEl.textContent = _isStripe
          ? 'Tu pago fue procesado. Tony preparará tu pedido en breve.'
          : 'Tony recibió tu mensaje en WhatsApp. Si pagaste por SINPE, recordá enviar el comprobante a ese mismo chat.';
      }
      if (sentResend) {
        sentResend.style.display = _isStripe ? 'none' : '';
        if (!_isStripe && state.pending.waHref) sentResend.href = state.pending.waHref;
      }
      setTimeout(function () {
        var focusTarget = sentEl && sentEl.querySelector('[tabindex="-1"], a, button');
        if (focusTarget) focusTarget.focus();
      }, 60);
      return;
    }
    if (sentEl) sentEl.hidden = true;

    var empty = isEmpty();
    emptyEl.hidden = !empty;
    cartEl.hidden  = empty;
    if (empty) return;

    renderItems();
    var _sub  = subtotal();
    var _ship = shippingFee();
    var grand = _sub + _ship;
    if (shippingRowEl) shippingRowEl.hidden = (_ship === 0);
    totalEl.textContent = colones(grand);
    if (sinpeAmt) sinpeAmt.textContent = colones(grand);

    // Set-nudge
    if (nudgeEl) {
      var _dn = decantCount(), _rem2 = _dn % 3, _sets2 = Math.floor(_dn / 3);
      if (_dn === 0) {
        nudgeEl.hidden = true;
      } else if (_rem2 === 0) {
        nudgeEl.hidden = false;
        nudgeEl.innerHTML = (_sets2 > 1 ? _sets2 + ' sets completos' : 'Set completo') + ' · ahorrás <strong>' + colones(_sets2 * 3000) + '</strong>.';
      } else {
        nudgeEl.hidden = false;
        nudgeEl.innerHTML = 'Añadí ' + (3 - _rem2) + ' más para ' + (_sets2 > 0 ? 'otro' : 'el') + ' set por <strong>' + colones(SET_PRICE) + '</strong>.';
      }
    }

    // Shipping nudge
    if (shipNudgeEl) {
      if (!isDelivery()) {
        shipNudgeEl.hidden = true;
      } else if (_sub >= FREE_SHIP_THRESHOLD) {
        shipNudgeEl.hidden = false;
        shipNudgeEl.textContent = 'Envío gratis incluido en este pedido.';
      } else {
        shipNudgeEl.hidden = false;
        shipNudgeEl.innerHTML = 'Añadí <strong>' + colones(FREE_SHIP_THRESHOLD - _sub) + '</strong> más para envío gratis.';
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
    var _dc = decantCount();
    if (_dc > 0 && _dc % 3 === 0) {
      items.push('Set' + (_dc > 3 ? 's ' + Math.floor(_dc / 3) : '') + ' de Decants (10 ml): ' + grouped_wa());
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
             + (_ship > 0 ? '\n• Envío a domicilio · ' + colones(_ship) : '')
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
    t.setAttribute('role', 'alert');
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
      var _dc2 = decantCount();
      if (_dc2 > 0 && _dc2 % 3 === 0) items.push('Set' + (_dc2 > 3 ? 's ' + Math.floor(_dc2 / 3) : '') + ' de Decants (10 ml): ' + grouped_wa());
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

  // ─── Stripe card payment ───────────────────────────────────────────────
  function showStripeError(msg) {
    var existing = document.querySelector('.vency-toast--stripe-err');
    if (existing) existing.remove();
    window.makeToast('<span>' + esc(msg) + '</span>', 'vency-toast--undo vency-toast--stripe-err', 6000);
  }

  var stripeBtn = document.getElementById('js-cart-stripe');
  if (stripeBtn) {
    stripeBtn.addEventListener('click', function () {
      if (isEmpty()) return;

      // Build a flat line_items list for the serverless function
      var lineItems = [];
      var grouped = selectionGrouped();
      var _dc = decantCount();

      if (_dc > 0) {
        // Price follows the set logic: floor(n/3)*12000 + (n%3)*5000
        // Split into sets + loose so Stripe shows meaningful names
        var sets = Math.floor(_dc / 3);
        var loose = _dc % 3;
        if (sets > 0) lineItems.push({ name: 'Set de Decants 10 ml ×3', price: SET_PRICE, qty: sets });
        if (loose > 0) {
          grouped.slice(sets * 3).forEach(function (g) {
            lineItems.push({ name: g.name + ' · Decant 10 ml', price: DECANT_PRICE, qty: g.qty });
          });
          // Fallback: if grouping doesn't align, just add loose decants
          if (lineItems.length === sets) {
            lineItems.push({ name: 'Decant 10 ml', price: DECANT_PRICE, qty: loose });
          }
        }
      }

      state.bottles.forEach(function (b) {
        lineItems.push({
          name: b.name + ' · Frasco ' + (BOTTLE_LABEL[b.fmt] || b.fmt),
          price: b.price,
          qty:   b.qty || 1,
        });
      });

      var _stripeShip = shippingFee();
      if (_stripeShip > 0) lineItems.push({ name: 'Envío a domicilio', price: _stripeShip, qty: 1 });

      stripeBtn.disabled = true;
      stripeBtn.textContent = 'Redirigiendo…';

      fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: lineItems, ref: state.ref || generateRef() }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.url) {
            window.location.href = data.url;
          } else {
            stripeBtn.disabled = false;
            stripeBtn.textContent = 'Pagar con tarjeta';
            showStripeError('No se pudo iniciar el pago: ' + (data.error || 'error desconocido'));
          }
        })
        .catch(function () {
          stripeBtn.disabled = false;
          stripeBtn.textContent = 'Pagar con tarjeta';
          showStripeError('Error de conexión. Intentá de nuevo.');
        });
    });
  }

  // ─── Stripe return ─────────────────────────────────────────────────────
  // Fires when Stripe redirects back with ?paid=1&ref=VA-XXXX after a
  // successful card payment. Logs the order to the Sheet (first and only time),
  // then shows the confirmation card and clears the cart.
  function handleStripeReturn() {
    var sp = new URLSearchParams(window.location.search);
    if (sp.get('paid') !== '1') return;
    var ref = sp.get('ref') || state.ref || generateRef();

    if (SHEET_URL && !isEmpty()) {
      var _dc = decantCount();
      var items = [];
      if (_dc > 0 && _dc % 3 === 0) items.push('Set de Decants (10 ml): ' + grouped_wa());
      else selectionGrouped().forEach(function (g) {
        items.push(g.name + ' · Decant 10 ml' + (g.qty > 1 ? ' ×' + g.qty : ''));
      });
      state.bottles.forEach(function (b) {
        var qty = b.qty || 1;
        items.push(b.name + ' · Frasco ' + (BOTTLE_LABEL[b.fmt] || b.fmt) + (qty > 1 ? ' ×' + qty : ''));
      });
      fetch(SHEET_URL, {
        method: 'POST',
        body: JSON.stringify({
          ref: ref, items: items.join(' | '), total: total(),
          pago: 'Tarjeta', entrega: 'Stripe', canal: 'Web', cliente: ''
        })
      }).catch(function () {});
    }

    state.ref = ref;
    state.pending = { ref: ref, sentAt: Date.now(), waHref: '', type: 'stripe' };
    state.selection.length = 0;
    state.bottles.length   = 0;
    save();
    history.replaceState(null, '', window.location.pathname);
  }

  // ─── Init ──────────────────────────────────────────────────────────────
  load();
  handleStripeReturn();
  render();
})();
