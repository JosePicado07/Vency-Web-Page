(function () {
  'use strict';

  var catalog  = window.VENCY_CATALOG || [];
  var BATCH    = 6;
  var ordered  = [];
  var rendered = 0;
  var sentinel = null;
  var observer = null;

  /* Entrance: each narrative entry reveals as it enters the viewport.
     CSS holds the pre-state (only under prefers-reduced-motion: no-preference). */
  var entryObserver = ('IntersectionObserver' in window)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-in');
          entryObserver.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px -60px 0px', threshold: 0.08 })
    : null;

  function observeEntry(el) {
    if (entryObserver) entryObserver.observe(el);
    else el.classList.add('is-in');
  }

  var escHtml = window.escHtml;

  /* ── Cart helpers ────────────────────────────────────────────────── */
  var FMT_IMAGES = window.VENCY_FMT_IMAGES;
  Object.keys(FMT_IMAGES).forEach(function (k) {
    var pre = new Image(); pre.src = FMT_IMAGES[k];
  });

  /* ── Format modal ────────────────────────────────────────────────── */
  var fmtOverlay  = document.querySelector('.js-fmt-overlay');
  var fmtModal    = document.querySelector('.js-fmt-modal');
  var fmtClose    = fmtModal && fmtModal.querySelector('.js-fmt-close');
  var fmtImg      = fmtModal && fmtModal.querySelector('.js-fmt-img');
  var fmtImgBadge = fmtModal && fmtModal.querySelector('.js-fmt-img-badge');
  var fmtName     = fmtModal && fmtModal.querySelector('.js-fmt-name');
  var fmtInspo    = fmtModal && fmtModal.querySelector('.js-fmt-inspo');
  var fmtPhrase   = fmtModal && fmtModal.querySelector('.js-fmt-phrase');
  var fmtNotes    = fmtModal && fmtModal.querySelector('.js-fmt-notes');
  var fmtOptions  = fmtModal && fmtModal.querySelector('.js-fmt-options');
  var fmtConfirm  = fmtModal && fmtModal.querySelector('.js-fmt-confirm');
  var fmtFrag    = null;
  var _fmtTrigger = null;
  var _fmtImgTimer = null;
  var _fmtTransitionHandler = null;
  var _preloadCache = {};
  var _upgradeImg = null;

  function to400Src(p) {
    return p ? p.replace(/^(.*\/)([^/]+)\.(?:png|jpe?g)$/i, '$1_webp/$2-400.webp') : '';
  }
  function to800Src(p) {
    return p ? p.replace(/^(.*\/)([^/]+)\.(?:png|jpe?g)$/i, '$1_webp/$2-800.webp') : '';
  }
  function preload800(imagePath) {
    var src = to800Src(imagePath);
    if (!src || _preloadCache[src]) return;
    var img = new Image();
    img.src = src;
    _preloadCache[src] = img;
  }

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
      var fmt = selected.value;
      window.VencyCart.addItem(fmtFrag, fmt);
      closeFmtModal();

      var lastPill = document.querySelector('[data-fmt-last="' + fmtFrag.id + '-' + fmt + '"]');
      if (lastPill) {
        var orig = lastPill.textContent;
        lastPill.textContent = '✓ Añadido';
        setTimeout(function () { lastPill.textContent = orig; }, 900);
      }
    });
  }

  function openFmtModal(frag) {
    if (!fmtOverlay || !fmtModal || !fmtImg || !fmtName || !fmtOptions) return;
    clearTimeout(_fmtImgTimer);
    if (_fmtTransitionHandler) {
      fmtImg.removeEventListener('transitionend', _fmtTransitionHandler);
      _fmtTransitionHandler = null;
    }
    fmtImg.onload = fmtImg.onerror = null;
    fmtFrag = frag;

    if (_upgradeImg) { _upgradeImg.onload = _upgradeImg.onerror = null; _upgradeImg = null; }
    fmtImg.onload = fmtImg.onerror = null;

    var src400 = frag.image ? to400Src(frag.image) : '';
    var src800 = frag.image ? to800Src(frag.image) : '';

    fmtImg.src = src400;
    fmtImg.style.opacity = '1';

    if (src800) {
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
    }
    fmtImg.alt = frag.name;
    fmtName.textContent = frag.name;
    if (fmtImgBadge) fmtImgBadge.hidden = !frag.inspiration;
    if (fmtInspo) {
      if (frag.inspiration) {
        fmtInspo.textContent = frag.inspiration.name + ' · ' + frag.inspiration.brand;
        fmtInspo.hidden = false;
      } else { fmtInspo.hidden = true; }
    }
    if (fmtPhrase) {
      if (frag.narrative) { fmtPhrase.textContent = frag.narrative; fmtPhrase.hidden = false; }
      else { fmtPhrase.hidden = true; }
    }
    if (fmtNotes) {
      var noteStr = Array.isArray(frag.noteLabels) ? frag.noteLabels.join(' · ') : '';
      if (noteStr) { fmtNotes.textContent = noteStr; fmtNotes.hidden = false; }
      else { fmtNotes.hidden = true; }
    }
    var inputs = fmtOptions.querySelectorAll('input');
    var options = fmtOptions.querySelectorAll('.fmt-option');
    inputs.forEach(function (r) { r.checked = false; });
    options.forEach(function (o) { o.classList.remove('is-selected'); });
    fmtConfirm.disabled = true;
    fmtConfirm.textContent = 'Elegí un formato';

    var prices = {
      decant: '₡5.000',
      '30ml': '₡12.000',
      '100ml': '₡20.000'
    };
    var labels = {
      decant: 'Decant 10ml',
      '30ml': 'Frasco 30ml',
      '100ml': 'Frasco 100ml'
    };
    var descriptions = {
      decant: 'Para descubrir y llevar contigo',
      '30ml': 'Para conocerlo bien',
      '100ml': 'Para quedarte con él'
    };

    inputs.forEach(function (r) {
      var val = r.value;
      var wrapper = r.closest('.fmt-option');
      var priceEl = wrapper.querySelector('.fmt-option__price');
      var labelEl = wrapper.querySelector('.fmt-option__label');
      var descEl = wrapper.querySelector('.fmt-option__desc');
      if (priceEl) priceEl.textContent = prices[val] || '';
      if (labelEl) labelEl.textContent = labels[val] || '';
      if (descEl) descEl.textContent = descriptions[val] || '';
    });

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

  function renderEntry(frag) {
    var isIcon = frag.category === 'icon-series';
    var hasInspoImg = isIcon && frag.inspiration && frag.inspiration.image;

    var inspirationLine = isIcon && frag.inspiration
      ? '<p class="catalog-entry__inspo">'
          + escHtml(frag.inspiration.name) + ' · ' + escHtml(frag.inspiration.brand)
        + '</p>'
      : '';

    var imageHtml = hasInspoImg
      ? '<div class="catalog-entry__image catalog-entry__image--split">'
          + '<div class="catalog-entry__image-half">'
            + '<img src="' + frag.image + '" alt="' + escHtml(frag.name) + '" loading="lazy">'
            + '<span class="catalog-entry__image-label">VENCY</span>'
          + '</div>'
          + '<div class="catalog-entry__image-half catalog-entry__image-half--ref">'
            + '<img src="' + frag.inspiration.image + '" alt="' + escHtml(frag.inspiration.name) + ' · ' + escHtml(frag.inspiration.brand) + '" loading="lazy">'
            + '<span class="catalog-entry__image-label">REFERENCIA</span>'
          + '</div>'
        + '</div>'
      : '<div class="catalog-entry__image">'
          + '<img src="' + frag.image + '" alt="' + escHtml(frag.name) + '"'
          + (frag.featured ? ' loading="eager"' : ' loading="lazy"') + '>'
        + '</div>';

    var soldOut    = !!frag.soldOut;
    var entryClass = 'catalog-entry'
      + (frag.featured  ? ' catalog-entry--featured'    : '')
      + (isIcon         ? ' catalog-entry--icon-series' : '')
      + (soldOut        ? ' catalog-entry--sold-out'    : '');

    var badgeClass = isIcon ? 'catalog-entry__badge--icon' : 'catalog-entry__badge--original';
    var badgeText  = isIcon ? 'INSPIRACIÓN' : 'VENCY ORIGINAL';

    return '<article class="' + entryClass + '"'
      + ' id="' + frag.id + '"'
      + ' data-fragrance-id="' + frag.id + '"'
      + (soldOut ? ' data-sold-out="true"' : '')
      + ' style="--entry-accent:' + frag.characterColor + '">'

      + '<div class="catalog-entry__inner">'
        + imageHtml
        + '<div class="catalog-entry__content">'
          + '<div class="catalog-entry__head">'
            + '<span class="catalog-entry__badge ' + badgeClass + '">' + badgeText + '</span>'
            + (soldOut ? '<span class="catalog-entry__badge catalog-entry__badge--sold-out">AGOTADO</span>' : '')
          + '</div>'
          + '<h2 class="catalog-entry__name">' + escHtml(frag.name) + '</h2>'
          + inspirationLine
          + '<p class="catalog-entry__narrative">' + escHtml(frag.narrative) + '</p>'
          + '<div class="catalog-entry__meta">'
            + '<div class="catalog-entry__meta-group">'
              + '<span class="label catalog-entry__meta-label">NOTAS</span>'
              + '<p class="catalog-entry__tag-list">' + frag.noteLabels.join(' · ') + '</p>'
            + '</div>'
            + '<div class="catalog-entry__meta-group">'
              + '<span class="label catalog-entry__meta-label">OCASIÓN</span>'
              + '<p class="catalog-entry__tag-list">' + frag.ocasionLabels.join(' · ') + '</p>'
            + '</div>'
          + '</div>'
          + (soldOut ? '' :
              '<div class="catalog-entry__buy-row">'
              + '<button class="catalog-entry__order-btn" type="button" data-fmt-trigger="' + frag.id + '">Añadir</button>'
            + '</div>')
        + '</div>'
      + '</div>'

    + '</article>';
  }

  var _preloadObserver = ('IntersectionObserver' in window)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var frag = ordered.find(function (f) { return f.id === entry.target.id; });
          if (frag && frag.image) preload800(frag.image);
          _preloadObserver.unobserve(entry.target);
        });
      }, { rootMargin: '300px' })
    : null;

  function appendBatch() {
    var gridEl = document.getElementById('catalog-grid');
    if (!gridEl) return;
    var next = ordered.slice(rendered, rendered + BATCH);
    next.forEach(function (frag, batchIdx) {
      gridEl.insertAdjacentHTML('beforeend', renderEntry(frag));
      var el = gridEl.lastElementChild;
      el.style.setProperty('--entry-delay', (batchIdx * 55) + 'ms');
      observeEntry(el);
      if (_preloadObserver) _preloadObserver.observe(el);
    });
    rendered += next.length;
    if (sentinel) sentinel.hidden = (rendered >= ordered.length);
  }

  function init() {
    if (!document.getElementById('catalog-grid')) return;

    ordered = catalog.filter(function (f) { return f.category === 'original-blend'; })
      .concat(catalog.filter(function (f) { return f.category === 'icon-series'; }));

    /* Hash navigation: pre-render enough batches to include the target */
    var targetIdx = -1;
    if (location.hash) {
      var targetId = location.hash.slice(1);
      for (var i = 0; i < ordered.length; i++) {
        if (ordered[i].id === targetId) { targetIdx = i; break; }
      }
    }

    var initialBatches = targetIdx >= 0 ? Math.ceil((targetIdx + 1) / BATCH) : 1;
    for (var b = 0; b < initialBatches; b++) appendBatch();

    /* Set up sentinel observer for the rest */
    sentinel = document.querySelector('.col-sentinel');
    if (sentinel) {
      sentinel.hidden = (rendered >= ordered.length);
      if (rendered < ordered.length) {
        observer = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) appendBatch();
        }, { rootMargin: '200px' });
        observer.observe(sentinel);
      }
    }

    /* Scroll to hash target */
    if (location.hash) {
      setTimeout(function () {
        var targetEl = document.getElementById(location.hash.slice(1));
        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }

    /* Preload modal image on hover/touch so it's cached before the user clicks. */
    var grid = document.getElementById('catalog-grid');
    if (grid) {
      grid.addEventListener('mouseover', function (e) {
        var entry = e.target.closest('[data-fragrance-id]');
        if (entry) {
          var id = entry.getAttribute('data-fragrance-id');
          for (var i = 0; i < ordered.length; i++) {
            if (ordered[i].id === id) { preloadModalImg(ordered[i].image || ''); break; }
          }
        }
      });
      grid.addEventListener('touchstart', function (e) {
        var entry = e.target.closest('[data-fragrance-id]');
        if (entry) {
          var id = entry.getAttribute('data-fragrance-id');
          for (var i = 0; i < ordered.length; i++) {
            if (ordered[i].id === id) { preloadModalImg(ordered[i].image || ''); break; }
          }
        }
      }, { passive: true });
    }

    /* ── Event delegation: "Añadir" opens format modal ──────── */
    if (grid) {
      grid.addEventListener('click', function (e) {
        var btn = e.target.closest('.catalog-entry__order-btn');
        if (!btn) return;

        var entry = btn.closest('[data-fragrance-id]');
        if (!entry) return;
        var id = entry.getAttribute('data-fragrance-id');
        var frag = null;
        for (var i = 0; i < ordered.length; i++) {
          if (ordered[i].id === id) { frag = ordered[i]; break; }
        }
        if (!frag) return;
        openFmtModal(frag);
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
