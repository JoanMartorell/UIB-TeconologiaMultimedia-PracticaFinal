/**
 * Museus Illes Balears — Geolocalització
 * Ordena la llista de museus per proximitat a la posició de l'usuari.
 */
(function () {
  'use strict';

  const state = window.MuseusApp.state;

  /** Cablat del botó "Ordenar per proximitat" (oculta si no hi ha API). */
  function setupGeolocation() {
    const btn = document.getElementById('btn-sort-proximity');
    const status = document.getElementById('sort-status');
    if (!btn) return;

    if (!navigator.geolocation) {
      btn.hidden = true;
      return;
    }

    btn.addEventListener('click', () => {
      btn.disabled = true;
      if (status) status.textContent = 'Obtenint ubicació…';

      navigator.geolocation.getCurrentPosition(
        pos => onSuccess(pos, btn, status),
        err => onError(err, btn, status),
        { timeout: 10000, maximumAge: 300000 }
      );
    });
  }

  function onSuccess(pos, btn, status) {
    state.userCoords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
    state.sortBy = 'proximity';

    const sorted = [...state.museums]
      .map(m => ({
        m,
        dist: m.geo
          ? Utils.haversine(state.userCoords.lat, state.userCoords.lon, m.geo.latitude, m.geo.longitude)
          : Infinity
      }))
      .sort((a, b) => a.dist - b.dist)
      .map(x => x.m);

    state.museums = sorted;
    window.MuseusApp.filters.applyFilters();
    if (status) status.textContent = '📍 Ordenat per proximitat a la teva ubicació';
    btn.disabled = false;
    btn.textContent = '✓ Ordenat per proximitat';
    Utils.showToast('Llista ordenada per proximitat', 'success');
  }

  function onError(err, btn, status) {
    btn.disabled = false;
    if (status) status.textContent = '';
    const msg = err.code === 1
      ? 'Permís de localització denegat'
      : 'No s\'ha pogut obtenir la teva ubicació';
    Utils.showToast(msg, 'error');
  }

  window.MuseusApp.geolocation = { setupGeolocation };
})();
