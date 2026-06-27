/**
 * Vency Atelier — Mobile navigation toggle
 * Hamburger open/close with keyboard and outside-click handling.
 */
(function () {
  'use strict';

  var nav    = document.querySelector('.nav');
  var toggle = document.querySelector('.nav__toggle');
  if (!toggle || !nav) return;

  function openMenu() {
    nav.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Cerrar menú');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', function () {
    nav.classList.contains('is-open') ? closeMenu() : openMenu();
  });

  /* ESC closes menu; Tab cycles focus within nav (focus trap) */
  document.addEventListener('keydown', function (e) {
    if (!nav.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      closeMenu();
      toggle.focus();
      return;
    }
    if (e.key === 'Tab') {
      var focusable = nav.querySelectorAll('a, button');
      var arr = Array.prototype.slice.call(focusable);
      var first = arr[0];
      var last = arr[arr.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
  });

  /* Click outside the nav closes menu */
  document.addEventListener('click', function (e) {
    if (nav.classList.contains('is-open') && !nav.contains(e.target)) {
      closeMenu();
    }
  });

  /* Clicking any nav link closes menu (covers anchor links on same page) */
  nav.querySelectorAll('.nav__link').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  /* ── Cart link with live count badge ──────────────────────────────────
     Injected from JS so every page gets it without editing 6 HTMLs.
     Hidden when cart is empty. Reads the same vency_cart_v1 key. */
  var navLinks = nav.querySelector('.nav__links');
  if (!navLinks || nav.querySelector('.js-nav-cart')) return; // already present

  var cartLi = document.createElement('li');
  cartLi.className = 'nav__cart-wrap';
  cartLi.innerHTML =
    '<a href="carrito.html" class="nav__link js-nav-cart" hidden aria-label="Ver carrito">' +
      'Carrito <span class="nav__cart-badge js-nav-cart-count">0</span>' +
    '</a>';
  navLinks.appendChild(cartLi);

  var cartLink  = cartLi.querySelector('.js-nav-cart');
  var cartCount = cartLi.querySelector('.js-nav-cart-count');

  function readCartCount() {
    try {
      var raw = localStorage.getItem('vency_cart_v1');
      if (!raw) return 0;
      var d = JSON.parse(raw);
      var dec = Array.isArray(d.selection) ? d.selection.length : 0;
      var bot = Array.isArray(d.bottles)
        ? d.bottles.reduce(function (s, b) { return s + (b.qty || 1); }, 0)
        : 0;
      return dec + bot;
    } catch (e) { return 0; }
  }

  function refreshCart() {
    var n = readCartCount();
    if (n > 0) {
      cartLink.hidden = false;
      cartCount.textContent = n;
    } else {
      cartLink.hidden = true;
    }
  }

  refreshCart();
  // React to cart updates from this tab (decants.js dispatches no event yet,
  // so we poll on visibility change + listen to storage events from other tabs).
  window.addEventListener('storage', function (e) {
    if (e.key === 'vency_cart_v1') refreshCart();
  });
  document.addEventListener('visibilitychange', refreshCart);
  // Light poll for same-tab updates (decants.js writes localStorage but no
  // 'storage' event fires for the writing tab — 1s tick is cheap).
  setInterval(refreshCart, 1000);

  cartLink.addEventListener('click', closeMenu);
})();
