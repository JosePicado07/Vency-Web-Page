(function () {
  'use strict';

  var catalog = window.VENCY_CATALOG;
  if (!catalog) return;

  var overlay = document.querySelector('.js-quiz-overlay');
  var modal   = overlay && overlay.querySelector('.js-quiz-modal');
  var close   = overlay && overlay.querySelector('.js-quiz-close');
  var steps   = overlay && overlay.querySelectorAll('.js-quiz-step');
  var backBtn = overlay && overlay.querySelector('.js-quiz-back');
  var nextBtn = overlay && overlay.querySelector('.js-quiz-next');
  var result  = overlay && overlay.querySelector('.js-quiz-result');
  var stepLabel = overlay && overlay.querySelector('.js-quiz-step-label');
  if (!overlay || !modal) return;

  var currentStep = 0;
  var answers = {};
  var totalSteps = steps ? steps.length : 0;

  function showStep(n) {
    steps.forEach(function (s, i) {
      s.classList.toggle('is-active', i === n);
    });
    if (stepLabel) stepLabel.textContent = 'PASO ' + (n + 1) + ' DE ' + totalSteps;
    if (backBtn) backBtn.disabled = n === 0;

    if (result) result.classList.remove('is-active');
    if (nextBtn) {
      if (n < totalSteps - 1) {
        nextBtn.textContent = 'SIGUIENTE';
        nextBtn.disabled = !answers[getStepKey(n)];
      } else {
        nextBtn.textContent = 'DESCUBRIR';
        nextBtn.disabled = !answers[getStepKey(n)];
      }
    }
  }

  function getStepKey(n) {
    var step = steps[n];
    if (!step) return '';
    return step.getAttribute('data-key') || 'step' + n;
  }

  function openQuiz() {
    currentStep = 0;
    answers = {};
    steps.forEach(function (s) {
      s.querySelectorAll('.quiz-opt').forEach(function (opt) {
        opt.classList.remove('is-selected');
        var radio = opt.querySelector('input[type="radio"]');
        if (radio) radio.checked = false;
      });
    });
    overlay.classList.add('is-open');
    if (result) result.classList.remove('is-active');
    showStep(0);
    document.body.style.overflow = 'hidden';
  }

  function closeQuiz() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  if (close) close.addEventListener('click', closeQuiz);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeQuiz();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeQuiz();
  });

  steps.forEach(function (step) {
    step.querySelectorAll('.quiz-opt input[type="radio"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        var opt = radio.closest('.quiz-opt');
        step.querySelectorAll('.quiz-opt').forEach(function (o) { o.classList.remove('is-selected'); });
        if (opt) opt.classList.add('is-selected');
        answers[step.getAttribute('data-key')] = radio.value;
        if (nextBtn && currentStep < totalSteps - 1) {
          nextBtn.disabled = false;
        } else if (nextBtn && currentStep === totalSteps - 1) {
          nextBtn.disabled = false;
        }
      });
    });
  });

  if (backBtn) {
    backBtn.addEventListener('click', function () {
      if (currentStep > 0) {
        currentStep--;
        showStep(currentStep);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      if (currentStep < totalSteps - 1) {
        currentStep++;
        showStep(currentStep);
      } else {
        showResults();
      }
    });
  }

  function showResults() {
    steps.forEach(function (s) { s.classList.remove('is-active'); });
    if (result) result.classList.add('is-active');
    if (stepLabel) stepLabel.textContent = 'TU RESULTADO';
    if (backBtn) backBtn.disabled = true;
    if (nextBtn) nextBtn.style.display = 'none';

    var mood   = answers['mood'] || '';
    var notes  = answers['notes'] || '';
    var occasion = answers['occasion'] || '';

    var scored = catalog.map(function (f) {
      var score = 0;
      if (occasion) {
        var ocas = (f.ocasionLabels || []).map(function (o) { return o.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); });
        var occ = occasion.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (ocas.indexOf(occ) !== -1) score += 2;
      }
      if (mood) {
        var cat = f.category || '';
        var m = mood.toLowerCase();
        if ((m === 'atrevido' || m === 'poderoso') && cat === 'icon-series') score += 2;
        if (m === 'elegante' && cat === 'original-blend') score += 2;
        if (m === 'casual') score += 1;
        if (m === 'natural') score += 1;
      }
      if (notes) {
        var noteLabels = (f.noteLabels || []).map(function (n) { return n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); });
        var ns = notes.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (noteLabels.indexOf(ns) !== -1) score += 3;
        var catNotes = (f.notes || []).map(function (n) { return n.toLowerCase(); });
        if (catNotes.indexOf(ns) !== -1) score += 3;
      }
      return { frag: f, score: score };
    });

    scored.sort(function (a, b) { return b.score - a.score; });
    var top = scored.slice(0, 3);

    result.innerHTML =
      '<h3 class="quiz-result__title">Perfecto para ti</h3>' +
      '<div class="quiz-result__items">' +
      top.map(function (r) {
        var f = r.frag;
        var url = 'coleccion.html#' + f.id;
        return '<a href="' + url + '" class="quiz-result__item">' +
          '<img src="' + f.image + '" alt="" class="quiz-result__item-img" loading="lazy">' +
          '<span>' +
            '<div class="quiz-result__item-name">' + escHtml(f.name) + '</div>' +
            '<div class="quiz-result__item-family">' + escHtml(f.category === 'original-blend' ? 'Original Blend' : 'Icon Series') + '</div>' +
          '</span>' +
          '<span class="quiz-result__item-cta">Ver fragancia →</span>' +
        '</a>';
      }).join('') +
      '</div>';
  }

  var escHtml = window.escHtml || function (s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  var trigger = document.querySelector('.js-quiz-trigger');
  if (trigger) trigger.addEventListener('click', openQuiz);

})();
