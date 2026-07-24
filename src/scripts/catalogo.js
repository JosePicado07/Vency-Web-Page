(function () {
  'use strict';

  var catalog   = window.VENCY_FULL_CATALOG || [];
  var _unavailable = new Set();
  var _kvEntries = [];
  var filters   = { cat: 'todos', gender: 'todos', q: '', ocasion: 'todos', vencyCat: 'todos' };

  // Parse ?category=X from URL and apply initial filter
  var urlParams = new URLSearchParams(location.search);
  var urlCat = urlParams.get('category');
  switch (urlCat) {
    case 'original':
      filters.cat = 'vency';
      filters.vencyCat = 'todos';
      break;
    case 'disenador':
      filters.cat = 'disenador';
      filters.vencyCat = 'ocultar';
      break;
    case 'niche':
      filters.cat = 'nicho';
      filters.vencyCat = 'ocultar';
      break;
    case 'ultra':
      filters.cat = 'ultra-nicho';
      filters.vencyCat = 'ocultar';
      break;
    default:
      filters.cat = 'todos';
      filters.vencyCat = 'todos';
  }

  /* ── Format selector modal (mirror of Colección) ──────────────────
     Same HTML/CSS as coleccion.html — driven by the same cart logic.
     openFmtModal(frag) where frag = { id, name, image }. */
  var _fmtTrigger  = null;
  var FMT_IMAGES   = window.VENCY_FMT_IMAGES;
  Object.keys(FMT_IMAGES).forEach(function (k) {
    var pre = new Image(); pre.src = FMT_IMAGES[k];
  });

  var fmtOverlay  = document.querySelector('.js-fmt-overlay');
  var fmtModal    = fmtOverlay && fmtOverlay.querySelector('.js-fmt-modal');
  var fmtClose    = fmtModal && fmtModal.querySelector('.js-fmt-close');
  var fmtImg      = fmtModal && fmtModal.querySelector('.js-fmt-img');
  var _fmtImgTimer = null;
  var _fmtTransitionHandler = null;
  var _preloadCache = {};
  var _upgradeImg = null;

  function to400Src(p) {
    return p ? p.replace(/^(.*\/)([^/]+)\.(?:png|jpe?g|avif)$/i, '$1_webp/$2-400.webp') : '';
  }
  function to800Src(p) {
    return p ? p.replace(/^(.*\/)([^/]+)\.(?:png|jpe?g|avif)$/i, '$1_webp/$2-800.webp') : '';
  }
  function preload800(imagePath) {
    var src = to800Src(imagePath);
    if (!src || _preloadCache[src]) return;
    var img = new Image();
    img.src = src;
    _preloadCache[src] = img;
  }
  var fmtImgBadge = fmtModal && fmtModal.querySelector('.js-fmt-img-badge');
  var fmtName     = fmtModal && fmtModal.querySelector('.js-fmt-name');
  var fmtInspo    = fmtModal && fmtModal.querySelector('.js-fmt-inspo');
  var fmtHistory  = fmtModal && fmtModal.querySelector('.js-fmt-history');
  var fmtPhrase   = fmtModal && fmtModal.querySelector('.js-fmt-phrase');
  var fmtNotes    = fmtModal && fmtModal.querySelector('.js-fmt-notes');
  var fmtOptions  = fmtModal && fmtModal.querySelector('.js-fmt-options');
  var fmtConfirm  = fmtModal && fmtModal.querySelector('.js-fmt-confirm');
  var fmtFrag    = null;

  if (fmtOverlay && fmtModal) {
    fmtClose.addEventListener('click', closeFmtModal);
    fmtOverlay.addEventListener('click', function (e) {
      if (e.target === fmtOverlay) closeFmtModal();
    });
    document.addEventListener('keydown', function (e) {
      if (!fmtOverlay.classList.contains('is-open')) return;
      if (e.key === 'Escape') { closeFmtModal(); return; }
      if (e.key === 'Tab') {
        var focusable = Array.prototype.slice.call(
          fmtModal.querySelectorAll('button:not([disabled]),[href],input,[tabindex]:not([tabindex="-1"])')
        ).filter(function (el) { return !el.closest('[hidden]'); });
        if (!focusable.length) return;
        var first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    });
    fmtOptions.addEventListener('change', function (e) {
      fmtOptions.querySelectorAll('.fmt-option').forEach(function (o) {
        o.classList.toggle('is-selected', o.querySelector('input').checked);
      });
      fmtConfirm.disabled = false;
      fmtConfirm.textContent = 'Añadir al carrito';
      /* Cancel any pending 800px upgrade — format image takes over. */
      if (_upgradeImg) { _upgradeImg.onload = _upgradeImg.onerror = null; _upgradeImg = null; }
      var checked = fmtOptions.querySelector('input:checked');
      var img = fmtModal && fmtModal.querySelector('.js-fmt-img');
      if (checked && img && FMT_IMAGES[checked.value]) {
        var newSrc = FMT_IMAGES[checked.value];
        clearTimeout(_fmtImgTimer);
        img.style.opacity = '0';
        requestAnimationFrame(function () {
          img.src = newSrc;
          requestAnimationFrame(function () { img.style.opacity = '1'; });
        });
      }
    });
    fmtConfirm.addEventListener('click', function () {
      if (!fmtFrag) return;
      var selected = fmtOptions.querySelector('input:checked');
      if (!selected) return;
      window.VencyCart.addItem(fmtFrag, selected.value);
      closeFmtModal();
    });
  }

  function openFmtModal(frag) {
    if (!fmtOverlay || !fmtModal || !fmtImg || !fmtName || !fmtOptions) return;
    /* Cancel any in-flight timers / upgrade from a previous open. */
    clearTimeout(_fmtImgTimer);
    if (_fmtTransitionHandler) {
      fmtImg.removeEventListener('transitionend', _fmtTransitionHandler);
      _fmtTransitionHandler = null;
    }
    if (_upgradeImg) { _upgradeImg.onload = _upgradeImg.onerror = null; _upgradeImg = null; }
    fmtImg.onload = fmtImg.onerror = null;
    fmtFrag = frag;

    var src400 = frag.image ? to400Src(frag.image) : 'assets/images/_webp/default-bottle-400.webp';
    var src800 = frag.image ? to800Src(frag.image) : 'assets/images/_webp/default-bottle-400.webp';

    /* Show 400px immediately — guaranteed cached since the card already displayed it. */
    fmtImg.src = src400;
    fmtImg.style.opacity = '1';

    /* Upgrade to 800px: instant if preloaded, otherwise load in background and swap silently. */
    var cached800 = _preloadCache[src800] && _preloadCache[src800].complete && _preloadCache[src800].naturalWidth > 0;
    if (cached800) {
      fmtImg.src = src800;
    } else {
      _upgradeImg = new Image();
      _upgradeImg.onload = function () {
        if (fmtFrag === frag) fmtImg.src = src800;
        _upgradeImg = null;
      };
      _upgradeImg.onerror = function () { _upgradeImg = null; };
      _upgradeImg.src = src800;
    }
    fmtImg.alt = frag.name || '';
    fmtName.textContent = frag.name || '';
    if (fmtHistory) {
      if (frag.href) {
        fmtHistory.href = frag.href;
        fmtHistory.hidden = false;
      } else {
        fmtHistory.hidden = true;
      }
    }
    if (fmtImgBadge) fmtImgBadge.hidden = !frag.inspo;
    if (fmtInspo) {
      if (frag.inspo) { fmtInspo.textContent = frag.inspo; fmtInspo.hidden = false; }
      else { fmtInspo.hidden = true; }
    }
    if (fmtPhrase) {
      if (frag.phrase) { fmtPhrase.textContent = frag.phrase; fmtPhrase.hidden = false; }
      else { fmtPhrase.hidden = true; }
    }
    if (fmtNotes) {
      if (frag.notes) { fmtNotes.textContent = frag.notes; fmtNotes.hidden = false; }
      else { fmtNotes.hidden = true; }
    }
    var _P   = window.VENCY_PRICES;
    var tier = frag.cat || 'vency';
    var p30  = _P.b30[tier]  || _P.b30.vency;
    var p100 = _P.b100[tier] || _P.b100.vency;
    var elD   = document.getElementById('js-fmt-price-decant');
    var el30  = document.getElementById('js-fmt-price-30ml');
    var el100 = document.getElementById('js-fmt-price-100ml');
    if (elD)   elD.textContent   = window.fmtCRC(_P.decant[tier] || _P.decant.vency);
    if (el30)  el30.textContent  = window.fmtCRC(p30);
    if (el100) el100.textContent = window.fmtCRC(p100);
    fmtOptions.querySelectorAll('input').forEach(function (r) { r.checked = false; });
    fmtOptions.querySelectorAll('.fmt-option').forEach(function (o) { o.classList.remove('is-selected'); });
    fmtConfirm.disabled = true;
    fmtConfirm.textContent = 'Elegí un formato';
    _fmtTrigger = document.activeElement;
    fmtOverlay.classList.add('is-open');
    if (fmtClose) fmtClose.focus();
  }

  function closeFmtModal() {
    if (!fmtOverlay) return;
    if (_upgradeImg) { _upgradeImg.onload = _upgradeImg.onerror = null; _upgradeImg = null; }
    fmtOverlay.classList.remove('is-open');
    fmtFrag = null;
    if (_fmtTrigger) { _fmtTrigger.focus(); _fmtTrigger = null; }
  }

  var countEl   = document.querySelector('.js-cat-count');
  var emptyEl   = document.querySelector('.cat-empty');

  /* ── Helpers ─────────────────────────────────────────── */
  var slug    = window.slugify;
  var escHtml = window.escHtml;

  /* First 12 rendered images load eagerly (above fold); rest are lazy. */
  var _imgIdx = 0;
  function imgLoadAttrs() {
    var i = _imgIdx++;
    return i < 12
      ? 'loading="eager" fetchpriority="' + (i < 4 ? 'high' : 'auto') + '"'
      : 'loading="lazy"';
  }

  /* Build srcset for responsive image serving:
     200w → mobile 2-col (~175px), 400w → tablet/desktop 4-col (~350px).
     sizes: 50vw on phones, 25vw on 640px+ screens.
     Accepts either a -400.webp path or a .png/.jpg path. */
  function imgSrcset(src) {
    var src400 = /-400\.webp$/.test(src)
      ? src
      : src.replace(/^(.*\/)([^/]+)\.(?:png|jpe?g|avif)$/i, '$1_webp/$2-400.webp');
    var src200 = src400.replace(/-400\.webp$/, '-200.webp');
    return 'srcset="' + src200 + ' 200w, ' + src400 + ' 400w" sizes="(min-width: 640px) 25vw, 50vw"';
  }

  function debounce(fn, ms) {
    var t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
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
  function buildRail(dataName, ariaName, isInv, cat) {
    var _P   = window.VENCY_PRICES;
    var tier = cat || 'vency';
    var p30  = _P.b30[tier]  || _P.b30.vency;
    var p100 = _P.b100[tier] || _P.b100.vency;
    return '<div class="fmt-rail' + (isInv ? ' fmt-rail--inv' : '') + '" data-fragrance-name="' + dataName + '">' +
        '<button class="fmt-rail__set dblock__trigger" aria-pressed="false" aria-label="Agregar ' + ariaName + ' al Set de 3 Decants">' +
          '<span class="fmt-rail__set-mark" aria-hidden="true"></span>' +
          '<span class="fmt-rail__set-main">' +
            '<span class="fmt-rail__set-title">Añadir al set</span>' +
            '<span class="fmt-rail__set-meta">Decant 10 ml · ' + window.fmtCRC(_P.decant[tier] || _P.decant.vency) + '</span>' +
            '<span class="fmt-rail__hint js-set-hint" hidden></span>' +
          '</span>' +
        '</button>' +
        '<div class="fmt-rail__buy">' +
          '<span class="fmt-rail__buy-label">o frasco completo</span>' +
          '<button class="fmt-rail__btn fmt-rail__buy-btn" data-fmt="30ml" data-price="' + p30 + '" aria-pressed="false" aria-label="Comprar frasco 30 ml de ' + ariaName + ' por ' + window.fmtCRC(p30) + '">' +
            '<span class="fmt-rail__label">Frasco · 30 ML</span>' +
            '<span class="fmt-rail__price">' + window.fmtCRC(p30) + '</span>' +
          '</button>' +
          '<button class="fmt-rail__btn fmt-rail__buy-btn" data-fmt="100ml" data-price="' + p100 + '" aria-pressed="false" aria-label="Comprar frasco 100 ml de ' + ariaName + ' por ' + window.fmtCRC(p100) + '">' +
            '<span class="fmt-rail__label">Frasco · 100 ML</span>' +
            '<span class="fmt-rail__price">' + window.fmtCRC(p100) + '</span>' +
          '</button>' +
        '</div>' +
      '</div>';
  }

  /* ── Shared vency-entry builder ─────────────────────── */
  function buildVencyEntries(container, fragrances) {
    if (!container || !fragrances.length) return;

    var inventoryStr = localStorage.getItem('vency_inventory');
    var inventory = inventoryStr ? JSON.parse(inventoryStr) : null;
    var hasInventory = inventory && Object.keys(inventory).length > 0;

    var html = '<ul class="cat-brand__list">';
    fragrances.forEach(function (frag) {
      var isIcon    = frag.category === 'icon-series';
      var badgeText = isIcon ? 'ICON' : 'VENCY';
      var badgeClass = isIcon ? 'cat-badge--icon' : 'cat-badge--original';
      var notes     = frag.noteLabels.join(' · ');
      var searchStr = (frag.name + ' ' + (frag.inspiration ? frag.inspiration.name + ' ' + frag.inspiration.brand : '') + ' ' + frag.notes.join(' ')).toLowerCase();
      var ocasion   = frag.ocasion.join(' ');
      var fname     = escHtml(isIcon && frag.inspiration ? frag.inspiration.name : frag.name);

      var inspoLine = (isIcon && frag.inspiration)
        ? '<span class="vency-compact__ref">· ' + escHtml(frag.inspiration.brand) + '</span> '
        : '';

      // Calculate soldOut dynamically from current inventory
      var dk = frag.id + ':decant';
      var bk30 = frag.id + ':30ml';
      var bk100 = frag.id + ':100ml';
      // Only sold-out when admin tracks this id (any key present) AND all formats are zero.
      // Untracked = unknown = assume in-stock.
      var tracked = hasInventory && ((dk in inventory) || (bk30 in inventory) || (bk100 in inventory));
      var soldOut = _unavailable.has(frag.id)
                 || _archivedBase.has(frag.id)
                 || (tracked && (!inventory[dk] || !inventory[dk].oil_ml)
                             && (!inventory[bk30] || !inventory[bk30].oil_ml)
                             && (!inventory[bk100] || !inventory[bk100].oil_ml));
      if (soldOut) return;
      var railHtmlVency = buildRail(fname, fname, false, 'vency');

      var thumbSrc = frag.image
        ? frag.image.replace(/^(.*\/)([^/]+)\.(?:png|jpe?g)$/i, '$1_webp/$2-400.webp')
        : 'assets/images/_webp/default-bottle-400.webp';

      var historiaHref = 'coleccion.html#' + frag.id;
      var inspoText = (isIcon && frag.inspiration)
        ? escHtml(frag.inspiration.brand)
        : '';

      html +=
        '<li class="cat-entry cat-entry--vency' + (isIcon ? ' cat-entry--icon' : '') + '"' +
          ' id="' + frag.id + '"' +
          ' data-fragrance-id="' + frag.id + '"' +
          ' data-fragrance-name="' + fname + '"' +
          ' data-fragrance-cat="vency"' +
          ' data-fragrance-vency-cat="' + frag.category + '"' +
          ' data-fragrance-notes="' + escHtml(notes) + '"' +
          ' data-fragrance-img="' + escHtml(frag.image || 'assets/images/default-bottle.jpg') + '"' +
          ' data-fragrance-href="' + escHtml(historiaHref) + '"' +
          (inspoText ? ' data-fragrance-inspo="' + inspoText + '"' : '') +
          ' data-search="' + escHtml(searchStr) + '"' +
          ' data-ocasion="' + ocasion + '"' +
          '>' +
          '<button class="cat-entry__card cat-entry__see" type="button"' +
            ' aria-haspopup="dialog" aria-label="Ver ficha de ' + fname + '">' +
            '<span class="cat-entry__img-wrap">' +
              '<img class="cat-entry__img" src="' + thumbSrc + '" ' + imgSrcset(thumbSrc) + ' alt="' + fname + '" ' + imgLoadAttrs() +
                ' onerror="this.onerror=null;this.src=\'assets/images/default-bottle.jpg\';">' +
              '<span class="cat-entry__img-badge">' + (isIcon ? 'INSPIRACIÓN ELEVADA' : 'CREACIÓN PROPIA') + '</span>' +
            '</span>' +
            '<span class="cat-entry__info">' +
              '<span class="cat-entry__provenance">' + (isIcon ? 'ICON SERIES' : 'VENCY ATELIER') + '</span>' +
              '<span class="cat-entry__name">' + fname + '</span>' +
              (isIcon && frag.inspiration
                ? '<span class="cat-entry__inspo">' + escHtml(frag.inspiration.brand) + '</span>'
                : '') +
            '</span>' +
          '</button>' +
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

  function buildVencySection() {
    var vencyCatalog = window.VENCY_CATALOG || [];
    buildVencyEntries(
      document.getElementById('vency-compact-entries'),
      vencyCatalog.filter(function (f) { return f.category !== 'icon-series'; })
    );
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
    container.innerHTML = '';

    // Same inventory bridge as Vency entries — compute sold-out at render time
    // so the state is right on first paint (no late "AGOTADO popping in on scroll").
    var invStr = localStorage.getItem('vency_inventory');
    var inv = invStr ? JSON.parse(invStr) : null;
    var hasInv = inv && Object.keys(inv).length > 0;
    function isItemSoldOut(id) {
      if (_unavailable.has(id) || _archivedBase.has(id)) return true;
      if (!hasInv) return false;
      var dk = id + ':decant', bk30 = id + ':30ml', bk100 = id + ':100ml';
      var tracked = (dk in inv) || (bk30 in inv) || (bk100 in inv);
      if (!tracked) return false;
      return (!inv[dk]   || !inv[dk].oil_ml)
          && (!inv[bk30] || !inv[bk30].oil_ml)
          && (!inv[bk100]|| !inv[bk100].oil_ml);
    }

    var iconSeries = (window.VENCY_CATALOG || []).filter(function (f) { return f.category === 'icon-series'; });

    SECTIONS.forEach(function (sec) {
      var brands = {};
      catalog.forEach(function (item) {
        if (item.cat !== sec.cat) return;
        if (!brands[item.brand]) brands[item.brand] = [];
        brands[item.brand].push(item);
      });

      /* Merge icon-series entries into their inspiration brand group */
      iconSeries.forEach(function (frag) {
        if (frag.cat !== sec.cat) return;
        var brandKey = frag.inspiration.brand.toUpperCase();
        /* Try to match an existing brand group (catalog brands are uppercase) */
        var existingKey = null;
        Object.keys(brands).forEach(function (b) {
          if (b.toUpperCase() === brandKey) existingKey = b;
        });
        var key = existingKey || frag.inspiration.brand;
        if (!brands[key]) brands[key] = [];
        brands[key].push({ _isIcon: true, _frag: frag });
      });

      /* Merge KV-added entries (admin-added via Catálogo tab) — skip if already in static catalog */
      _kvEntries.forEach(function (entry) {
        if (entry.cat !== sec.cat) return;
        var brandKey = (entry.brand || '').toUpperCase();
        var existingKey = null;
        Object.keys(brands).forEach(function (b) {
          if (b.toUpperCase() === brandKey) existingKey = b;
        });
        var key = existingKey || (entry.brand || '');
        if (!brands[key]) brands[key] = [];
        var alreadyInGroup = brands[key].some(function (item) {
          if (item._isKV || item._isIcon) return false;
          var n = (item.name || '').toLowerCase();
          var e = (entry.name || '').toLowerCase();
          return n === e;
        });
        if (!alreadyInGroup) brands[key].push({ _isKV: true, _entry: entry });
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
          var isInv = sec.cat === 'ultra-nicho';

          /* ── KV-added entry (admin Catálogo tab) ── */
          if (item._isKV) {
            var kv = item._entry;
            if (_unavailable.has(kv.id)) return;
            var kvImg = kv.imageId
              ? '/api/catalog-image/' + kv.imageId
              : 'assets/images/_webp/default-bottle-400.webp';
            var kvName   = escHtml(kv.name);
            var kvBrand  = escHtml(kv.brand || '');
            var kvFullName = kvBrand ? kvBrand + ' \xb7 ' + kvName : kvName;
            var kvNotes  = (kv.notes || '').replace(/\s*,\s*/g, ' · ');

            li.className = 'cat-entry';
            li.dataset.cat           = kv.cat;
            li.dataset.gender        = kv.gender || 'unisex';
            li.dataset.fragranceId   = kv.id;
            li.dataset.fragranceName = kvBrand ? kv.brand + ' · ' + kv.name : kv.name;
            li.dataset.fragranceCat  = kv.cat;
            li.dataset.fragranceImg  = kv.imageId ? '/api/catalog-image/' + kv.imageId : 'assets/images/default-bottle.jpg';
            li.dataset.fragranceNotes = kvNotes;
            li.dataset.fragranceInspo = kvBrand ? kvBrand + ' · ' + kvName : kvName;
            li.dataset.search = (kv.name + ' ' + (kv.brand || '') + ' ' + (kv.notes || '')).toLowerCase();
            li.dataset.ocasion = '';

            var kvRail = buildRail(kvFullName, kvName, isInv, sec.cat);
            li.innerHTML =
              '<button class="cat-entry__card cat-entry__see" type="button"' +
                ' aria-haspopup="dialog" aria-label="Ver ficha de ' + kvName + '">' +
                '<span class="cat-entry__img-wrap">' +
                  '<img class="cat-entry__img" src="' + kvImg + '" alt="' + kvName + '" loading="lazy"' +
                    ' onerror="this.onerror=null;this.src=\'assets/images/default-bottle.jpg\';">' +
                '</span>' +
                '<span class="cat-entry__info">' +
                  '<span class="cat-entry__provenance">' + escHtml(sec.title.toUpperCase()) + '</span>' +
                  '<span class="cat-entry__name">' + kvName + '</span>' +
                  (kv.brand ? '<span class="cat-entry__inspo">' + kvBrand + '</span>' : '') +
                '</span>' +
              '</button>' +
              kvRail;

            li.style.setProperty('--entry-delay', (Math.min(itemIdx, 8) * 45) + 'ms');
            list.appendChild(li);
            return;
          }

          /* ── Icon-series entry ── */
          if (item._isIcon) {
            var frag = item._frag;
            var fname = escHtml(frag.inspiration.name);
            var thumbSrc = frag.image
              ? frag.image.replace(/^(.*\/)([^/]+)\.(?:png|jpe?g)$/i, '$1_webp/$2-400.webp')
              : 'assets/images/_webp/default-bottle-400.webp';
            var historiaHref = 'coleccion.html#' + frag.id;
            var notes = frag.noteLabels.join(' · ');

            if (_unavailable.has(frag.id) || _archivedBase.has(frag.id)) return;

            li.className = 'cat-entry cat-entry--icon';
            li.dataset.cat    = sec.cat;
            li.dataset.gender = frag.gender || 'unisex';
            li.dataset.fragranceId   = frag.id;
            li.dataset.fragranceName = frag.inspiration.name;
            li.dataset.fragranceCat  = 'vency';
            li.dataset.fragranceVencyCat = 'icon-series';
            li.dataset.fragranceImg  = frag.image || 'assets/images/default-bottle.jpg';
            li.dataset.fragranceHref = historiaHref;
            li.dataset.fragranceInspo = escHtml(frag.inspiration.brand);
            li.dataset.fragranceNotes = notes;
            li.dataset.search = (frag.inspiration.name + ' ' + frag.name + ' ' + frag.inspiration.brand + ' ' + frag.notes.join(' ')).toLowerCase();
            li.dataset.ocasion = frag.ocasion.join(' ');

            var railHtmlIcon = buildRail(fname, fname, false, 'vency');
            li.innerHTML =
              '<button class="cat-entry__card cat-entry__see" type="button"' +
                ' aria-haspopup="dialog" aria-label="Ver ficha de ' + fname + '">' +
                '<span class="cat-entry__img-wrap">' +
                  '<img class="cat-entry__img" src="' + thumbSrc + '" ' + imgSrcset(thumbSrc) + ' alt="' + fname + '" ' + imgLoadAttrs() +
                    ' onerror="this.onerror=null;this.src=\'assets/images/default-bottle.jpg\';">' +
                  '<span class="cat-entry__img-badge">INSPIRACIÓN ELEVADA</span>' +
                '</span>' +
                '<span class="cat-entry__info">' +
                  '<span class="cat-entry__provenance">ICON SERIES</span>' +
                  '<span class="cat-entry__name">' + fname + '</span>' +
                  '<span class="cat-entry__inspo">' + escHtml(frag.inspiration.brand) + '</span>' +
                '</span>' +
              '</button>' +
              railHtmlIcon;

            li.style.setProperty('--entry-delay', (Math.min(itemIdx, 8) * 45) + 'ms');
            list.appendChild(li);
            return;
          }

          /* ── Regular catalog entry ── */
          li.className = 'cat-entry';
          li.dataset.cat    = item.cat;
          li.dataset.gender = item.gender;

          var interp = item.vencyInterpretation;
          var genderLabel = {mujer:'Mujer',hombre:'Hombre',unisex:'Unisex'}[item.gender] || item.gender;

          var displayName  = interp ? interp.name : item.name;
          var fragranceName = interp ? escHtml(interp.name) : escHtml(item.brand) + ' · ' + escHtml(item.name);

          li.dataset.fragranceId   = interp ? interp.id : slug(item.brand + '-' + item.name);
          li.dataset.fragranceName = interp ? interp.name : item.brand + ' · ' + item.name;
          li.dataset.fragranceCat  = sec.cat;
          var historiaHref = interp ? 'coleccion.html#' + interp.id : null;
          if (historiaHref) li.dataset.fragranceHref = historiaHref;
          li.dataset.fragranceInspo = escHtml(item.name) + ' · ' + escHtml(item.brand);
          var rawNotes = item.notes || '';
          var dotIdx   = rawNotes.indexOf('. ');
          li.dataset.fragranceNotes  = dotIdx !== -1 ? rawNotes.slice(0, dotIdx) : rawNotes;
          li.dataset.fragrancePhrase = dotIdx !== -1 ? rawNotes.slice(dotIdx + 2) : '';
          li.dataset.fragranceImg = item.image || 'assets/images/default-bottle.jpg';
          var extThumbSrc = item.image
            || (interp
              ? 'assets/images/inspirations/_webp/' + interp.id + '-400.webp'
              : 'assets/images/_webp/default-bottle-400.webp');
          li.dataset.search        = (item.name + ' ' + item.brand + (interp ? ' ' + interp.name : '')).toLowerCase();

          if (!!item.soldOut || isItemSoldOut(li.dataset.fragranceId)) return;
          var railHtml = buildRail(fragranceName, escHtml(item.name), isInv, sec.cat);

          li.innerHTML =
            '<button class="cat-entry__card cat-entry__see" type="button"' +
              ' aria-haspopup="dialog" aria-label="Ver ficha de ' + escHtml(displayName) + '">' +
              '<span class="cat-entry__img-wrap">' +
                '<img class="cat-entry__img" src="' + extThumbSrc + '" ' + imgSrcset(extThumbSrc) + ' alt="' + escHtml(displayName) + '" ' + imgLoadAttrs() +
                  ' onerror="this.onerror=null;this.src=\'assets/images/default-bottle.jpg\';">' +
                '<span class="cat-entry__img-badge">INSPIRADO EN</span>' +
              '</span>' +
              '<span class="cat-entry__info">' +
                '<span class="cat-entry__provenance">' + escHtml(sec.title.toUpperCase()) + '</span>' +
                '<span class="cat-entry__name">' + escHtml(displayName) + '</span>' +
                (interp
                  ? '<span class="cat-entry__inspo">' + escHtml(item.name) + ' · ' + escHtml(item.brand) + '</span>'
                  : '') +
              '</span>' +
            '</button>' +
            railHtml;

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

  /* ── Cached DOM references ──────────────────────────── */
  var catSectionNodes = null;
  function getCatSections() {
    if (!catSectionNodes) {
      catSectionNodes = document.querySelectorAll('.cat-section');
    }
    return catSectionNodes;
  }

  /* ── Filter + render ─────────────────────────────────── */
  function render() {
    var sections = getCatSections();
    // ponytail: no lazy reveal — all entries are already in DOM; pagination saved nothing.
    var entries = document.querySelectorAll('.cat-section:not(.cat-section--vency) .cat-entry');
    entries.forEach(function (entry) {
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
    var vencySection = sections.length ? document.querySelector('.cat-section--vency') : null;
    var vencyVisible = 0;
    (document.querySelectorAll('#vency-compact-entries .cat-entry--vency[data-search]') || []).forEach(function (entry) {
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
    var externalVisible = 0;
    for (var i = 0; i < entries.length; i++) {
      if (!entries[i].classList.contains('cat-entry--hidden')) externalVisible++;
    }
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

    if (location.search.indexOf('filter=1') !== -1) {
      panel.hidden = false;
      toggleBtn.setAttribute('aria-expanded', 'true');
    }

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
              + (filters.ocasion !== 'todos' ? 1 : 0)
              + (filters.vencyCat !== 'todos' ? 1 : 0);
    if (badge)    { badge.textContent = count > 0 ? count : ''; badge.hidden = count === 0; }
    if (clearBtn) { clearBtn.hidden = count === 0; }
  }

  function clearFilters() {
    filters.cat    = 'todos';
    filters.gender = 'todos';
    filters.ocasion = 'todos';
    filters.vencyCat = 'todos';
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
    input.addEventListener('input', debounce(function () {
      filters.q = input.value.trim().toLowerCase();
      render();
    }, 200));
  }

/* ── Format journey (URL param ?fmt=decant|30ml|100ml) ── */
  var fmtMatch = location.search.match(/[?&]fmt=(decant|30ml|100ml)(?:&|$)/);
  if (fmtMatch) document.body.classList.add('fmt--' + fmtMatch[1]);

  /* Sync filter pills to initial URL-param state */
  function syncPillsToFilters() {
    Object.keys(filters).forEach(function (dim) {
      var val = filters[dim];
      document.querySelectorAll('.cat-pill[data-filter="' + dim + '"]').forEach(function (p) {
        var active = p.dataset.value === val;
        p.classList.toggle('is-active', active);
        p.setAttribute('aria-pressed', String(active));
      });
    });
  }

  /* ── Init ────────────────────────────────────────────── */
  function initCatalog() {
    buildVencySection();
    buildSections();
    syncPillsToFilters();
    wireFilterToggle();
    wirePills();
    wireClearBtn();
    wireSearch();
    render();
  }

  // Expose rebuild so catalog-request.js can merge dynamic entries after the fact
  window.__vencyRebuildCatalog = function () {
    catalog = window.VENCY_FULL_CATALOG || [];
    buildSections();
    render();
  };

  var _archivedBase = new Set();
  Promise.all([
    fetch('/api/availability').then(function (r) { return r.json(); }).catch(function () { return {}; }),
    fetch('/api/catalog-request').then(function (r) { return r.json(); }).catch(function () { return []; }),
    fetch('/api/catalog-archive').then(function (r) { return r.json(); }).catch(function () { return {}; })
  ]).then(function (results) {
    _unavailable  = new Set((results[0].unavailable) || []);
    _kvEntries    = Array.isArray(results[1]) ? results[1] : [];
    _archivedBase = new Set((results[2].archived) || []);
    initCatalog();
  });

  // Gentle polling: refresh availability every 45s so items the admin
  // marks unavailable mid-session are caught before checkout.
  setInterval(function () {
    fetch('/api/availability').then(function (r) { return r.json(); }).then(function (data) {
      var fresh = new Set(data.unavailable || []);
      var oldSize = _unavailable.size;
      _unavailable = fresh;
      if (fresh.size <= oldSize) return;
      // Some items became unavailable — check if any are in the current cart
      var cart;
      try { cart = JSON.parse(localStorage.getItem('vency_cart_v1')); } catch (e) {}
      if (!cart) return;
      var hit = [];
      (cart.selection || []).forEach(function (s) { if (fresh.has(s.id)) hit.push(s.name); });
      (cart.bottles || []).forEach(function (b) { if (fresh.has(b.id)) hit.push(b.name); });
        if (hit.length > 0) {
        alert('Estos perfumes ya no est\u00e1n disponibles:\n' + hit.join('\n') + '\n\nQu\u00edtalos del carrito para continuar.');
        try { window.dispatchEvent(new Event('storage')); } catch (e) {}
      }
    }).catch(function () {});
  }, 45000);

  // Wire card clicks → open the format modal. (Was previously inside
  // wireFragPanel, which got stripped in the dead-code cleanup. The
  // modal driver itself is at the top of this file.)
  /* Preload 800px as cards scroll into view — so upgrade is instant by tap time. */
  if ('IntersectionObserver' in window) {
    var _preloadObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        preload800(entry.target.dataset.fragranceImg || '');
        _preloadObserver.unobserve(entry.target);
      });
    }, { rootMargin: '300px' });
    document.querySelectorAll('[data-fragrance-img]').forEach(function (el) {
      _preloadObserver.observe(el);
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.cat-entry__see');
    if (!btn) return;
    var card = btn.closest('[data-fragrance-id]');
    if (card) {
      openFmtModal({
        id:     card.dataset.fragranceId,
        name:   card.dataset.fragranceName,
        cat:    card.dataset.fragranceCat || 'vency',
        image:  card.dataset.fragranceImg,
        href:   card.dataset.fragranceHref || null,
        inspo:  card.dataset.fragranceInspo || null,
        notes:  card.dataset.fragranceNotes || '',
        phrase: card.dataset.fragrancePhrase || ''
      });
    }
  });

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
