(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Scroll-driven entrances */
  if (reduced) {
    document.querySelectorAll('.animate-in').forEach(function (el) {
      el.classList.add('visible');
    });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -48px 0px' }
    );
    document.querySelectorAll('.animate-in').forEach(function (el) {
      observer.observe(el);
    });
  }

  /* Nav scroll state — backdrop appears when past hero */
  var navEl = document.querySelector('.nav');
  if (navEl) {
    function onNavScroll() {
      navEl.classList.toggle('nav--scrolled', window.scrollY > 60);
    }
    window.addEventListener('scroll', onNavScroll, { passive: true });
    onNavScroll();
  }

  /* Back-to-top */
  var btn = document.querySelector('.js-to-top');
  if (btn) {
    function onScroll() {
      btn.classList.toggle('is-visible', window.scrollY > 600);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
  }
})();
