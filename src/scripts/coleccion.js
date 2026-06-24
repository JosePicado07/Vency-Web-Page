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
              + '<div class="catalog-entry__fmt-pills">'
                + '<span class="catalog-entry__fmt-pill">Decant 10ml · ₡5.000</span>'
                + '<span class="catalog-entry__fmt-pill">Frasco 30ml · ₡12.000</span>'
                + '<span class="catalog-entry__fmt-pill">Frasco 100ml · ₡20.000</span>'
              + '</div>'
              + '<a class="catalog-entry__order-btn" href="catalogo.html#' + frag.id + '">Ordenar →</a>'
            + '</div>')
        + '</div>'
      + '</div>'

    + '</article>';
  }

  function appendBatch() {
    var gridEl = document.getElementById('catalog-grid');
    if (!gridEl) return;
    var next = ordered.slice(rendered, rendered + BATCH);
    next.forEach(function (frag, batchIdx) {
      gridEl.insertAdjacentHTML('beforeend', renderEntry(frag));
      var el = gridEl.lastElementChild;
      el.style.setProperty('--entry-delay', (batchIdx * 55) + 'ms');
      observeEntry(el);
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
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
