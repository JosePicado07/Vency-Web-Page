/**
 * Vency Atelier — Collection carousel
 * Keyboard, touch/swipe, click navigation + autoplay. No dependencies.
 */
(function () {
  'use strict';

  var track       = document.getElementById('carousel-track');
  var prevBtn     = document.getElementById('carousel-prev');
  var nextBtn     = document.getElementById('carousel-next');
  var counter     = document.getElementById('carousel-counter');

  if (!track || !prevBtn || !nextBtn || !counter) return;

  var carousel    = track.closest('.carousel');
  var progressBar = carousel ? carousel.querySelector('.carousel__progress-bar') : null;
  var slides      = track.querySelectorAll('.carousel__slide');
  var total       = slides.length;
  var current     = 0;
  var reduced     = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var AUTOPLAY_MS   = 5500;
  var autoplayTimer = null;
  var paused        = false;

  function pad(n) { return String(n).padStart(2, '0'); }

  function goTo(index) {
    /* Wrap index so carousel loops infinitely */
    index = ((index % total) + total) % total;
    current = index;

    track.style.transform = 'translateX(-' + (current * 100) + '%)';
    counter.textContent   = pad(current + 1) + ' / ' + pad(total);

    slides.forEach(function (slide, i) {
      var active = i === current;
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      slide.querySelectorAll('a, button, input').forEach(function (el) {
        el.tabIndex = active ? 0 : -1;
      });
    });
  }

  /* ---- Autoplay ---- */

  function restartProgress() {
    if (!progressBar || reduced) return;
    progressBar.classList.remove('is-animating');
    void progressBar.offsetWidth; /* force reflow to restart CSS animation */
    progressBar.classList.add('is-animating');
  }

  function startAutoplay() {
    if (reduced || paused) return;
    clearInterval(autoplayTimer);
    restartProgress();
    autoplayTimer = setInterval(function () {
      goTo(current + 1);
      restartProgress();
    }, AUTOPLAY_MS);
  }

  function pauseAutoplay() {
    paused = true;
    clearInterval(autoplayTimer);
    autoplayTimer = null;
    if (progressBar) progressBar.classList.remove('is-animating');
  }

  function resumeAutoplay() {
    paused = false;
    startAutoplay();
  }

  /* ---- Controls ---- */

  prevBtn.addEventListener('click', function () { goTo(current - 1); startAutoplay(); });
  nextBtn.addEventListener('click', function () { goTo(current + 1); startAutoplay(); });

  carousel.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(current - 1); startAutoplay(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1); startAutoplay(); }
  });

  /* ---- Pause on hover / focus ---- */

  carousel.addEventListener('mouseenter', pauseAutoplay);
  carousel.addEventListener('mouseleave', resumeAutoplay);
  carousel.addEventListener('focusin',    pauseAutoplay);
  carousel.addEventListener('focusout',   function (e) {
    if (!carousel.contains(e.relatedTarget)) resumeAutoplay();
  });

  /* ---- Touch / swipe ---- */

  var touchStartX = 0;

  track.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
    pauseAutoplay();
  }, { passive: true });

  track.addEventListener('touchend', function (e) {
    var delta = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 48) goTo(delta > 0 ? current + 1 : current - 1);
    resumeAutoplay();
  }, { passive: true });

  /* ---- Init ---- */

  goTo(0);
  startAutoplay();

})();
