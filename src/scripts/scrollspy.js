/**
 * Vency Atelier — Frag-nav scrollspy
 * Highlights the quick-nav link for the fragrance section currently in view.
 */
(function () {
  'use strict';

  var navLinks = document.querySelectorAll('.frag-nav__link');
  if (!navLinks.length) return;

  /* Build section → link map from each link's href */
  var entries = [];
  navLinks.forEach(function (link) {
    var id = link.getAttribute('href').replace('#', '');
    var section = document.getElementById(id);
    if (section) entries.push({ link: link, section: section });
  });

  if (!entries.length) return;

  function setActive(activeEntry) {
    entries.forEach(function (e) {
      var on = e === activeEntry;
      e.link.classList.toggle('frag-nav__link--active', on);
    });
  }

  /* On scroll: the "active" section is the last one whose top has
     passed the nav bar (≈ 80px). Iterating in DOM order means the
     last match is the one currently in view. */
  var navH = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--nav-h')
  ) * 16 || 72; /* fallback: 4.5rem × 16px = 72px */

  function onScroll() {
    var active = null;
    var threshold = navH + 40; /* a little below the nav + frag-nav bar */

    entries.forEach(function (e) {
      var top = e.section.getBoundingClientRect().top;
      if (top <= threshold) active = e;
    });

    setActive(active);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); /* run on page load in case page is refreshed mid-scroll */
})();
