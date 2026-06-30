(function () {
  'use strict';

  var overlay = document.querySelector('.js-quiz-overlay');
  var modal   = overlay && overlay.querySelector('.js-quiz-modal');
  if (!overlay || !modal) return;
  var bodyEl = modal.querySelector('.js-quiz-body');
  if (!bodyEl) return;

  var currentStep = 0;
  var answers     = {};

  var QUESTIONS = [
    {
      q: '¿Qué sensación querés que tu fragancia te transmita?',
      options: [
        { value: 'fresco',   label: 'Energía y frescura',    desc: 'Cítricos, verdes, acuáticos' },
        { value: 'calido',   label: 'Calidez y confort',     desc: 'Vainilla, ámbar, especias' },
        { value: 'elegante', label: 'Elegancia y misterio',  desc: 'Maderas, cuero, incienso' },
        { value: 'delicado', label: 'Delicadeza y suavidad', desc: 'Florales, atalcados, suaves' },
      ]
    },
    {
      q: '¿Qué tipo de notas te atraen más?',
      options: [
        { value: 'citrico',   label: 'Cítricos',  desc: 'Limón, naranja, bergamota, pomelo' },
        { value: 'floral',    label: 'Flores',    desc: 'Rosa, jazmín, lavanda, lirio' },
        { value: 'especiado', label: 'Especias',  desc: 'Canela, cardamomo, pimienta, azafrán' },
        { value: 'amaderado', label: 'Maderas',   desc: 'Sándalo, cedro, oud, pachulí' },
      ]
    },
    {
      q: '¿En qué momento pensás usar la fragancia?',
      options: [
        { value: 'dia',       label: 'De día',               desc: 'Para el trabajo, el día a día' },
        { value: 'noche',     label: 'De noche',             desc: 'Salidas, cenas, eventos' },
        { value: 'cualquier', label: 'Cualquier momento',    desc: 'Una fragancia versátil' },
        { value: 'especial',  label: 'Ocasiones especiales', desc: 'Algo único y memorable' },
      ]
    },
    {
      q: '¿Qué intensidad preferís?',
      options: [
        { value: 'sutil',    label: 'Sutil y cercana',        desc: 'Que se note al abrazar' },
        { value: 'moderada', label: 'Moderada',               desc: 'Que se note al saludar' },
        { value: 'fuerte',   label: 'Fuerte y con presencia', desc: 'Que se note al entrar' },
      ]
    },
  ];

  var RESULTS = {
    fresco: {
      title: 'Perfil Fresco y Vibrante',
      desc: 'Preferís fragancias limpias, energéticas y revitalizantes. Las notas cítricas, acuáticas y verdes son tu estilo. Ideales para climas cálidos y uso diurno.',
      familias: 'Cítrica · Fresca · Aromática',
      recs: ['citrus-enigma', 'citrus-melody', 'citrus-nirvana', 'fresh-coast']
    },
    calido: {
      title: 'Perfil Cálido y Envolvente',
      desc: 'Te atraen las fragancias dulces, cremosas y reconfortantes. Vainilla, ámbar, especias y gourmand te definen. Perfectas para la noche y climas frescos.',
      familias: 'Oriental · Gourmand · Especiada',
      recs: ['apple-whisper', 'after-effect', 'crush-effect', 'fireside-memory']
    },
    elegante: {
      title: 'Perfil Sofisticado y Enigmático',
      desc: 'Buscás profundidad, carácter y distinción. Las maderas nobles, el cuero, el incienso y el oud son tu territorio. Fragancias con personalidad y estela.',
      familias: 'Amaderada · Oriental · Cuero',
      recs: ['dark-sinner', 'absolu-authority', 'fresh-signature', 'exotic-contrast']
    },
    delicado: {
      title: 'Perfil Floral y Refinado',
      desc: 'Las flores te hablan. Preferís composiciones elegantes y suaves. Rosas, jazmines, lirios y violetas son tus aliados olfativos.',
      familias: 'Floral · Atalcada · Verde',
      recs: ['dream-trap', 'vency-rouge', 'cherry-desire', 'aurum-mirage']
    },
  };

  var BACK_ICON = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7"/></svg>';

  function getResult() {
    var counts = {};
    Object.keys(answers).forEach(function (k) {
      var v = answers[k];
      counts[v] = (counts[v] || 0) + 1;
    });
    var max = 0, top = 'fresco';
    Object.keys(counts).forEach(function (v) {
      if (counts[v] > max) { max = counts[v]; top = v; }
    });
    return RESULTS[top] || RESULTS.fresco;
  }

  function getRecFrags(ids) {
    var catalog = window.VENCY_CATALOG || [];
    var out = [];
    ids.forEach(function (id) {
      for (var i = 0; i < catalog.length; i++) {
        if (catalog[i].id === id) { out.push(catalog[i]); break; }
      }
    });
    return out;
  }

  function esc(s) {
    return (window.escHtml || function (x) { return x; })(s);
  }

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function transitionStep(fn) {
    if (reducedMotion) { fn(); return; }
    bodyEl.classList.add('is-exit');
    setTimeout(function () {
      bodyEl.classList.remove('is-exit');
      bodyEl.classList.add('is-enter');
      fn();
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          bodyEl.classList.remove('is-enter');
        });
      });
    }, 180);
  }

  function renderStep() {
    if (currentStep >= QUESTIONS.length) { showResult(); return; }
    var q = QUESTIONS[currentStep];

    var backHtml = currentStep > 0
      ? '<button class="quiz-back js-quiz-back" type="button" aria-label="Pregunta anterior">'
          + BACK_ICON + ' Anterior'
        + '</button>'
      : '';

    var optHtml = '';
    q.options.forEach(function (opt) {
      optHtml +=
        '<button class="quiz-option js-quiz-opt" type="button" data-value="' + opt.value + '">'
          + '<span class="quiz-option__dot" aria-hidden="true"></span>'
          + '<span class="quiz-option__text">'
            + '<span class="quiz-option__label">' + esc(opt.label) + '</span>'
            + '<span class="quiz-option__desc">' + esc(opt.desc) + '</span>'
          + '</span>'
        + '</button>';
    });

    bodyEl.innerHTML =
      '<div class="quiz-step">'
        + backHtml
        + '<p class="quiz-counter">PASO ' + (currentStep + 1) + ' · ' + QUESTIONS.length + '</p>'
        + '<h3 class="quiz-question">' + esc(q.q) + '</h3>'
        + '<div class="quiz-options" role="group" aria-label="' + esc(q.q) + '">'
          + optHtml
        + '</div>'
      + '</div>';
  }

  function showResult() {
    var r    = getResult();
    var recs = getRecFrags(r.recs || []).slice(0, 4);

    var recsHtml = '';
    if (recs.length) {
      var items = recs.map(function (f) {
        var thumb = (f.image || '').replace(/^(.*\/)([^/]+)\.(?:png|jpe?g)$/i, '$1_webp/$2-400.webp');
        return '<a href="catalogo.html#' + f.id + '" class="quiz-rec">'
          + '<img src="' + thumb + '" alt="' + esc(f.name) + '" class="quiz-rec__img" loading="lazy">'
          + '<span class="quiz-rec__name">' + esc(f.name) + '</span>'
        + '</a>';
      }).join('');
      recsHtml =
        '<div class="quiz-recs">'
          + '<p class="quiz-recs__label">Para vos</p>'
          + '<div class="quiz-recs__strip">' + items + '</div>'
        + '</div>';
    }

    bodyEl.innerHTML =
      '<div class="quiz-step quiz-step--result">'
        + '<p class="quiz-counter">Tu perfil olfativo</p>'
        + '<h3 class="quiz-result__title">' + esc(r.title) + '</h3>'
        + '<hr class="quiz-result__divider" aria-hidden="true">'
        + '<p class="quiz-result__desc">' + esc(r.desc) + '</p>'
        + '<p class="quiz-result__familias">' + esc(r.familias) + '</p>'
        + recsHtml
        + '<a href="catalogo.html" class="quiz-result__cta">Explorar en la tienda</a>'
        + '<button class="quiz-result__restart js-quiz-restart" type="button">Volver a empezar</button>'
      + '</div>';
  }

  function openQuiz() {
    currentStep = 0;
    answers = {};
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    renderStep();
    setTimeout(function () {
      var first = bodyEl.querySelector('.js-quiz-opt, .js-quiz-back');
      if (first) first.focus();
    }, 60);
  }

  function closeQuiz() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    var trigger = document.querySelector('.js-quiz-trigger');
    if (trigger) trigger.focus();
  }

  if (location.hash === '#quiz') openQuiz();

  var trigger = document.querySelector('.js-quiz-trigger');
  if (trigger) trigger.addEventListener('click', function (e) { e.preventDefault(); openQuiz(); });

  var closeBtn = modal.querySelector('.js-quiz-close');
  if (closeBtn) closeBtn.addEventListener('click', closeQuiz);

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeQuiz();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeQuiz();
  });

  modal.addEventListener('click', function (e) {
    var opt = e.target.closest('.js-quiz-opt');
    if (opt) {
      modal.querySelectorAll('.js-quiz-opt').forEach(function (o) {
        o.style.pointerEvents = 'none';
      });
      opt.classList.add('is-selected');
      answers[currentStep] = opt.dataset.value;
      setTimeout(function () {
        currentStep++;
        transitionStep(renderStep);
      }, 220);
      return;
    }

    var back = e.target.closest('.js-quiz-back');
    if (back && currentStep > 0) {
      currentStep--;
      transitionStep(renderStep);
      return;
    }

    var restart = e.target.closest('.js-quiz-restart');
    if (restart) {
      currentStep = 0;
      answers = {};
      transitionStep(renderStep);
    }
  });
})();
