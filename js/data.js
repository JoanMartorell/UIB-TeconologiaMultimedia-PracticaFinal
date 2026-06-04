/**
 * Museus Illes Balears — Càrrega de dades
 * Encapsula totes les peticions a fitxers JSON locals i mostra UI d'error.
 */
(function () {
  'use strict';

  const state = window.MuseusApp.state;

  /** Pinta un missatge d'error reintentable dins el grid de museus. */
  function showLoadError() {
    const grid = document.getElementById('museums-grid');
    if (!grid) return;
    grid.innerHTML = `
      <div class="error-state" role="alert">
        <p class="error-state-title">No s'han pogut carregar les dades</p>
        <p class="error-state-desc">Comprova la connexió a internet i torna a intentar-ho.</p>
        <button type="button" class="btn btn-primary" onclick="location.reload()">Tornar a intentar</button>
      </div>
    `;
  }

  /** Carrega `museus.json` i el manifest d'imatges en paral·lel. */
  async function loadMuseums() {
    try {
      const [data, manifest] = await Promise.all([
        Utils.fetchJSON('data/museus.json'),
        Utils.fetchJSON('media/images/museus/manifest.json').catch(() => ({}))
      ]);
      state.museums = data['@graph'] || [];
      state.imagesManifest = manifest && typeof manifest === 'object' ? manifest : {};
      return state.museums;
    } catch (err) {
      console.error('Error carregant museus:', err);
      showLoadError();
      throw err;
    }
  }

  /** Carrega `rutes.json` (errors silenciats, només log). */
  async function loadRutes() {
    try {
      const raw = await Utils.fetchJSON('data/rutes.json');
      state.rutes = Array.isArray(raw.rutes) ? raw.rutes : [];
    } catch (err) {
      console.error('Error carregant rutes:', err);
      state.rutes = [];
    }
    return state.rutes;
  }

  window.MuseusApp.data = { loadMuseums, loadRutes };
})();
