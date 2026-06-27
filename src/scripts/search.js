(function () {
  'use strict';

  var catalog = window.VENCY_CATALOG;
  if (!catalog) return;

  var overlay = document.querySelector('.js-search-overlay');
  var input   = overlay && overlay.querySelector('.js-search-input');
  var results = overlay && overlay.querySelector('.js-search-results');
  var hint    = overlay && overlay.querySelector('.js-search-hint');
  var close   = overlay && overlay.querySelector('.js-search-close');
  if (!overlay || !input || !results || !hint || !close) return;

  var categories = overlay.querySelector('.js-search-categories');
  var allFrags = catalog;

  function openSearch() {
    overlay.classList.add('is-open');
    input.value = '';
    results.innerHTML = '';
    overlay.classList.remove('has-results');
    if (categories) categories.hidden = false;
    input.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeSearch() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    if (categories) categories.hidden = false;
  }

  close.addEventListener('click', closeSearch);
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !overlay.classList.contains('is-open') && !e.ctrlKey && !e.metaKey) {
      var tag = e.target && e.target.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && !e.target.isContentEditable) {
        e.preventDefault();
        openSearch();
      }
    }
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
      closeSearch();
    }
  });

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeSearch();
  });

  input.addEventListener('input', function () {
    var q = input.value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (q.length < 1) {
      overlay.classList.remove('has-results');
      if (categories) categories.hidden = false;
      return;
    }
    if (categories) categories.hidden = true;

    var matched = allFrags.filter(function (f) {
      var name = f.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      var notes = (f.noteLabels || []).join(' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      var narrative = (f.narrative || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return name.indexOf(q) !== -1 || notes.indexOf(q) !== -1 || narrative.indexOf(q) !== -1;
    });

    if (matched.length === 0) {
      hint.textContent = 'No encontramos fragancias con "' + q + '"';
      overlay.classList.remove('has-results');
      return;
    }

    hint.textContent = '';
    results.innerHTML = matched.map(function (f) {
      return '<a href="coleccion.html#' + f.id + '" class="search-result" tabindex="0">' +
        '<img src="' + f.image + '" alt="" class="search-result__img" loading="lazy">' +
        '<span class="search-result__info">' +
          '<span class="search-result__name">' + escHtml(f.name) + '</span>' +
          '<span class="search-result__meta">' + escHtml(f.noteLabels.slice(0, 3).join(' · ')) + '</span>' +
        '</span>' +
      '</a>';
    }).join('');
    overlay.classList.add('has-results');
  });

  var escHtml = window.escHtml || function (s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  var searchBtn = document.querySelector('.js-search-btn');
  if (searchBtn) searchBtn.addEventListener('click', openSearch);

})();
