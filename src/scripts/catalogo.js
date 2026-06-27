(function () {
  'use strict';

  var catalog   = window.VENCY_FULL_CATALOG || [];
  var filters   = { cat: 'todos', gender: 'todos', q: '', ocasion: 'todos' };

  var countEl   = document.querySelector('.js-cat-count');
  var emptyEl   = document.querySelector('.cat-empty');

  /* ── Helpers ─────────────────────────────────────────── */
  function slug(str) {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  var escHtml = window.escHtml;

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
    if (!rowObserver) { el.classList.add('is-in'); return; }
    // Already in viewport — show immediately, no animation (avoids loading flash)
    if (el.getBoundingClientRect().top < window.innerHeight - 40) {
      el.classList.add('is-in');
    } else {
      rowObserver.observe(el);
    }
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
          '<span class="fmt-rail__buy-label">o frasco completo</span>' +
          '<button class="fmt-rail__btn fmt-rail__buy-btn" data-fmt="30ml" aria-pressed="false" aria-label="Comprar frasco 30 ml de ' + ariaName + ' por ₡12.000">' +
            '<span class="fmt-rail__label">Frasco · 30 ML</span>' +
            '<span class="fmt-rail__price">₡12.000</span>' +
          '</button>' +
          '<button class="fmt-rail__btn fmt-rail__buy-btn" data-fmt="100ml" aria-pressed="false" aria-label="Comprar frasco 100 ml de ' + ariaName + ' por ₡20.000">' +
            '<span class="fmt-rail__label">Frasco · 100 ML</span>' +
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

    // Load current inventory from localStorage (synced by admin).
    // ponytail: empty = "no data" = assume in-stock; admin sync is the only authority for sold-out.
    var inventoryStr = localStorage.getItem('vency_inventory');
    var inventory = inventoryStr ? JSON.parse(inventoryStr) : null;
    var hasInventory = inventory && Object.keys(inventory).length > 0;

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

      // Calculate soldOut dynamically from current inventory
      var dk = frag.id + ':decant';
      var bk30 = frag.id + ':30ml';
      var bk100 = frag.id + ':100ml';
      // Only sold-out when admin tracks this id (any key present) AND all formats are zero.
      // Untracked = unknown = assume in-stock.
      var tracked = hasInventory && ((dk in inventory) || (bk30 in inventory) || (bk100 in inventory));
      var soldOut = tracked && (!inventory[dk] || !inventory[dk].oil_ml)
                 && (!inventory[bk30] || !inventory[bk30].oil_ml)
                 && (!inventory[bk100] || !inventory[bk100].oil_ml);
      var railHtmlVency = soldOut
        ? '<div class="fmt-rail fmt-rail--sold-out"><span class="fmt-rail__sold-label">AGOTADO</span></div>'
        : buildRail(fname, fname, false);

      html +=
        '<li class="cat-entry cat-entry--vency' + (isIcon ? ' cat-entry--icon' : '') + '"' +
          ' id="' + frag.id + '"' +
          ' data-fragrance-id="' + frag.id + '"' +
          ' data-fragrance-name="' + fname + '"' +
          ' data-fragrance-cat="vency"' +
          ' data-fragrance-notes="' + escHtml(notes) + '"' +
          ' data-fragrance-img="' + escHtml(frag.image || '../assets/images/default-bottle.jpg') + '"' +
          ' data-search="' + escHtml(searchStr) + '"' +
          ' data-ocasion="' + ocasion + '"' +
          (soldOut ? ' data-sold-out="true"' : '') + '>' +
          '<div class="cat-entry__info">' +
            '<span class="cat-entry__provenance">' + (isIcon ? 'ICON SERIES' : 'VENCY ATELIER') + '</span>' +
            '<p class="cat-entry__name">' + fname + '</p>' +
            '<p class="cat-entry__notes">' + escHtml(notes) + '</p>' +
            (isIcon && frag.inspiration
              ? '<p class="cat-entry__inspo">' + escHtml(frag.inspiration.name) + ' · ' + escHtml(frag.inspiration.brand) + '</p>'
              : '') +
            '<div class="cat-entry__foot">' +
              '<a class="cat-entry__historia" href="coleccion.html#' + frag.id + '">historia →</a>' +
              '<button class="cat-entry__see" type="button" aria-haspopup="dialog" aria-label="Ver ficha de ' + fname + '">Ver →</button>' +
            '</div>' +
          '</div>' +
          railHtmlVency +
        '</li>';
    });
    html += '</ul>';

    container.innerHTML = html;
    container.querySelectorAll('.cat-entry').forEach(function (el, idx) {
      el.style.setProperty('--entry-delay', (Math.min(idx, 8) * 45) + 'ms');
      observeRow(el);
    });
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

    // Same inventory bridge as Vency entries — compute sold-out at render time
    // so the state is right on first paint (no late "AGOTADO popping in on scroll").
    var invStr = localStorage.getItem('vency_inventory');
    var inv = invStr ? JSON.parse(invStr) : null;
    var hasInv = inv && Object.keys(inv).length > 0;
    function isItemSoldOut(id) {
      if (!hasInv) return false;
      // Only mark sold-out when admin actually tracks this id (any key present)
      // AND every tracked format is zero. Untracked items (e.g. designer brands
      // that aren't in admin) stay in-stock — missing data is not sold-out.
      var dk = id + ':decant', bk30 = id + ':30ml', bk100 = id + ':100ml';
      var tracked = (dk in inv) || (bk30 in inv) || (bk100 in inv);
      if (!tracked) return false;
      return (!inv[dk]   || !inv[dk].oil_ml)
          && (!inv[bk30] || !inv[bk30].oil_ml)
          && (!inv[bk100]|| !inv[bk100].oil_ml);
    }

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

        brands[brand].forEach(function (item, itemIdx) {
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
          li.dataset.fragranceCat  = sec.cat;
          li.dataset.fragranceNotes = item.notes || '';
          li.dataset.fragranceImg  = interp
            ? '../assets/images/inspirations/' + interp.id + '.png'
            : '../assets/images/default-bottle.jpg';
          li.dataset.search        = (item.name + ' ' + item.brand + (interp ? ' ' + interp.name : '')).toLowerCase();
          if (item.soldOut) li.dataset.soldOut = 'true';

          var historiaHref = interp ? 'coleccion.html#' + interp.id : null;

          var notesHtml = item.notes
            ? '<p class="cat-entry__notes"><span class="sr-only">' + escHtml(genderLabel) + ' — </span>' + escHtml(item.notes) + '</p>'
            : '';

          var inspoHtml = interp
            ? '<p class="cat-entry__inspo">' + escHtml(item.name) + ' · ' + escHtml(item.brand) + '</p>'
            : '';

          var itemSoldOut = !!item.soldOut || isItemSoldOut(li.dataset.fragranceId);
          if (itemSoldOut) li.dataset.soldOut = 'true';
          var railHtml = itemSoldOut
            ? '<div class="fmt-rail fmt-rail--sold-out"><span class="fmt-rail__sold-label">AGOTADO</span></div>'
            : buildRail(fragranceName, escHtml(item.name), isInv);

          // Always show the foot — sold-out items still earn a "Ver →" so users
          // can read the fragrance's story even when there's no stock to buy.
          li.innerHTML =
            '<div class="cat-entry__info">' +
              '<span class="cat-entry__provenance">' + escHtml(sec.title.toUpperCase()) + '</span>' +
              '<p class="cat-entry__name">' + escHtml(displayName) + '</p>' +
              notesHtml +
              inspoHtml +
              '<div class="cat-entry__foot">' +
                (historiaHref ? '<a class="cat-entry__historia" href="' + historiaHref + '">historia →</a>' : '') +
                '<button class="cat-entry__see" type="button" aria-haspopup="dialog" aria-label="Ver ficha de ' + escHtml(displayName) + '">Ver →</button>' +
              '</div>' +
            '</div>' +
            railHtml;

          // Cap cascade at 8 entries — past that, the wait feels like lag not stagger.
          li.style.setProperty('--entry-delay', (Math.min(itemIdx, 8) * 45) + 'ms');
          list.appendChild(li);
        });

        group.appendChild(list);
        section.appendChild(group);
      });

      container.appendChild(section);
    });
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

  /* ── Filter + render ─────────────────────────────────── */
  function render() {
    // ponytail: no lazy reveal — all entries are already in DOM; pagination saved nothing.
    document.querySelectorAll('.cat-section:not(.cat-section--vency) .cat-entry').forEach(function (entry) {
      var sec      = entry.closest('.cat-section');
      var secCat   = sec ? sec.dataset.cat : '';
      var catMatch = (filters.cat === 'todos' || filters.cat === secCat);
      var gMatch   = (filters.gender === 'todos' || entry.dataset.gender === filters.gender);
      var qMatch   = !filters.q || entry.dataset.search.indexOf(filters.q) !== -1;
      var show = catMatch && gMatch && qMatch;
      entry.classList.toggle('cat-entry--hidden', !show);
      if (show) entry.classList.add('is-in');
    });
    updateExternalSectionVisibility();

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
    var externalVisible = document.querySelectorAll('.cat-section:not(.cat-section--vency) .cat-entry:not(.cat-entry--hidden)').length;
    var grandTotal = externalVisible + vencyVisible;
    if (countEl) countEl.textContent = grandTotal + (grandTotal === 1 ? ' fragancia' : ' fragancias');
    if (emptyEl) {
      emptyEl.classList.toggle('is-visible', grandTotal === 0);
      emptyEl.setAttribute('aria-hidden', String(grandTotal !== 0));
    }
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
    render();
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
        render();
      });
    });
  }

  /* ── Wire search ─────────────────────────────────────── */
  function wireSearch() {
    var input = document.getElementById('cat-search');
    if (!input) return;
    input.addEventListener('input', function () {
      filters.q = input.value.trim().toLowerCase();
      render();
    });
  }

  /* ── Fragrance detail panel ─────────────────────────── */
  function wireFragPanel() {
    var fpEl      = document.getElementById('js-fp');
    if (!fpEl) return;
    var fpSheet   = fpEl.querySelector('.fp__sheet');
    var fpClose   = document.getElementById('js-fp-close');
    var fpBackdrop = document.getElementById('js-fp-backdrop');
    var fpBadge   = document.getElementById('js-fp-badge');
    var fpName    = document.getElementById('js-fp-name');
    var fpNotes   = document.getElementById('js-fp-notes');
    var fpBottles = document.getElementById('js-fp-bottles');
    var fpNudge   = document.getElementById('js-fp-nudge');
    var fpOrder   = document.getElementById('js-fp-order');

    var activeId = null;
    var preOpenSnap = null;
    var triggerEl  = null; // trigger that opened the panel — focus returns here on close

    // Focus trap: while the panel is open, Tab cycles within the sheet only.
    function trapTab(e) {
      if (e.key !== 'Tab' || fpEl.hidden) return;
      var focusables = fpSheet.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      var first = focusables[0];
      var last  = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    function syncCtrl(fmt, qty) {
      var ctrl = document.getElementById('js-fp-ctrl-' + fmt);
      if (!ctrl) return;
      ctrl.classList.toggle('is-zero', qty === 0);
      var qtyEl = ctrl.querySelector('.fp__step-qty');
      if (qtyEl) qtyEl.textContent = qty;
      ctrl.querySelector('.fp__stepper').setAttribute('aria-hidden', String(qty === 0));
    }

    function syncPanelState() {
      if (!activeId) return;
      var vc = window.vencyCart;

      var dQty = vc ? vc.getDecantQty(activeId) : 0;
      syncCtrl('decant', dQty);
      if (fpNudge) {
        fpNudge.hidden = dQty === 0;
        if (dQty > 0 && dQty < 3) {
          fpNudge.innerHTML = 'Añadí ' + (3 - dQty) + ' más y armá el set por <strong>₡12.000</strong>';
        } else if (dQty === 3) {
          fpNudge.innerHTML = '¡Set completo! Ahorrás <strong>₡3.000</strong>';
        } else {
          fpNudge.innerHTML = 'Set de 3 decants: <strong>₡12.000</strong> — ahorrás ₡3.000';
        }
      }

      ['30ml', '100ml'].forEach(function (fmt) {
        syncCtrl(fmt, vc ? vc.getBottleQty(activeId, fmt) : 0);
      });
    }

    var fpImg    = document.getElementById('js-fp-img');
    var fpRings  = document.getElementById('js-fp-rings');
    var fpVisual = fpEl.querySelector('.fp__visual');

    function openPanel(cardEl) {
      activeId = cardEl.dataset.fragranceId;
      var vc0 = window.vencyCart;
      preOpenSnap = {
        name:    cardEl.dataset.fragranceName || '',
        decant:  vc0 ? vc0.getDecantQty(activeId) : 0,
        '30ml':  vc0 ? vc0.getBottleQty(activeId, '30ml') : 0,
        '100ml': vc0 ? vc0.getBottleQty(activeId, '100ml') : 0
      };
      var cat = (cardEl.dataset.fragranceCat || '').replace(/-/g, ' ').toUpperCase();
      fpBadge.textContent = cat;
      fpName.textContent  = cardEl.dataset.fragranceName || '';
      fpNotes.textContent = cardEl.dataset.fragranceNotes || '';
      fpBottles.hidden    = !cardEl.querySelector('.fmt-rail__buy-btn');

      var imgSrc = cardEl.dataset.fragranceImg || '';
      if (imgSrc && fpImg) {
        fpImg.src    = imgSrc;
        fpImg.alt    = cardEl.dataset.fragranceName || '';
        fpImg.onerror = function() { fpImg.src = '../assets/images/default-bottle.jpg'; fpImg.onerror = null; };
        fpImg.hidden = false;
        if (fpRings)  fpRings.hidden = true;
        if (fpVisual) fpVisual.classList.add('has-img');
      } else {
        if (fpImg)    fpImg.hidden   = true;
        if (fpRings)  fpRings.hidden = false;
        if (fpVisual) fpVisual.classList.remove('has-img');
      }

      syncPanelState();
      fpEl.hidden = false;
      fpEl.getBoundingClientRect();
      fpEl.classList.add('is-open');
      document.body.classList.add('fp-open');
      document.addEventListener('keydown', trapTab);
      fpSheet.focus();
    }

    function closePanel() {
      fpEl.classList.remove('is-open');
      document.body.classList.remove('fp-open');
      document.removeEventListener('keydown', trapTab);
      fpSheet.addEventListener('transitionend', function handler() {
        fpEl.hidden = true;
        fpSheet.removeEventListener('transitionend', handler);
      }, { once: true });
      activeId = null;
      if (triggerEl && typeof triggerEl.focus === 'function') {
        triggerEl.focus();
      }
      triggerEl = null;
    }

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.cat-entry__see');
      if (!btn) return;
      var card = btn.closest('[data-fragrance-id]');
      if (card) {
        triggerEl = btn;
        openPanel(card);
      }
    });

    fpEl.querySelectorAll('[data-fmt][data-delta]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!activeId) return;
        var fmt   = btn.dataset.fmt;
        var delta = parseInt(btn.dataset.delta, 10);
        var card  = document.querySelector('[data-fragrance-id="' + activeId + '"]');
        var name  = card ? card.dataset.fragranceName : '';
        var vc    = window.vencyCart;
        if (!vc) return;
        if (fmt === 'decant') {
          vc.setDecantQty(activeId, name, Math.max(0, Math.min(3, vc.getDecantQty(activeId) + delta)));
        } else {
          vc.setBottleQty(activeId, name, fmt, Math.max(0, Math.min(10, vc.getBottleQty(activeId, fmt) + delta)));
        }
        setTimeout(syncPanelState, 0);
      });
    });

    function showUndoToast(snapshotId, snapshot) {
      var t = document.createElement('div');
      t.className = 'vency-toast vency-toast--undo';
      t.innerHTML = '<span>¡Listo! Ya está en tu pedido.</span>'
        + '<button class="vency-toast__undo" type="button">Deshacer</button>';
      document.body.appendChild(t);
      requestAnimationFrame(function () { t.classList.add('vency-toast--in'); });
      var timer = setTimeout(dismiss, 4000);
      function dismiss() {
        clearTimeout(timer);
        t.classList.remove('vency-toast--in');
        setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
      }
      t.querySelector('.vency-toast__undo').addEventListener('click', function () {
        var vc = window.vencyCart;
        if (vc) {
          vc.setDecantQty(snapshotId, snapshot.name, snapshot.decant);
          ['30ml', '100ml'].forEach(function (f) {
            vc.setBottleQty(snapshotId, snapshot.name, f, snapshot[f]);
          });
        }
        dismiss();
      });
    }

    if (fpOrder) {
      fpOrder.addEventListener('click', function () {
        var vc  = window.vencyCart;
        var id  = activeId;
        if (!vc || !id) { closePanel(); return; }
        var card = document.querySelector('[data-fragrance-id="' + id + '"]');
        var name = card ? card.dataset.fragranceName : '';
        var hadItem = vc.getDecantQty(id) > 0 ||
          ['30ml', '100ml'].some(function (f) { return vc.getBottleQty(id, f) > 0; });
        // No format picked → default to a decant so the CTA always adds
        // something. User stays on the catalog; the tray surfaces and the
        // nav cart link updates. Checkout is its own deliberate step
        // (tray or nav → /carrito.html → "Enviar pedido por WhatsApp").
        if (!hadItem) vc.setDecantQty(id, name, 1);
        closePanel();
        showAddedToast(name);
      });
    }

    function showAddedToast(name) {
      // Reuse the existing .vency-toast styling from decants.css. Includes
      // a "Ver carrito" affordance so users who want to checkout now can.
      var existing = document.querySelector('.vency-toast--added');
      if (existing) existing.remove();
      var t = document.createElement('div');
      t.className = 'vency-toast vency-toast--undo vency-toast--added';
      t.innerHTML =
        '<span>' + (name ? name + ' agregado.' : 'Agregado al carrito.') + '</span>' +
        '<a class="vency-toast__undo" href="carrito.html">Ver carrito →</a>';
      document.body.appendChild(t);
      requestAnimationFrame(function () { t.classList.add('vency-toast--in'); });
      setTimeout(function () {
        t.classList.remove('vency-toast--in');
        setTimeout(function () { if (t.parentNode) t.remove(); }, 300);
      }, 3500);
    }

    fpClose.addEventListener('click', closePanel);
    fpBackdrop.addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !fpEl.hidden) closePanel();
    });
  }

  /* ── Format journey (URL param ?fmt=decant|30ml|100ml) ── */
  var fmtMatch = location.search.match(/[?&]fmt=(decant|30ml|100ml)(?:&|$)/);
  if (fmtMatch) document.body.classList.add('fmt--' + fmtMatch[1]);

  /* ── Init ────────────────────────────────────────────── */
  buildVencySection();
  buildSections();
  wireFilterToggle();
  wirePills();
  wireClearBtn();
  wireSearch();
  wireFragPanel();
  render();

  if (location.hash) {
    setTimeout(function () {
      var el = document.getElementById(location.hash.slice(1));
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      var seeBtn = el.querySelector('.cat-entry__see');
      if (seeBtn) seeBtn.click();
    }, 200);
  }

})();
