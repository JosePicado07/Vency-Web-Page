/* Loads admin-approved custom catalog entries and merges them into the live catalog. */
(function () {
  'use strict';

  fetch('/api/catalog-request')
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (entries) {
      if (!entries.length) return;
      var existing = window.VENCY_FULL_CATALOG || [];
      entries.forEach(function (e) {
        var idx = -1;
        for (var i = 0; i < existing.length; i++) {
          if ((existing[i].brand || '').toLowerCase() === (e.brand || '').toLowerCase()
              && existing[i].name.toLowerCase() === e.name.toLowerCase()) {
            idx = i; break;
          }
        }
        var merged = {
          brand:  (e.brand || '').toUpperCase(),
          name:   e.name,
          cat:    e.cat,
          gender: e.gender || 'unisex',
          notes:  e.notes || '',
          image:  e.imageId ? '/api/catalog-image/' + e.imageId : undefined,
        };
        if (idx >= 0) {
          existing[idx] = merged;
        } else {
          existing.push(merged);
        }
      });
      window.VENCY_FULL_CATALOG = existing;
      if (window.__vencyRebuildCatalog) window.__vencyRebuildCatalog();
    })
    .catch(function () {});
})();
