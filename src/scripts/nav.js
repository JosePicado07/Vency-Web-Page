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
})();
