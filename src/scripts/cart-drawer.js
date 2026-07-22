(function () {
  'use strict';

  var overlay = document.querySelector('.js-cart-overlay');
  var drawer  = document.querySelector('.js-cart-drawer');
  var close   = drawer && drawer.querySelector('.js-cart-close');
  var body    = drawer && drawer.querySelector('.js-cart-body');
  var count   = drawer && drawer.querySelector('.js-cart-count');
  var totalEl = drawer && drawer.querySelector('.js-cart-total');
  var upsell  = drawer && drawer.querySelector('.js-cart-upsell');
  if (!overlay || !drawer || !body) return;

  // Always read fresh — fragrance-data.js may load in a different position
  // on different pages. Caching once at IIFE init lost the rail on pages
  // where script order put cart-drawer first.
  function getCatalog() { return window.VENCY_CATALOG || []; }

  var catalogMap = null;
  function getCatalogMap() {
    if (!catalogMap) {
      catalogMap = {};
      getCatalog().forEach(function (f) { catalogMap[f.id] = f; });
    }
    return catalogMap;
  }

  var _openTrigger = null;

  function openCart(triggerEl) {
    _openTrigger = triggerEl || null;
    overlay.classList.add('is-open');
    drawer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    renderCart();
    setTimeout(function () { if (close) close.focus(); }, 60);
  }

  function closeCart() {
    overlay.classList.remove('is-open');
    drawer.classList.remove('is-open');
    document.body.style.overflow = '';
    if (_openTrigger) { _openTrigger.focus(); _openTrigger = null; }
  }

  close.addEventListener('click', closeCart);
  overlay.addEventListener('click', closeCart);
  document.addEventListener('keydown', function (e) {
    if (!drawer.classList.contains('is-open')) return;
    if (e.key === 'Escape') { closeCart(); return; }
    if (e.key === 'Tab') {
      var focusable = Array.prototype.slice.call(
        drawer.querySelectorAll('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])')
      );
      if (focusable.length === 0) return;
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  function getCart() {
    try {
      var raw = localStorage.getItem('vency_cart_v1');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  function renderCart() {
    var cart = getCart();
    var selection = (cart && cart.selection) || [];
    var bottles   = (cart && cart.bottles) || [];

    var totalItems = selection.length + bottles.reduce(function (s, b) { return s + (b.qty || 1); }, 0);
    if (count) count.textContent = totalItems + ' ' + (totalItems === 1 ? 'artículo' : 'artículos');

    if (totalItems === 0) {
      body.innerHTML =
        '<div class="cart-drawer__empty">' +
          '<p class="cart-drawer__empty-text">Tu viaje olfativo comienza aquí.</p>' +
          '<a href="catalogo.html" class="btn btn--primary">Explorar la tienda</a>' +
        '</div>';
      if (totalEl) totalEl.textContent = '';
      renderUpsell();
      return;
    }

    var _PP = window.VENCY_PRICES || {};
    function _priceForType(t) { return (_PP.decant && _PP.decant[t]) || (_PP.decant && _PP.decant.vency) || 6000; }
    function _setForType(t)   { return (_PP.set3   && _PP.set3[t])   || (_PP.set3   && _PP.set3.vency)   || 14900; }
    function _savingsForType(t) { return 3 * _priceForType(t) - _setForType(t); }

    var itemsHtml = '';
    var total = 0;

    var cmap = getCatalogMap();

    // Group decants by type for correct set pricing
    var _dGroups = {};
    selection.forEach(function (s) { var t = s.type || 'vency'; _dGroups[t] = (_dGroups[t] || 0) + 1; });
    var _dKeys = Object.keys(_dGroups);
    var decantCount = selection.length;
    var _drem = decantCount % 3, _dsets = Math.floor(decantCount / 3);
    var _dSingleType = _dKeys.length === 1;
    var _dSavings = 0;
    _dKeys.forEach(function (t) {
      var n = _dGroups[t];
      total += Math.floor(n / 3) * _setForType(t) + (n % 3) * _priceForType(t);
      _dSavings += Math.floor(n / 3) * _savingsForType(t);
    });

    if (decantCount > 0) {
      var isComplete = _drem === 0;
      var nudge = isComplete
        ? (_dsets > 1 ? _dsets + ' sets completos' : 'Set completo') + ' · ahorrás ₡' + formatPrice(_dSavings)
        : 'Añadí ' + (3 - _drem) + ' más y armá ' + (_dsets > 0 ? 'otro' : 'el') + ' set' + (_dSingleType ? ' por ₡' + formatPrice(_setForType(_dKeys[0])) : '');
      itemsHtml += '<p class="cart-drawer__bundle-badge' + (isComplete ? ' cart-drawer__bundle-badge--complete' : '') + '">' + nudge + '</p>';
    }

    selection.forEach(function (s) {
      var frag = cmap[s.id];
      var name = frag ? frag.name : s.id;
      var img  = frag ? frag.image : '';
      var itemPrice = _priceForType(s.type || 'vency');
      itemsHtml +=
        '<div class="cart-item">' +
          '<img src="' + img + '" alt="" class="cart-item__img" loading="lazy">' +
          '<div class="cart-item__info">' +
            '<div class="cart-item__name">' + escHtml(name) + '</div>' +
            '<div class="cart-item__variant">Decant · 10 ml</div>' +
            '<div class="cart-item__qty">₡' + formatPrice(itemPrice) + '</div>' +
            '<button class="cart-item__remove js-cart-remove" type="button"' +
              ' data-remove-type="decant" data-remove-id="' + escHtml(s.id) + '"' +
              ' aria-label="Quitar ' + escHtml(name) + '">Quitar</button>' +
          '</div>' +
          '<div class="cart-item__price">₡' + formatPrice(itemPrice) + '</div>' +
        '</div>';
    });

    bottles.forEach(function (b) {
      var frag = cmap[b.id];
      var name = frag ? frag.name : b.id;
      var img  = frag ? frag.image : '';
      var qty = b.qty || 1;
      var unitPrice = b.price || 0;
      total += unitPrice * qty;
      itemsHtml +=
        '<div class="cart-item">' +
          '<img src="' + img + '" alt="" class="cart-item__img" loading="lazy">' +
          '<div class="cart-item__info">' +
            '<div class="cart-item__name">' + escHtml(name) + '</div>' +
            '<div class="cart-item__variant">Frasco · ' + escHtml(b.fmt || '30ml') + (qty > 1 ? ' · ' + qty + ' uds' : '') + '</div>' +
            '<div class="cart-item__qty">₡' + formatPrice(unitPrice) + (qty > 1 ? ' c/u' : '') + '</div>' +
            '<button class="cart-item__remove js-cart-remove" type="button"' +
              ' data-remove-type="bottle" data-remove-id="' + escHtml(b.id) + '" data-remove-fmt="' + escHtml(b.fmt || '') + '"' +
              ' aria-label="Quitar ' + escHtml(name) + '">Quitar</button>' +
          '</div>' +
          '<div class="cart-item__price">₡' + formatPrice(unitPrice * qty) + '</div>' +
        '</div>';
    });

    body.innerHTML = itemsHtml;

    if (totalEl) totalEl.textContent = '₡' + formatPrice(total);
    renderUpsell();
  }

  function renderUpsell() {
    if (!upsell) return;
    var cart = getCart();
    var inCartIds = {};
    if (cart) {
      (cart.selection || []).forEach(function (s) { inCartIds[s.id] = true; });
      (cart.bottles || []).forEach(function (b) { inCartIds[b.id] = true; });
    }

    var catalog = getCatalog();
    var candidates = catalog.filter(function (f) { return !inCartIds[f.id]; });
    if (candidates.length === 0) { upsell.innerHTML = ''; return; }

    // Score each candidate by how many notes it shares with the items
    // already in the cart. The set of notes is gathered across every cart
    // item (Vency lookup by id; entries we can't resolve simply contribute
    // nothing). Ties are broken randomly so the rail still feels alive.
    var cartNotes = {};
    var cmap = getCatalogMap();
    Object.keys(inCartIds).forEach(function (id) {
      var frag = cmap[id];
      if (frag && Array.isArray(frag.notes)) {
        frag.notes.forEach(function (n) { cartNotes[n] = true; });
      }
    });

    var ranked;
    if (Object.keys(cartNotes).length === 0) {
      // Cart is empty or items have no resolvable notes → keep it random (Fisher-Yates).
      ranked = candidates.slice();
      for (var i = ranked.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = ranked[i]; ranked[i] = ranked[j]; ranked[j] = tmp;
      }
    } else {
      ranked = candidates.map(function (f) {
        var fNotes = Array.isArray(f.notes) ? f.notes : [];
        var overlap = 0;
        for (var i = 0; i < fNotes.length; i++) if (cartNotes[fNotes[i]]) overlap++;
        return { frag: f, score: overlap, tie: Math.random() };
      }).sort(function (a, b) {
        if (b.score !== a.score) return b.score - a.score;
        return a.tie - b.tie;
      }).map(function (x) { return x.frag; });
    }

    var show = ranked.slice(0, 8);

    var arrowSvg =
      '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
        '<polyline points="7,2 3,6 7,10"/>' +
      '</svg>';
    var arrowNextSvg =
      '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
        '<polyline points="5,2 9,6 5,10"/>' +
      '</svg>';

    upsell.innerHTML =
      '<div class="cart-drawer__upsell-head">' +
        '<div class="cart-drawer__upsell-label">Completa con</div>' +
        '<div class="cart-drawer__upsell-meta">Decant 10 ml · ₡6.000 c/u</div>' +
      '</div>' +
      '<div class="cart-drawer__upsell-wrap">' +
        '<button class="cart-upsell-arrow cart-upsell-arrow--prev" type="button" aria-label="Anterior">' + arrowSvg + '</button>' +
        '<div class="cart-drawer__upsell-items">' +
          show.map(function (f) {
            return '<button type="button" class="cart-upsell-item" data-upsell-id="' + f.id + '" data-upsell-name="' + escHtml(f.name) + '">' +
              '<img src="' + f.image + '" alt="" class="cart-upsell-item__img" loading="lazy">' +
              '<span class="cart-upsell-item__name">' + escHtml(f.name) + '</span>' +
            '</button>';
          }).join('') +
        '</div>' +
        '<button class="cart-upsell-arrow cart-upsell-arrow--next" type="button" aria-label="Siguiente">' + arrowNextSvg + '</button>' +
      '</div>';

    wireUpsellArrows();
  }

  function wireUpsellArrows() {
    var itemsEl = upsell && upsell.querySelector('.cart-drawer__upsell-items');
    var prev = upsell && upsell.querySelector('.cart-upsell-arrow--prev');
    var next = upsell && upsell.querySelector('.cart-upsell-arrow--next');
    if (!itemsEl || !prev || !next) return;

    function scrollBy(dir) {
      var itemW = 96;
      itemsEl.scrollBy({ left: dir * itemW, behavior: 'smooth' });
    }

    prev.addEventListener('click', function () { scrollBy(-1); });
    next.addEventListener('click', function () { scrollBy(1); });
  }

  function addUpsellToCart(id, name) {
    if (!id) return;
    try {
      var raw = localStorage.getItem('vency_cart_v1');
      var cart = raw ? JSON.parse(raw) : { selection: [], bottles: [], ref: null, pending: null };
      cart.selection.push({ id: id, name: name, type: 'vency' });
      localStorage.setItem('vency_cart_v1', JSON.stringify(cart));
      window.dispatchEvent(new CustomEvent('vency-cart-update'));
      renderCart();
    } catch (e) {}
  }

  if (upsell) {
    upsell.addEventListener('click', function (e) {
      var item = e.target.closest('.cart-upsell-item');
      if (!item) return;
      var id = item.getAttribute('data-upsell-id');
      var name = item.getAttribute('data-upsell-name');
      addUpsellToCart(id, name);
    });
  }

  function formatPrice(n) {
    if (!n) return '0';
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  var escHtml = window.escHtml;

  var cartTriggers = document.querySelectorAll('.js-cart-trigger');
  cartTriggers.forEach(function (t) {
    t.addEventListener('click', function (e) { openCart(e.currentTarget); });
  });

  var onCarritoPage = document.body.classList.contains('page-carrito');
  var navCart = document.querySelector('.js-nav-cart');
  if (navCart && !onCarritoPage) {
    navCart.addEventListener('click', function (e) { e.preventDefault(); openCart(e.currentTarget); });
  }

  window.addEventListener('storage', function (e) {
    if (e.key === 'vency_cart_v1' && drawer.classList.contains('is-open')) renderCart();
  });
  document.addEventListener('visibilitychange', function () {
    if (drawer.classList.contains('is-open')) renderCart();
  });
  window.addEventListener('vency-cart-update', function () {
    if (drawer.classList.contains('is-open')) renderCart();
    updateMiniTray();
  });
  drawer.addEventListener('cart-render', renderCart);

  /* ── Mini tray (only on catalog pages that have the format modal) ── */
  var miniTray = null;
  if (!document.getElementById('dc-tray') && document.querySelector('.js-fmt-overlay')) {
    miniTray = document.createElement('div');
    miniTray.className = 'cart-mini-tray js-cart-mini-tray';
    miniTray.innerHTML =
      '<span class="cart-mini-tray__summary js-mini-tray-summary"></span>' +
      '<button class="btn btn--primary cart-mini-tray__btn js-mini-tray-open" type="button">Ver carrito</button>';
    document.body.appendChild(miniTray);
    miniTray.querySelector('.js-mini-tray-open').addEventListener('click', openCart);
  }

  function updateMiniTray() {
    if (!miniTray) return;
    var cart = getCart();
    var selection = (cart && cart.selection) || [];
    var bottles   = (cart && cart.bottles) || [];
    var n = selection.length + bottles.reduce(function (s, b) { return s + (b.qty || 1); }, 0);
    var _mPP = window.VENCY_PRICES || {};
    function _mPrice(t) { return (_mPP.decant && _mPP.decant[t]) || (_mPP.decant && _mPP.decant.vency) || 6000; }
    function _mSet(t)   { return (_mPP.set3   && _mPP.set3[t])   || (_mPP.set3   && _mPP.set3.vency)   || 14900; }
    var _mGroups = {};
    selection.forEach(function (s) { var t = s.type||'vency'; _mGroups[t]=(_mGroups[t]||0)+1; });
    var decTotal = 0;
    Object.keys(_mGroups).forEach(function (t) { var n=_mGroups[t]; decTotal += Math.floor(n/3)*_mSet(t) + (n%3)*_mPrice(t); });
    var botTotal = bottles.reduce(function (s, b) { return s + (b.price || 0) * (b.qty || 1); }, 0);
    var total = decTotal + botTotal;
    miniTray.classList.toggle('cart-mini-tray--visible', n > 0);
    var summaryEl = miniTray.querySelector('.js-mini-tray-summary');
    if (summaryEl) summaryEl.textContent = n + (n === 1 ? ' artículo' : ' artículos') + ' · ₡' + formatPrice(total);
  }

  updateMiniTray();

  body.addEventListener('click', function (e) {
    var btn = e.target.closest('.js-cart-remove');
    if (!btn) return;
    try {
      var raw = localStorage.getItem('vency_cart_v1');
      var cart = raw ? JSON.parse(raw) : { selection: [], bottles: [] };
      var type  = btn.dataset.removeType;
      var rmId  = btn.dataset.removeId;
      var i;
      if (type === 'decant') {
        for (i = cart.selection.length - 1; i >= 0; i--) {
          if (cart.selection[i].id === rmId) { cart.selection.splice(i, 1); break; }
        }
      } else if (type === 'bottle') {
        var fmt = btn.dataset.removeFmt;
        for (i = cart.bottles.length - 1; i >= 0; i--) {
          if (cart.bottles[i].id === rmId && cart.bottles[i].fmt === fmt) { cart.bottles.splice(i, 1); break; }
        }
      }
      localStorage.setItem('vency_cart_v1', JSON.stringify(cart));
      window.dispatchEvent(new CustomEvent('vency-cart-update'));
      renderCart();
    } catch (err) {}
  });

})();
