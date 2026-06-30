(function () {
  'use strict';

  var catalog   = window.VENCY_FULL_CATALOG || [];
  var filters   = { cat: 'todos', gender: 'todos', q: '', ocasion: 'todos', vencyCat: 'todos' };

  // Parse ?category=X from URL and apply initial filter
  var urlParams = new URLSearchParams(location.search);
  var urlCat = urlParams.get('category');
  switch (urlCat) {
    case 'original':
      filters.cat = 'todos';
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
  var CART_KEY     = 'vency_cart_v1';
  var BOTTLE_PRICE = { '30ml': 12000, '100ml': 20000 };
  var FMT_IMAGES   = {
    decant: '../assets/images/formats/decant-vial.jpg',
    '30ml':  '../assets/images/formats/frasco-30ml.jpg',
    '100ml': '../assets/images/formats/frasco-100ml.jpg'
  };
  Object.keys(FMT_IMAGES).forEach(function (k) {
    var pre = new Image(); pre.src = FMT_IMAGES[k];
  });

  function fmtAddToCart(frag, fmt) {
    if (!frag) return;
    try {
      var raw = localStorage.getItem(CART_KEY);
      var cart = raw ? JSON.parse(raw) : { selection: [], bottles: [], ref: null, pending: null };
      if (fmt === 'decant') {
        cart.selection.push({ id: frag.id, name: frag.name });
      } else {
        cart.bottles.push({ id: frag.id, name: frag.name, fmt: fmt, price: BOTTLE_PRICE[fmt], qty: 1 });
      }
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      window.dispatchEvent(new CustomEvent('vency-cart-update'));

      // Open the shared cart drawer if it exists (cart-drawer.js wires it)
      var drawer  = document.querySelector('.js-cart-drawer');
      var overlay = document.querySelector('.js-cart-overlay');
      if (drawer && overlay) {
        overlay.classList.add('is-open');
        drawer.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        drawer.dispatchEvent(new CustomEvent('cart-render', { bubbles: true }));
      }
    } catch (e) {}
  }

  var fmtOverlay  = document.querySelector('.js-fmt-overlay');
  var fmtModal    = fmtOverlay && fmtOverlay.querySelector('.js-fmt-modal');
  var fmtClose    = fmtModal && fmtModal.querySelector('.js-fmt-close');
  var fmtImg      = fmtModal && fmtModal.querySelector('.js-fmt-img');
  var fmtImgBadge = fmtModal && fmtModal.querySelector('.js-fmt-img-badge');
  var fmtName     = fmtModal && fmtModal.querySelector('.js-fmt-name');
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
      if (e.key === 'Escape' && fmtOverlay.classList.contains('is-open')) closeFmtModal();
    });
    fmtOptions.addEventListener('change', function (e) {
      fmtOptions.querySelectorAll('.fmt-option').forEach(function (o) {
        o.classList.toggle('is-selected', o.querySelector('input').checked);
      });
      fmtConfirm.disabled = false;
      fmtConfirm.textContent = 'Añadir al carrito';
      var checked = fmtOptions.querySelector('input:checked');
      var img = fmtModal && fmtModal.querySelector('.js-fmt-img');
      if (checked && img && FMT_IMAGES[checked.value]) {
        img.style.opacity = '0';
        setTimeout(function () {
          img.src = FMT_IMAGES[checked.value];
          img.style.opacity = '1';
        }, 200);
      }
    });
    fmtConfirm.addEventListener('click', function () {
      if (!fmtFrag) return;
      var selected = fmtOptions.querySelector('input:checked');
      if (!selected) return;
      fmtAddToCart(fmtFrag, selected.value);
      closeFmtModal();
    });
  }

  function openFmtModal(frag) {
    if (!fmtOverlay || !fmtModal || !fmtImg || !fmtName || !fmtOptions) return;
    fmtFrag = frag;
    fmtImg.src = frag.image || '../assets/images/_webp/default-bottle-400.webp';
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
    if (fmtPhrase) {
      if (frag.phrase) { fmtPhrase.textContent = frag.phrase; fmtPhrase.hidden = false; }
      else { fmtPhrase.hidden = true; }
    }
    if (fmtNotes) {
      if (frag.notes) { fmtNotes.textContent = frag.notes; fmtNotes.hidden = false; }
      else { fmtNotes.hidden = true; }
    }
    fmtOptions.querySelectorAll('input').forEach(function (r) { r.checked = false; });
    fmtOptions.querySelectorAll('.fmt-option').forEach(function (o) { o.classList.remove('is-selected'); });
    fmtConfirm.disabled = true;
    fmtConfirm.textContent = 'Elegí un formato';
    fmtOverlay.classList.add('is-open');
  }

  function closeFmtModal() {
    if (!fmtOverlay) return;
    fmtOverlay.classList.remove('is-open');
    fmtFrag = null;
  }

  var countEl   = document.querySelector('.js-cat-count');
  var emptyEl   = document.querySelector('.cat-empty');

  /* ── Helpers ─────────────────────────────────────────── */
  function slug(str) {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  var escHtml = window.escHtml;

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

      var thumbSrc = frag.image
        ? frag.image.replace(/^(.*\/)([^/]+)\.(?:png|jpe?g)$/i, '$1_webp/$2-400.webp')
        : '../assets/images/_webp/default-bottle-400.webp';

      var historiaHref = 'coleccion.html#' + frag.id;
      var inspoText = isIcon && frag.inspiration
        ? escHtml(frag.inspiration.name) + ' · ' + escHtml(frag.inspiration.brand)
        : '';

      html +=
        '<li class="cat-entry cat-entry--vency' + (isIcon ? ' cat-entry--icon' : '') + '"' +
          ' id="' + frag.id + '"' +
          ' data-fragrance-id="' + frag.id + '"' +
          ' data-fragrance-name="' + fname + '"' +
          ' data-fragrance-cat="vency"' +
          ' data-fragrance-vency-cat="' + frag.category + '"' +
          ' data-fragrance-notes="' + escHtml(notes) + '"' +
          ' data-fragrance-img="' + escHtml(frag.image || '../assets/images/default-bottle.jpg') + '"' +
          ' data-fragrance-href="' + escHtml(historiaHref) + '"' +
          (inspoText ? ' data-fragrance-inspo="' + inspoText + '"' : '') +
          ' data-search="' + escHtml(searchStr) + '"' +
          ' data-ocasion="' + ocasion + '"' +
          (soldOut ? ' data-sold-out="true"' : '') + '>' +
          '<button class="cat-entry__card cat-entry__see" type="button"' +
            ' aria-haspopup="dialog" aria-label="Ver ficha de ' + fname + '">' +
            '<span class="cat-entry__img-wrap">' +
              '<img class="cat-entry__img" src="' + thumbSrc + '" alt="" loading="lazy"' +
                ' onerror="this.onerror=null;this.src=\'../assets/images/default-bottle.jpg\';">' +
              (soldOut ? '<span class="cat-entry__sold-out">Agotado</span>' : '') +
            '</span>' +
            '<span class="cat-entry__info">' +
              '<span class="cat-entry__provenance">' + (isIcon ? 'ICON SERIES' : 'VENCY ATELIER') + '</span>' +
              '<span class="cat-entry__name">' + fname + '</span>' +
              (isIcon && frag.inspiration
                ? '<span class="cat-entry__inspo">' + escHtml(frag.inspiration.name) + ' · ' + escHtml(frag.inspiration.brand) + '</span>'
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
          if (historiaHref) li.dataset.fragranceHref = historiaHref;
          li.dataset.fragranceInspo = escHtml(item.name) + ' · ' + escHtml(item.brand);
          var rawNotes = item.notes || '';
          var dotIdx   = rawNotes.indexOf('. ');
          li.dataset.fragranceNotes  = dotIdx !== -1 ? rawNotes.slice(0, dotIdx) : rawNotes;
          li.dataset.fragrancePhrase = dotIdx !== -1 ? rawNotes.slice(dotIdx + 2) : '';
          li.dataset.fragranceImg  = interp
            ? '../assets/images/inspirations/' + interp.id + '.png'
            : '../assets/images/default-bottle.jpg';
          var extThumbSrc = interp
            ? '../assets/images/inspirations/_webp/' + interp.id + '-400.webp'
            : '../assets/images/_webp/default-bottle-400.webp';
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

          // Card layout: image + name + provenance. Click anywhere on the card
          // opens the detail panel where notes/history/buy live. Match the
          // admin Vender section's image-led card grid.
          li.innerHTML =
            '<button class="cat-entry__card cat-entry__see" type="button"' +
              ' aria-haspopup="dialog" aria-label="Ver ficha de ' + escHtml(displayName) + '">' +
              '<span class="cat-entry__img-wrap">' +
                '<img class="cat-entry__img" src="' + extThumbSrc + '" alt="" loading="lazy"' +
                  ' onerror="this.onerror=null;this.src=\'../assets/images/default-bottle.jpg\';">' +
                (itemSoldOut ? '<span class="cat-entry__sold-out">Agotado</span>' : '') +
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
    (document.querySelectorAll('.cat-entry--vency[data-search]') || []).forEach(function (entry) {
      var catMatch     = (filters.cat === 'todos' || filters.cat === 'vency');
      var vencyMatch   = (filters.vencyCat === 'todos' || entry.dataset.fragranceVencyCat === filters.vencyCat);
      var qMatch       = !filters.q || entry.dataset.search.indexOf(filters.q) !== -1;
      var ocasionMatch = (filters.ocasion === 'todos' ||
        (entry.dataset.ocasion && entry.dataset.ocasion.indexOf(filters.ocasion) !== -1));
      var show = catMatch && vencyMatch && qMatch && ocasionMatch;
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
  buildVencySection();
  buildSections();
  syncPillsToFilters();
  wireFilterToggle();
  wirePills();
  wireClearBtn();
  wireSearch();
  render();

  // Wire card clicks → open the format modal. (Was previously inside
  // wireFragPanel, which got stripped in the dead-code cleanup. The
  // modal driver itself is at the top of this file.)
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.cat-entry__see');
    if (!btn) return;
    var card = btn.closest('[data-fragrance-id]');
    if (card) {
      openFmtModal({
        id:     card.dataset.fragranceId,
        name:   card.dataset.fragranceName,
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
