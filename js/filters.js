/**
 * Museus Illes Balears — Cerca i filtres
 * Únic <form role="search"> que conté text + selects amb validació HTML5.
 */
(function () {
  'use strict';

  const state = window.MuseusApp.state;
  let cachedFiltered = [];

  /** Aplica els filtres actius (text + selects) i refresca el grid. */
  function applyFilters() {
    const f = state.activeFilters;
    const qNorm = Utils.normalize(f.q);

    const filtered = state.museums.filter(m => {
      const artStyle = Utils.getProperty(m, 'artStyle') || '';
      const mIsland = Utils.getIsland(m);
      const isFree = m.isAccessibleForFree === true;
      const haystack = Utils.normalize(`${m.name || ''} ${m.alternateName || ''} ${m.description || ''}`);

      if (qNorm && !haystack.includes(qNorm)) return false;
      if (f.island && mIsland !== f.island) return false;
      if (f.style && !artStyle.includes(f.style)) return false;
      if (f.free === 'true' && !isFree) return false;
      if (f.free === 'false' && isFree) return false;
      return true;
    });

    cachedFiltered = filtered;
    window.MuseusApp.render.renderMuseums(filtered);
    updateValidity(filtered.length);
    return filtered;
  }

  /** Si la cerca dona 0 resultats, mostra missatge accessible (no bloqueja). */
  function updateValidity(resultCount) {
    const input = document.getElementById('filter-q');
    const output = document.getElementById('search-error');
    if (!input || !output) return;

    const hasQuery = !!input.value.trim();
    if (hasQuery && resultCount === 0) {
      const msg = `Cap museu coincideix amb "${input.value.trim()}". Prova un altre terme.`;
      output.textContent = msg;
      output.classList.remove('visually-hidden');
      input.setAttribute('aria-invalid', 'true');
    } else {
      output.textContent = '';
      output.classList.add('visually-hidden');
      input.removeAttribute('aria-invalid');
    }
  }

  /** True si l'usuari té algun filtre actiu (text o select). */
  function hasActiveFilters() {
    const f = state.activeFilters;
    return !!(f.q || f.island || f.style || f.free);
  }

  /** Mostra/amaga el botó Netejar segons hi hagi filtres aplicats. */
  function updateClearButtonVisibility() {
    const btn = document.getElementById('btn-clear-filters-form');
    if (!btn) return;
    btn.hidden = !hasActiveFilters();
  }

  /** Scroll suau a la secció de museus (per a quan l'usuari clica Cercar). */
  function scrollToResults() {
    const target = document.getElementById('museus');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** Cablat únic del formulari (submit, reset, change, input amb debounce). */
  function setupFilters() {
    const form = document.getElementById('filters-form');
    if (!form) return;

    const q = form.querySelector('#filter-q');
    const island = form.querySelector('#filter-island');
    const style = form.querySelector('#filter-style');
    const free = form.querySelector('#filter-free');

    const syncAndApply = () => {
      state.activeFilters = {
        q: q?.value || '',
        island: island?.value || '',
        style: style?.value || '',
        free: free?.value || ''
      };
      applyFilters();
      updateClearButtonVisibility();
    };

    // Submit (click "Cercar" o Enter): aplica filtres i fa scroll als resultats.
    form.addEventListener('submit', e => {
      e.preventDefault();
      syncAndApply();
      scrollToResults();
    });

    form.addEventListener('reset', () => {
      // Esperem un tick per a que el reset s'hagi propagat als camps.
      setTimeout(syncAndApply, 0);
    });

    [island, style, free].forEach(el => el?.addEventListener('change', syncAndApply));
    q?.addEventListener('input', Utils.debounce(syncAndApply, 200));

    updateClearButtonVisibility();
  }

  function getFiltered() { return cachedFiltered.length ? cachedFiltered : state.museums; }

  window.MuseusApp.filters = { setupFilters, applyFilters, getFiltered };
})();
