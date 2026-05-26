/**
 * Museus Illes Balears — Render del DOM
 * Genera HTML per a cards, rutes i estats (loading/empty/error).
 */
(function () {
  'use strict';

  const state = window.MuseusApp.state;

  /** Skeleton cards mentre es carreguen els museus. */
  function showLoading() {
    const grid = document.getElementById('museums-grid');
    if (!grid) return;
    grid.innerHTML = Array(6).fill(0).map(() => `
      <div class="skeleton-card" aria-hidden="true">
        <div class="skeleton-image"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
        <div class="skeleton-line"></div>
      </div>
    `).join('');
    document.getElementById('no-results')?.classList.add('visually-hidden');
  }

  function hideLoading() {
    const grid = document.getElementById('museums-grid');
    if (grid && grid.querySelector('.skeleton-card')) grid.innerHTML = '';
  }

  /** Etiqueta llegible per enllaç extern (Wikipedia, Wikidata o genèric). */
  function sameAsLinkLabel(url) {
    try {
      const h = new URL(url).hostname.replace(/^www\./, '');
      if (h.includes('wikipedia')) return 'Wikipedia';
      if (h.includes('wikidata')) return 'Wikidata';
      return 'Enllaç extern';
    } catch { return 'Enllaç'; }
  }

  /** Genera l'<img> de portada amb lazy-loading i alt accessible. */
  function pictureHtml(coverSrc, name) {
    if (!coverSrc) return '';
    const alt = Utils.escapeHtml(name ? `Imatge del museu ${name}` : '');
    return `<img src="${Utils.escapeHtml(coverSrc)}" alt="${alt}" width="640" height="400" loading="lazy" decoding="async" itemprop="image" data-fallback>`;
  }

  /** Card resumida d'un museu — l'usuari fa clic per obrir el modal de detall. */
  function createMuseumCard(m) {
    const id = m.identifier;
    const name = m.name || m.alternateName;
    const rawDesc = m.description || '';
    const desc = rawDesc.length > 120 ? `${rawDesc.substring(0, 120)}…` : rawDesc;
    const artStyle = Utils.getProperty(m, 'artStyle');
    const island = Utils.getIsland(m);
    const rating = m.aggregateRating?.ratingValue ?? '-';
    const isFav = Utils.storage.isFavorite(id);
    const sameAs = (m.sameAs || []).filter(Boolean);
    const coverSrc = (Array.isArray(m.image) && m.image.length && m.image[0]) ? m.image[0] : '';

    return `
      <article class="museum-card" role="listitem" itemscope itemtype="https://schema.org/Museum">
        <div class="museum-card-image">
          ${pictureHtml(coverSrc, name)}
        </div>
        <div class="museum-card-body">
          <h3>
            <a href="#museu=${Utils.escapeHtml(id)}" data-open-modal="${Utils.escapeHtml(id)}" itemprop="name">${Utils.escapeHtml(name)}</a>
          </h3>
          <div class="museum-card-meta">
            ${artStyle ? `<span>${Utils.escapeHtml(artStyle)}</span>` : ''}
            <span>${Utils.escapeHtml(island)}</span>
          </div>
          <p itemprop="description">${Utils.escapeHtml(desc)}</p>
          ${sameAs.length ? `
            <div class="museum-card-links">
              ${sameAs.map(url => `<a href="${Utils.escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="link-external">${Utils.escapeHtml(sameAsLinkLabel(url))}</a>`).join('')}
            </div>
          ` : ''}
          <div class="museum-card-actions">
            <span class="rating" aria-label="Valoració: ${Utils.escapeHtml(String(rating))} de 5">★ ${Utils.escapeHtml(String(rating))}</span>
            <button type="button" class="btn-favorite ${isFav ? 'favorited' : ''}"
              data-favorite="${Utils.escapeHtml(id)}"
              aria-label="${isFav ? 'Treure de favorits' : 'Afegir a favorits'}">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  /** Pinta el grid de museus o l'estat empty si la llista està buida. */
  function renderMuseums(museums) {
    const grid = document.getElementById('museums-grid');
    const noResults = document.getElementById('no-results');
    if (!grid) return;

    if (!museums.length) {
      grid.innerHTML = '';
      noResults?.classList.remove('visually-hidden');
      if (noResults) {
        noResults.innerHTML = `
          <div class="empty-state">
            <span class="empty-state-icon" aria-hidden="true">🔍</span>
            <p class="empty-state-title">Cap museu coincideix amb els criteris</p>
            <p class="empty-state-desc">Prova a canviar els filtres o el text de cerca.</p>
            <button type="button" class="btn btn-secondary" id="btn-clear-filters">Netejar filtres</button>
          </div>
        `;
        noResults.querySelector('#btn-clear-filters')?.addEventListener('click', () => {
          document.getElementById('filters-form')?.reset();
          window.MuseusApp.filters?.applyFilters();
        });
      }
      return;
    }

    noResults?.classList.add('visually-hidden');
    if (noResults) noResults.innerHTML = 'Cap museu coincideix amb els criteris seleccionats.';
    grid.innerHTML = museums.map(createMuseumCard).join('');

    // Si una imatge falla, amaguem l'<img> per deixar el gradient de fons del card.
    grid.querySelectorAll('img[data-fallback]').forEach(img => {
      img.addEventListener('error', () => { img.style.display = 'none'; });
    });
  }

  /** Calcula slug d'illa per a la card de ruta (afecta el color d'accent CSS). */
  function illaSlug(illa) {
    const s = (illa || '').toLowerCase();
    if (s.includes('eivissa') || s.includes('ibiza')) return 'eivissa';
    if (s.includes('menorca')) return 'menorca';
    if (s.includes('mallorca')) return 'mallorca';
    if (s.includes('formentera')) return 'formentera';
    return 'balears';
  }

  /** Etiqueta del museu dins una ruta (nom curt si existeix). */
  function rutaMuseumLabel(id) {
    const m = state.museums.find(x => x.identifier === id);
    if (!m) return id;
    return m.alternateName || m.name || id;
  }

  /** Pinta el llistat de rutes culturals amb les parades enllaçades al modal. */
  function renderRutes(rutes) {
    const container = document.getElementById('rutes-list');
    if (!container) return;

    if (!rutes.length) {
      container.innerHTML = `<p class="rutes-empty" role="status">No hi ha rutes disponibles en aquest moment.</p>`;
      return;
    }

    container.innerHTML = rutes.map(r => {
      const ids = Array.isArray(r.museuIds) ? r.museuIds : [];
      const parades = ids.map((id, i) => {
        const sep = i > 0
          ? '<span class="ruta-parada-arrow" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>'
          : '';
        const label = rutaMuseumLabel(id);
        return `${sep}<a class="ruta-parada" href="#museu=${Utils.escapeHtml(id)}" data-open-modal="${Utils.escapeHtml(id)}"><span class="ruta-parada-ord" aria-hidden="true">${i + 1}</span><span class="ruta-parada-text">${Utils.escapeHtml(label)}</span></a>`;
      }).join('');

      const illa = r.illa || '';
      const durada = r.durada || '';
      const slug = illaSlug(illa);

      return `
      <article class="ruta-card" data-illa="${Utils.escapeHtml(slug)}" role="listitem">
        <div class="ruta-card-top">
          <span class="ruta-badge">${Utils.escapeHtml(illa)}</span>
          ${durada ? `<span class="ruta-duration"><svg class="ruta-duration-icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span class="visually-hidden">Durada aproximada: </span>${Utils.escapeHtml(durada)}</span>` : ''}
        </div>
        <h3 class="ruta-title">${Utils.escapeHtml(r.nom || '')}</h3>
        <p class="ruta-desc">${Utils.escapeHtml(r.descripcio || r.desc || '')}</p>
        <div class="ruta-parades-wrap">
          <span class="ruta-parades-label">Parades</span>
          <div class="ruta-parades">${parades}</div>
        </div>
      </article>`;
    }).join('');
  }

  /** Selecciona fins a `limit` museus relacionats (mateix estil o illa). */
  function getRelatedMuseums(museum, limit = 3) {
    const artStyle = Utils.getProperty(museum, 'artStyle');
    const island = Utils.getIsland(museum);
    return state.museums
      .filter(m => m.identifier !== museum.identifier)
      .map(m => {
        let score = 0;
        if (Utils.getProperty(m, 'artStyle') === artStyle) score += 2;
        if (Utils.getIsland(m) === island) score += 1;
        return { m, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(x => x.m);
  }

  /** Injecta JSON-LD Schema.org amb tots els museus al <head>. */
  function injectJSONLD() {
    if (!state.museums.length) return;
    const existing = document.getElementById('museums-jsonld');
    if (existing) existing.remove();
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'museums-jsonld';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': state.museums
    });
    document.head.appendChild(script);
  }

  window.MuseusApp.render = {
    showLoading, hideLoading, renderMuseums, renderRutes,
    createMuseumCard, getRelatedMuseums, injectJSONLD, sameAsLinkLabel
  };
})();
