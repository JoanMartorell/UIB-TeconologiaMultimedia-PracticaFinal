/**
 * Museus Illes Balears — Favorits
 * Persisteix la llista d'IDs a localStorage i sincronitza els botons del grid.
 */
(function () {
  'use strict';

  const state = window.MuseusApp.state;

  /** Click sobre qualsevol botó `[data-favorite]` del grid o la llista. */
  function handleFavoriteClick(e) {
    const btn = e.currentTarget;
    const id = btn.dataset.favorite;
    Utils.storage.toggleFavorite(id);
    const isFav = Utils.storage.isFavorite(id);
    btn.classList.toggle('favorited', isFav);
    btn.setAttribute('aria-label', isFav ? 'Treure de favorits' : 'Afegir a favorits');
    const svg = btn.querySelector('svg');
    if (svg) svg.setAttribute('fill', isFav ? 'currentColor' : 'none');
    refresh();
    Utils.showToast(isFav ? 'Guardat a favorits' : 'Tret de favorits', 'success');
  }

  /** Pinta la llista actual de favorits a la secció #favoritos. */
  function renderFavorites(ids) {
    const list = document.getElementById('favorites-list');
    if (!list) return;

    const favMuseums = state.museums.filter(m => ids.includes(m.identifier));

    if (!favMuseums.length) {
      list.innerHTML = `<p id="favorites-empty" class="favorites-empty">Afegeix museus a favorits per veure'ls aquí.</p>`;
      return;
    }

    list.innerHTML = favMuseums.map(m => `
      <div class="favorite-item" role="listitem">
        <a href="#museu=${Utils.escapeHtml(m.identifier)}" data-open-modal="${Utils.escapeHtml(m.identifier)}">${Utils.escapeHtml(m.name)}</a>
        <button type="button" class="btn-favorite favorited" data-favorite="${Utils.escapeHtml(m.identifier)}" aria-label="Treure de favorits">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
    `).join('');

    list.querySelectorAll('[data-favorite]').forEach(btn => btn.addEventListener('click', handleFavoriteClick));
  }

  /** Re-cablat de tots els botons de favorit dins el grid principal. */
  function bindGridFavorites() {
    document.querySelectorAll('#museums-grid [data-favorite]').forEach(btn => {
      btn.removeEventListener('click', handleFavoriteClick);
      btn.addEventListener('click', handleFavoriteClick);
    });
  }

  /** Refresca grid + llista després d'un canvi de favorits. */
  function refresh() {
    bindGridFavorites();
    renderFavorites(Utils.storage.getFavorites());
  }

  function setupFavorites() { refresh(); }

  window.MuseusApp.favorites = { setupFavorites, renderFavorites, refresh };
})();
