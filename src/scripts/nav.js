/**
 * Vency Atelier — Navigation
 * Hamburger toggle, Shop accordion, injected search/cart.
 */
(function () {
  'use strict';

  var nav    = document.querySelector('.nav');
  var toggle = document.querySelector('.nav__toggle');
  if (!toggle || !nav) return;

  var links = nav.querySelector('.nav__links');

  function setLinksHeight(open) {
    if (!links) return;
    if (open) {
      links.style.height = links.scrollHeight + 'px';
    } else {
      links.style.height = '0';
    }
  }

  function openMenu() {
    nav.classList.add('is-open');
    setLinksHeight(true);
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Cerrar menú');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    nav.classList.remove('is-open');
    setLinksHeight(false);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', function () {
    nav.classList.contains('is-open') ? closeMenu() : openMenu();
  });

  /* ── Shop accordions + outside click ─────────────────── */
  var shopToggle = document.querySelector('.js-shop-toggle');
  var shopMenu   = document.getElementById('shop-submenu');

  document.addEventListener('click', function (e) {
    /* toggle shop menus */
    var btn = e.target.closest('.js-shop-toggle, .js-hero-shop-toggle');
    if (btn) {
      e.preventDefault();
      var m = document.getElementById(btn.getAttribute('aria-controls'));
      if (!m) return;
      var isOpen = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!isOpen));
      m.classList.toggle('is-open');
      /* drive submenu height exactly; then re-measure nav links if mobile nav is open */
      if (m.classList.contains('nav__submenu')) {
        m.style.height = !isOpen ? m.scrollHeight + 'px' : '0';
        if (nav.classList.contains('is-open')) setLinksHeight(true);
      }
      return;
    }

    /* close hero shop on outside click */
    var heroShop = document.querySelector('.hero__shop-menu');
    if (heroShop && heroShop.classList.contains('is-open')) {
      var heroTrigger = document.querySelector('.hero__shop-trigger');
      if (heroTrigger && !heroTrigger.contains(e.target)) {
        heroShop.classList.remove('is-open');
        var heroBtn = document.querySelector('.js-hero-shop-toggle');
        if (heroBtn) heroBtn.setAttribute('aria-expanded', 'false');
      }
    }

    /* close nav shop on outside click */
    if (shopMenu && shopMenu.classList.contains('is-open')) {
      var shopItem = document.querySelector('.nav__item--shop');
      if (shopItem && !shopItem.contains(e.target)) {
        shopMenu.classList.remove('is-open');
        if (shopToggle) shopToggle.setAttribute('aria-expanded', 'false');
      }
    }

    /* close mobile nav on outside click */
    if (nav.classList.contains('is-open') && !nav.contains(e.target)) {
      closeMenu();
    }

    /* close menus on link click */
    if (e.target.closest('.hero__shop-link')) {
      var heroShopMenu = document.querySelector('.hero__shop-menu');
      if (heroShopMenu) heroShopMenu.classList.remove('is-open');
      var heroBtn = document.querySelector('.js-hero-shop-toggle');
      if (heroBtn) heroBtn.setAttribute('aria-expanded', 'false');
    }
    if (e.target.closest('.nav__link[href], .nav__sublink')) {
      closeMenu();
    }
  });

  /* ── Keyboard ────────────────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    var isNavOpen  = nav.classList.contains('is-open');
    var isHeroOpen = document.querySelector('.hero__shop-menu')?.classList.contains('is-open');
    var isShopOpen = shopMenu?.classList.contains('is-open');
    if (!isNavOpen && !isHeroOpen && !isShopOpen) return;
    if (e.key === 'Escape') {
      if (isNavOpen) closeMenu();
      if (shopMenu) shopMenu.classList.remove('is-open');
      if (shopToggle) shopToggle.setAttribute('aria-expanded', 'false');
      var heroShop = document.querySelector('.hero__shop-menu');
      if (heroShop) heroShop.classList.remove('is-open');
      var heroBtn = document.querySelector('.js-hero-shop-toggle');
      if (heroBtn) heroBtn.setAttribute('aria-expanded', 'false');
      if (isNavOpen) toggle.focus();
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

  /* ── Injected nav items (search + cart) ──────────────── */
  var navLinks = nav.querySelector('.nav__links');
  if (!navLinks) return;

  if (!nav.querySelector('.js-search-btn') && !nav.querySelector('.js-nav-cart')) {
    /* ── Search trigger ─── */
    var searchLi = document.createElement('li');
    searchLi.innerHTML =
      '<button class="nav__search-btn js-search-btn" type="button" aria-label="Buscar fragancias">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>' +
        '</svg>' +
      '</button>';
    navLinks.appendChild(searchLi);

    /* ── Cart link with live count badge ─── */
    var cartLi = document.createElement('li');
    cartLi.className = 'nav__cart-wrap';
    var onCarritoPage = document.body.classList.contains('page-carrito');
    cartLi.innerHTML = onCarritoPage
      ? '<a href="carrito.html" class="nav__link js-nav-cart" aria-label="Ver carrito">' +
          'Carrito <span class="nav__cart-badge js-nav-cart-count" hidden>0</span>' +
        '</a>'
      : '<a href="#" class="nav__link js-nav-cart js-cart-trigger" aria-label="Ver carrito">' +
          'Carrito <span class="nav__cart-badge js-nav-cart-count" hidden>0</span>' +
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
      cartCount.hidden = n === 0;
      if (n > 0) cartCount.textContent = n;
    }

    refreshCart();
    window.addEventListener('storage', function (e) {
      if (e.key === 'vency_cart_v1') refreshCart();
    });
    document.addEventListener('visibilitychange', refreshCart);
    window.addEventListener('vency-cart-update', refreshCart);


    cartLink.addEventListener('click', closeMenu);
  }
})();
