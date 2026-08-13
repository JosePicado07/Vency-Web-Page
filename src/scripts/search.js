(function () {
  'use strict';

  var vencyCatalog = window.VENCY_CATALOG || [];
  var fullCatalog   = window.VENCY_FULL_CATALOG || [];
  if (!vencyCatalog.length && !fullCatalog.length) return;

  var overlay = document.querySelector('.js-search-overlay');
  var input   = overlay && overlay.querySelector('.js-search-input');
  var results = overlay && overlay.querySelector('.js-search-results');
  var hint    = overlay && overlay.querySelector('.js-search-hint');
  var close   = overlay && overlay.querySelector('.js-search-close');
  if (!overlay || !input || !results || !hint || !close) return;

  var escHtml = window.escHtml;
  var slugify = window.slugify || function (s) { return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''); };

  function normalize(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function firstNotes(raw, n) {
    var head = String(raw || '').split(/\.\s/)[0];
    return head.split(',').map(function (s) { return s.trim(); }).filter(Boolean).slice(0, n);
  }

  var categories = overlay.querySelector('.js-search-categories');

  // The whole catalog is searchable by name or brand: Vency's own line
  // (icon-series shown under their real inspiration name, plus creación
  // propia) and the full designer/nicho/ultra-nicho list. Missing either
  // source meant most of the catalog (everything but Vency's own line)
  // never showed up here even though it's all browsable in /catalogo.
  var allFrags = vencyCatalog.map(function (f) {
    var isIcon = f.category === 'icon-series' && f.inspiration;
    var displayName  = isIcon ? f.inspiration.name : f.name;
    var displayBrand = isIcon ? f.inspiration.brand : '';
    return {
      id: f.id,
      image: f.image,
      displayName: displayName,
      displayBrand: displayBrand,
      noteLabels: f.noteLabels || [],
      _search: normalize(f.name + ' ' + displayName + ' ' + displayBrand + ' ' + (f.noteLabels || []).join(' ') + ' ' + (f.narrative || ''))
    };
  }).concat(fullCatalog.map(function (f) {
    var notes = firstNotes(f.notes, 3);
    return {
      id: slugify((f.brand || '') + '-' + f.name),
      image: f.image || 'assets/images/default-bottle.jpg',
      displayName: f.name,
      displayBrand: f.brand || '',
      noteLabels: notes,
      _search: normalize(f.name + ' ' + (f.brand || '') + ' ' + (f.notes || ''))
    };
  }));

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
    var q = normalize(input.value.trim());
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
      var meta = f.displayBrand
        ? escHtml(f.displayBrand) + ' · ' + escHtml(f.noteLabels.slice(0, 2).join(' · '))
        : escHtml(f.noteLabels.slice(0, 3).join(' · '));
      return '<a href="catalogo.html#' + f.id + '" class="search-result" tabindex="0">' +
        '<img src="' + f.image + '" alt="" class="search-result__img" loading="lazy">' +
        '<span class="search-result__info">' +
          '<span class="search-result__name">' + escHtml(f.displayName) + '</span>' +
          '<span class="search-result__meta">' + meta + '</span>' +
        '</span>' +
      '</a>';
    }).join('');
    overlay.classList.add('has-results');
  }));

  var searchBtn = document.querySelector('.js-search-btn');
  if (searchBtn) searchBtn.addEventListener('click', openSearch);

})();
