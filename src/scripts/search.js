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
  allFrags.forEach(function (f) {
    // Icon-series entries display under their real inspiration name/brand in
    // the catalog, not the internal Vency codename: search must match that.
    var isIcon = f.category === 'icon-series' && f.inspiration;
    f._displayName = isIcon ? f.inspiration.name : f.name;
    f._displayBrand = isIcon ? f.inspiration.brand : '';
    f._search = (f.name + ' ' + f._displayName + ' ' + f._displayBrand + ' ' + (f.noteLabels||[]).join(' ') + ' ' + (f.narrative||'')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  });

  // Fragrances hidden from the catalog (archived, permanently deleted, or
  // manually marked unavailable) must also be hidden from search: otherwise
  // stale results show up and lead nowhere (their card no longer exists).
  var _hidden = new Set();
  Promise.all([
    fetch('/api/catalog-archive').then(function (r) { return r.json(); }).catch(function () { return {}; }),
    fetch('/api/availability').then(function (r) { return r.json(); }).catch(function () { return {}; })
  ]).then(function (results) {
    (results[0].archived || []).forEach(function (id) { _hidden.add(id); });
    (results[0].deleted || []).forEach(function (id) { _hidden.add(id); });
    (results[1].unavailable || []).forEach(function (id) { _hidden.add(id); });
  });

  function getFocusable(el) {
    return el.querySelectorAll('a[href], button, input, [tabindex]:not([tabindex="-1"])');
  }

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
    if (e.key === 'Tab' && overlay.classList.contains('is-open')) {
      var focusable = getFocusable(overlay);
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
  });

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeSearch();
  });

  function debounce(fn, ms) {
    var t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  input.addEventListener('input', debounce(function () {
    var q = input.value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (q.length < 1) {
      overlay.classList.remove('has-results');
      if (categories) categories.hidden = false;
      return;
    }
    if (categories) categories.hidden = true;

    var matched = allFrags.filter(function (f) {
      return f._search.indexOf(q) !== -1 && !_hidden.has(f.id);
    });

    if (matched.length === 0) {
      hint.textContent = 'No encontramos fragancias con "' + q + '"';
      overlay.classList.remove('has-results');
      return;
    }

    hint.textContent = '';
    results.innerHTML = matched.map(function (f) {
      var meta = f._displayBrand
        ? escHtml(f._displayBrand) + ' · ' + escHtml(f.noteLabels.slice(0, 2).join(' · '))
        : escHtml(f.noteLabels.slice(0, 3).join(' · '));
      return '<a href="catalogo.html#' + f.id + '" class="search-result" tabindex="0">' +
        '<img src="' + f.image + '" alt="" class="search-result__img" loading="lazy">' +
        '<span class="search-result__info">' +
          '<span class="search-result__name">' + escHtml(f._displayName) + '</span>' +
          '<span class="search-result__meta">' + meta + '</span>' +
        '</span>' +
      '</a>';
    }).join('');
    overlay.classList.add('has-results');
  }));

  var escHtml = window.escHtml;

  var searchBtn = document.querySelector('.js-search-btn');
  if (searchBtn) searchBtn.addEventListener('click', openSearch);

})();
