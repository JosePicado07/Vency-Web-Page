(function () {
  'use strict';

  /* ── Load approved dynamic entries into catalog ──────────────── */
  fetch('/api/catalog-request')
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (entries) {
      if (!entries.length) return;
      // Merge into VENCY_FULL_CATALOG so catalogo.js picks them up naturally
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
          });
        }
      });
      window.VENCY_FULL_CATALOG = existing;

      // Re-trigger catalog render if already initialised
      if (window.__vencyRebuildCatalog) window.__vencyRebuildCatalog();
    })
    .catch(function () {});

  /* ── Request modal ───────────────────────────────────────────── */
  var overlay   = document.querySelector('.js-req-overlay');
  var form      = document.querySelector('.js-req-form');
  var submitBtn = document.querySelector('.js-req-submit');
  var statusEl  = document.querySelector('.js-req-status');

  function openModal() {
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    overlay.querySelector('#req-brand').focus();
  }

  function closeModal() {
    overlay.hidden = true;
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.js-cat-req-open').forEach(function (btn) {
    btn.addEventListener('click', openModal);
  });

  document.querySelector('.js-req-close').addEventListener('click', closeModal);

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !overlay.hidden) closeModal();
  });

  function showStatus(msg, isError) {
    statusEl.textContent = msg;
    statusEl.hidden = false;
    statusEl.style.color = isError ? 'var(--color-error, #c0392b)' : 'var(--color-ochre, #b8732e)';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var brand  = form.brand.value.trim();
    var name   = form.name.value.trim();
    var cat    = form.cat.value;
    var gender = form.gender.value;
    var notes  = form.notes.value.trim();

    if (!brand || !name || !cat) {
      showStatus('Completá los campos obligatorios.', true);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando…';
    statusEl.hidden = true;

    fetch('/api/catalog-request', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ brand: brand, name: name, cat: cat, gender: gender, notes: notes }),
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res.dupe) {
          showStatus('Esa fragancia ya fue solicitada. La revisaremos pronto.', false);
        } else if (res.ok) {
          showStatus('¡Solicitud enviada! La revisamos y la agregamos al catálogo.', false);
          form.reset();
        } else {
          showStatus('Algo falló. Intentá de nuevo.', true);
        }
      })
      .catch(function () { showStatus('Sin conexión. Intentá de nuevo.', true); })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar solicitud';
      });
  });
})();
