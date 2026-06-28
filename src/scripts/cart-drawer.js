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

  var catalog = window.VENCY_CATALOG || [];

  function openCart() {
    overlay.classList.add('is-open');
    drawer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    renderCart();
  }

  function closeCart() {
    overlay.classList.remove('is-open');
    drawer.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  close.addEventListener('click', closeCart);
  overlay.addEventListener('click', closeCart);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeCart();
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
          '<a href="coleccion.html" class="btn btn--primary">Explorar colección</a>' +
        '</div>';
      if (totalEl) totalEl.textContent = '';
      renderUpsell();
      return;
    }

    var DECANT_PRICE = 5000;
    var itemsHtml = '';
    var total = 0;

    selection.forEach(function (s) {
      var frag = catalog.filter(function (f) { return f.id === s.id; })[0];
      var name = frag ? frag.name : s.id;
      var img  = frag ? frag.image : '';
      total += DECANT_PRICE;
      itemsHtml +=
        '<div class="cart-item">' +
          '<img src="' + img + '" alt="" class="cart-item__img" loading="lazy">' +
          '<div class="cart-item__info">' +
            '<div class="cart-item__name">' + escHtml(name) + '</div>' +
            '<div class="cart-item__variant">Decant · 10 ml</div>' +
            '<div class="cart-item__qty">Cant: 1</div>' +
          '</div>' +
          '<div class="cart-item__price">₡' + formatPrice(DECANT_PRICE) + '</div>' +
        '</div>';
    });

    bottles.forEach(function (b) {
      var frag = catalog.filter(function (f) { return f.id === b.id; })[0];
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
            '<div class="cart-item__variant">Botella · ' + escHtml(b.fmt || '30 ml') + '</div>' +
            '<div class="cart-item__qty">Cant: ' + qty + '</div>' +
          '</div>' +
          '<div class="cart-item__price">₡' + formatPrice(unitPrice) + '</div>' +
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

    var candidates = catalog.filter(function (f) { return !inCartIds[f.id]; });
    if (candidates.length === 0) { upsell.innerHTML = ''; return; }

    // Score each candidate by how many notes it shares with the items
    // already in the cart. The set of notes is gathered across every cart
    // item (Vency lookup by id; entries we can't resolve simply contribute
    // nothing). Ties are broken randomly so the rail still feels alive.
    var cartNotes = {};
    Object.keys(inCartIds).forEach(function (id) {
      var frag = catalog.find(function (f) { return f.id === id; });
      if (frag && Array.isArray(frag.notes)) {
        frag.notes.forEach(function (n) { cartNotes[n] = true; });
      }
    });

    var ranked;
    if (Object.keys(cartNotes).length === 0) {
      // Cart is empty or items have no resolvable notes → keep it random.
      ranked = candidates.slice().sort(function () { return 0.5 - Math.random(); });
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
      '<div class="cart-drawer__upsell-label">Completa con</div>' +
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
      cart.selection.push({ id: id, name: name });
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

  var escHtml = window.escHtml || function (s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  var cartTriggers = document.querySelectorAll('.js-cart-trigger');
  cartTriggers.forEach(function (t) { t.addEventListener('click', openCart); });

  var navCart = document.querySelector('.js-nav-cart');
  if (navCart) navCart.addEventListener('click', function (e) { e.preventDefault(); openCart(); });

  window.addEventListener('storage', function (e) {
    if (e.key === 'vency_cart_v1' && drawer.classList.contains('is-open')) renderCart();
  });
  document.addEventListener('visibilitychange', function () {
    if (drawer.classList.contains('is-open')) renderCart();
  });
  window.addEventListener('vency-cart-update', function () {
    if (drawer.classList.contains('is-open')) renderCart();
  });
  drawer.addEventListener('cart-render', renderCart);

})();
