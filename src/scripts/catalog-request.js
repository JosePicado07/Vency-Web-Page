/* Loads admin-approved custom catalog entries and merges them into the live catalog. */
(function () {
  'use strict';

  fetch('/api/catalog-request')
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (entries) {
      if (!entries.length) return;
      var existing = window.VENCY_FULL_CATALOG || [];
      entries.forEach(function (e) {
        var alreadyIn = existing.some(function (x) {
          return x.brand === e.brand && x.name === e.name;
        });
        if (!alreadyIn) {
          existing.push({
            brand:  e.brand,
            name:   e.name,
            cat:    e.cat,
            gender: e.gender || 'unisex',
            notes:  e.notes || '',
            image:  e.imageId ? '/api/catalog-image/' + e.imageId : undefined,
          });
        }
      });
      window.VENCY_FULL_CATALOG = existing;
      if (window.__vencyRebuildCatalog) window.__vencyRebuildCatalog();
    })
    .catch(function () {});
})();
