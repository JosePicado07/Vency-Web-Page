(function () {
  'use strict';

  var catalog   = window.VENCY_FULL_CATALOG || [];
  var filters   = { cat: 'todos', gender: 'todos', q: '', ocasion: 'todos' };

  var BATCH_SIZE    = 30;
  var revealedCount = 0;
  var passingEntries = [];

  var countEl   = document.querySelector('.js-cat-count');
  var emptyEl   = document.querySelector('.cat-empty');
  var sentinel  = document.getElementById('cat-sentinel');
  var sentinelObserver = null;

  /* ── Helpers ─────────────────────────────────────────── */
  function slug(str) {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Entrance: rows reveal in waves as they enter the viewport.
     CSS holds the pre-state (only under prefers-reduced-motion: no-preference). */
  var rowObserver = ('IntersectionObserver' in window)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-in');
          rowObserver.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px -40px 0px', threshold: 0.04 })
    : null;

  function observeRow(el) {
    if (rowObserver) rowObserver.observe(el);
    else el.classList.add('is-in');
  }

  /* Format rail: set toggle (left) + buy-bottle zone (right).
     Two distinct zones so "add to set" and "buy a frasco" don't collide. */
  function buildRail(dataName, ariaName, isInv) {
    return '<div class="fmt-rail' + (isInv ? ' fmt-rail--inv' : '') + '" data-fragrance-name="' + dataName + '">' +
        '<button class="fmt-rail__set dblock__trigger" aria-pressed="false" aria-label="Agregar ' + ariaName + ' al Set de 3 Decants">' +
          '<span class="fmt-rail__set-mark" aria-hidden="true"></span>' +
          '<span class="fmt-rail__set-main">' +
            '<span class="fmt-rail__set-title">Añadir al set</span>' +
            '<span class="fmt-rail__set-meta">Decant 10 ml · ₡5.000</span>' +
            '<span class="fmt-rail__hint js-set-hint" hidden></span>' +
          '</span>' +
        '</button>' +
        '<div class="fmt-rail__buy">' +
          '<span class="fmt-rail__buy-label">o frasco</span>' +
          '<button class="fmt-rail__btn fmt-rail__buy-btn" data-fmt="30ml" aria-pressed="false">' +
            '<span class="fmt-rail__label">30 ML</span>' +
            '<span class="fmt-rail__price">₡12.000</span>' +
          '</button>' +
          '<button class="fmt-rail__btn fmt-rail__buy-btn" data-fmt="100ml" aria-pressed="false">' +
            '<span class="fmt-rail__label">100 ML</span>' +
            '<span class="fmt-rail__price">₡20.000</span>' +
          '</button>' +
        '</div>' +
      '</div>';
  }

  /* ── Vency compact section (originals + icon series) ── */
  function buildVencySection() {
    var container = document.getElementById('vency-compact-entries');
    if (!container) return;
    var vencyCatalog = window.VENCY_CATALOG || [];
    if (!vencyCatalog.length) return;

    /* Same row template as the designer/nicho catalog (.cat-entry),
       with a small badge to mark Vency originals vs Icon Series. */
    var html = '<ul class="cat-brand__list">';
    vencyCatalog.forEach(function (frag) {
      var isIcon    = frag.category === 'icon-series';
      var badgeText = isIcon ? 'ICON' : 'VENCY';
      var badgeClass = isIcon ? 'cat-badge--icon' : 'cat-badge--original';
      var notes     = frag.noteLabels.join(' · ');
      var searchStr = (frag.name + ' ' + frag.notes.join(' ')).toLowerCase();
      var ocasion   = frag.ocasion.join(' ');
      var fname     = escHtml(frag.name);

      var inspoLine = (isIcon && frag.inspiration)
        ? '<span class="vency-compact__ref">· ' + escHtml(frag.inspiration.name) + ' · ' + escHtml(frag.inspiration.brand) + '</span> '
        : '';

      var soldOut = !!frag.soldOut;
      var railHtmlVency = soldOut
        ? '<div class="fmt-rail fmt-rail--sold-out"><span class="fmt-rail__sold-label">AGOTADO</span></div>'
        : buildRail(fname, fname, false);

      html +=
        '<li class="cat-entry cat-entry--vency"' +
          ' id="' + frag.id + '"' +
          ' data-fragrance-id="' + frag.id + '"' +
          ' data-fragrance-name="' + fname + '"' +
          ' data-search="' + escHtml(searchStr) + '"' +
          ' data-ocasion="' + ocasion + '"' +
          (soldOut ? ' data-sold-out="true"' : '') + '>' +
          '<div class="cat-entry__info">' +
            '<p class="cat-entry__name">' +
              '<span class="cat-badge ' + badgeClass + '">' + badgeText + '</span>' +
              (soldOut ? '<span class="cat-badge cat-badge--sold-out">AGOTADO</span>' : '') +
              fname +
            '</p>' +
            '<p class="cat-entry__notes">' + escHtml(notes) + ' ' + inspoLine +
              '<a class="vency-compact__story" href="coleccion.html#' + frag.id + '">— historia</a>' +
            '</p>' +
          '</div>' +
          railHtmlVency +
        '</li>';
    });
    html += '</ul>';

    container.innerHTML = html;
    container.querySelectorAll('.cat-entry').forEach(observeRow);
  }

  /* ── Build DOM ───────────────────────────────────────── */
  var SECTIONS = [
    { cat: 'disenador',   el: 'disenador',   title: 'Diseñador',   desc: 'Grandes casas de diseño · interpretaciones propias' },
    { cat: 'nicho',       el: 'nicho',        title: 'Nicho',       desc: 'Perfumería de autor · sin compromiso' },
    { cat: 'ultra-nicho', el: 'ultra-nicho',  title: 'Ultra Nicho', desc: 'Composiciones de coleccionista' },
  ];

  function buildSections() {
    var container = document.getElementById('cat-content');
    if (!container) return;

    SECTIONS.forEach(function (sec) {
      var brands = {};
      catalog.forEach(function (item) {
        if (item.cat !== sec.cat) return;
        if (!brands[item.brand]) brands[item.brand] = [];
        brands[item.brand].push(item);
      });

      var brandNames = Object.keys(brands);
      if (!brandNames.length) return;

      var section = document.createElement('section');
      section.className = 'cat-section cat-section--' + sec.el;
      section.dataset.cat = sec.cat;

      var hdr = document.createElement('div');
      hdr.className = 'cat-section__header';
      hdr.innerHTML = '<h2 class="cat-section__title">' + sec.title + '</h2>'
        + (sec.desc ? '<p class="cat-section__desc">' + sec.desc + '</p>' : '');
      section.appendChild(hdr);

      brandNames.forEach(function (brand) {
        var group = document.createElement('div');
        group.className = 'cat-brand';
        group.dataset.brand = slug(brand);

        /* Skip the heading when the entry has no brand (avoids an empty <h3>) */
        if (brand) {
          var bName = document.createElement('h3');
          bName.className = 'cat-brand__name';
          bName.textContent = brand;
          group.appendChild(bName);
        }

        var list = document.createElement('ul');
        list.className = 'cat-brand__list';

        brands[brand].forEach(function (item) {
          var li = document.createElement('li');
          li.className = 'cat-entry';
          li.dataset.cat    = item.cat;
          li.dataset.gender = item.gender;

          var interp = item.vencyInterpretation;
          var isInv = sec.cat === 'ultra-nicho';
          var genderLabel = {mujer:'Mujer',hombre:'Hombre',unisex:'Unisex'}[item.gender] || item.gender;

          var displayName  = interp ? interp.name : item.name;
          var fragranceName = interp ? escHtml(interp.name) : escHtml(item.brand) + ' · ' + escHtml(item.name);

          li.dataset.fragranceId   = interp ? interp.id : slug(item.brand + '-' + item.name);
          li.dataset.fragranceName = interp ? interp.name : item.brand + ' · ' + item.name;
          li.dataset.search        = (item.name + ' ' + item.brand + (interp ? ' ' + interp.name : '')).toLowerCase();
          if (item.soldOut) li.dataset.soldOut = 'true';

          var inspoPart = interp
            ? ' <span class="vency-compact__ref">· ' + escHtml(item.name) + ' · ' + escHtml(item.brand) + '</span>' +
              ' <a class="vency-compact__story" href="coleccion.html#' + interp.id + '">— historia</a>'
            : '';

          var notesHtml = (item.notes || interp)
            ? '<p class="cat-entry__notes">' + (item.notes ? escHtml(item.notes) : '') + inspoPart + '</p>'
            : '';

          var itemSoldOut = !!item.soldOut;
          var railHtml = itemSoldOut
            ? '<div class="fmt-rail fmt-rail--sold-out"><span class="fmt-rail__sold-label">AGOTADO</span></div>'
            : buildRail(fragranceName, escHtml(item.name), isInv);

          li.innerHTML =
            '<div class="cat-entry__info">' +
              '<p class="cat-entry__name">' +
                '<span class="cat-entry__gender-dot" aria-hidden="true"></span>' +
                '<span class="sr-only">' + escHtml(genderLabel) + '</span>' +
                escHtml(displayName) +
              '</p>' +
              notesHtml +
            '</div>' +
            railHtml;

          list.appendChild(li);
        });

        group.appendChild(list);
        section.appendChild(group);
      });

      container.appendChild(section);
    });
  }

  /* ── Infinite scroll ─────────────────────────────────── */
  function revealBatch() {
    var next = passingEntries.slice(revealedCount, revealedCount + BATCH_SIZE);
    next.forEach(function (e) { e.classList.remove('cat-entry--hidden'); observeRow(e); });
    revealedCount += next.length;
    updateExternalSectionVisibility();
    if (sentinel) sentinel.hidden = (revealedCount >= passingEntries.length);
  }

  function updateExternalSectionVisibility() {
    document.querySelectorAll('.cat-section:not(.cat-section--vency)').forEach(function (sec) {
      var secCat   = sec.dataset.cat;
      var catMatch = (filters.cat === 'todos' || filters.cat === secCat);
      var secTotal = 0;
      sec.querySelectorAll('.cat-brand').forEach(function (brand) {
        var brandVisible = 0;
        brand.querySelectorAll('.cat-entry').forEach(function (e) {
          if (!e.classList.contains('cat-entry--hidden')) { brandVisible++; secTotal++; }
        });
        brand.classList.toggle('cat-brand--hidden', brandVisible === 0 || !catMatch);
      });
      sec.style.display = (catMatch && secTotal > 0) ? '' : 'none';
    });
  }

  function setupSentinelObserver() {
    if (sentinelObserver) sentinelObserver.disconnect();
    if (!sentinel) return;
    sentinelObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && revealedCount < passingEntries.length && !window._catScrollLock) {
        revealBatch();
      }
    }, { rootMargin: '300px' });
    sentinelObserver.observe(sentinel);
  }

  /* ── Filter + render ─────────────────────────────────── */
  function render() {
    passingEntries = [];
    document.querySelectorAll('.cat-section:not(.cat-section--vency) .cat-entry').forEach(function (entry) {
      var sec      = entry.closest('.cat-section');
      var secCat   = sec ? sec.dataset.cat : '';
      var catMatch = (filters.cat === 'todos' || filters.cat === secCat);
      var gMatch   = (filters.gender === 'todos' || entry.dataset.gender === filters.gender);
      var qMatch   = !filters.q || entry.dataset.search.indexOf(filters.q) !== -1;
      entry.classList.add('cat-entry--hidden');
      if (catMatch && gMatch && qMatch) passingEntries.push(entry);
    });

    revealedCount = 0;
    revealBatch();
    setupSentinelObserver();

    /* === Vency originals === */
    var vencySection = document.querySelector('.cat-section--vency');
    var vencyVisible = 0;
    document.querySelectorAll('.cat-entry--vency[data-search]').forEach(function (entry) {
      var catMatch     = (filters.cat === 'todos' || filters.cat === 'vency');
      var qMatch       = !filters.q || entry.dataset.search.indexOf(filters.q) !== -1;
      var ocasionMatch = (filters.ocasion === 'todos' ||
        (entry.dataset.ocasion && entry.dataset.ocasion.indexOf(filters.ocasion) !== -1));
      var show = catMatch && qMatch && ocasionMatch;
      entry.style.display = show ? '' : 'none';
      if (show) vencyVisible++;
    });
    if (vencySection) vencySection.style.display = vencyVisible > 0 ? '' : 'none';

    /* === Count + empty === */
    var grandTotal = passingEntries.length + vencyVisible;
    if (countEl) countEl.textContent = grandTotal + (grandTotal === 1 ? ' fragancia' : ' fragancias');
    if (emptyEl) {
      emptyEl.classList.toggle('is-visible', grandTotal === 0);
      emptyEl.setAttribute('aria-hidden', String(grandTotal !== 0));
    }
  }

  function applyFilters() {
    render();
  }

  /* ── Filter panel toggle ─────────────────────────────── */
  function wireFilterToggle() {
    var toggleBtn = document.querySelector('.js-filter-toggle');
    var panel     = document.getElementById('cat-filter-panel');
    if (!toggleBtn || !panel) return;

    toggleBtn.addEventListener('click', function () {
      var isOpen = !panel.hidden;
      panel.hidden = isOpen;
      toggleBtn.setAttribute('aria-expanded', String(!isOpen));
    });
  }

  function updateFilterBadge() {
    var badge     = document.querySelector('.js-filter-badge');
    var clearBtn  = document.querySelector('.js-filter-clear');
    var count = (filters.cat !== 'todos' ? 1 : 0)
              + (filters.gender !== 'todos' ? 1 : 0)
              + (filters.ocasion !== 'todos' ? 1 : 0);
    if (badge)    { badge.textContent = count > 0 ? count : ''; badge.hidden = count === 0; }
    if (clearBtn) { clearBtn.hidden = count === 0; }
  }

  function clearFilters() {
    filters.cat    = 'todos';
    filters.gender = 'todos';
    filters.ocasion = 'todos';
    document.querySelectorAll('.cat-pill[data-filter]').forEach(function (p) {
      var active = p.dataset.value === 'todos';
      p.classList.toggle('is-active', active);
      p.setAttribute('aria-pressed', String(active));
    });
    updateFilterBadge();
    applyFilters();
  }

  function wireClearBtn() {
    var btn = document.querySelector('.js-filter-clear');
    if (btn) btn.addEventListener('click', clearFilters);
  }

  /* ── Wire filter pills ───────────────────────────────── */
  function wirePills() {
    var panel     = document.getElementById('cat-filter-panel');
    var toggleBtn = document.querySelector('.js-filter-toggle');

    document.querySelectorAll('.cat-pill[data-filter]').forEach(function (pill) {
      pill.addEventListener('click', function () {
        var dim = pill.dataset.filter;
        var val = pill.dataset.value;
        filters[dim] = val;
        document.querySelectorAll('.cat-pill[data-filter="' + dim + '"]').forEach(function (p) {
          var active = p.dataset.value === val;
          p.classList.toggle('is-active', active);
          p.setAttribute('aria-pressed', String(active));
        });
        updateFilterBadge();
        applyFilters();
      });
    });
  }

  /* ── Wire search ─────────────────────────────────────── */
  function wireSearch() {
    var input = document.getElementById('cat-search');
    if (!input) return;
    input.addEventListener('input', function () {
      filters.q = input.value.trim().toLowerCase();
      applyFilters();
    });
  }

  /* ── Init ────────────────────────────────────────────── */
  buildVencySection();
  buildSections();
  wireFilterToggle();
  wirePills();
  wireClearBtn();
  wireSearch();
  applyFilters();

  if (location.hash) {
    setTimeout(function () {
      var el = document.getElementById(location.hash.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

})();
