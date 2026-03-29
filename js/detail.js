/**
 * Museus Illes Balears - Pàgina de detall del museu
 * Tecnologia Multimèdia - UIB
 */

(function () {
  'use strict';

  let allMuseums = [];

  async function init() {
    const params = Utils.getUrlParams();
    const id = params.get('id');
    if (!id) {
      renderError('No s\'ha especificat cap museu.');
      return;
    }

    try {
      const [data, manifest] = await Promise.all([
        Utils.fetchJSON('data/museus.json'),
        Utils.fetchJSON('data/images/manifest.json').catch(() => ({}))
      ]);
      allMuseums = data['@graph'] || [];
      const museum = allMuseums.find(m => m.identifier === id);

      if (!museum) {
        renderError('Museu no trobat.');
        return;
      }

      const imageManifest = manifest && typeof manifest === 'object' ? manifest : {};
      renderMuseum(museum, allMuseums, imageManifest);
      setupDrawerMenu();
    } catch (err) {
      renderError('Error en carregar les dades.');
    }
  }

  function renderError(msg) {
    const article = document.getElementById('museu-article');
    if (article) {
      article.innerHTML = `<div class="museu-body"><p>${msg}</p><a href="index.html" class="btn btn-primary">Tornar a l'inici</a></div>`;
    }
  }

  /** Museus relacionats (mateixa illa o estil) */
  function getRelatedMuseums(museum, all, limit = 3) {
    const artStyle = Utils.getProperty(museum, 'artStyle');
    const island = Utils.getIsland(museum);
    return all
      .filter(m => m.identifier !== museum.identifier)
      .sort((a, b) => {
        const aStyle = Utils.getProperty(a, 'artStyle');
        const bStyle = Utils.getProperty(b, 'artStyle');
        const aIsland = Utils.getIsland(a);
        const bIsland = Utils.getIsland(b);
        let scoreA = 0, scoreB = 0;
        if (aStyle === artStyle) scoreA += 2;
        if (aIsland === island) scoreA += 1;
        if (bStyle === artStyle) scoreB += 2;
        if (bIsland === island) scoreB += 1;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  /** Web Speech API: llegeix només el text pla de la descripció */
  function setupDescriptionTTS(descriptionPlain) {
    const btn = document.getElementById('btn-tts-museu');
    if (!btn || !window.speechSynthesis) return;

    btn.addEventListener('click', () => {
      window.speechSynthesis.cancel();
      const clean = (descriptionPlain || '').replace(/\s+/g, ' ').trim();
      if (!clean) return;

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    });
  }

  function renderMuseum(m, all, imageManifest) {
    const artStyle = Utils.getProperty(m, 'artStyle');
    const foundingDate = Utils.getProperty(m, 'foundingDate');
    const address = m.address;
    const fullAddress = address ? [address.streetAddress, address.addressLocality].filter(Boolean).join(', ') : '';
    const isFav = Utils.storage.isFavorite(m.identifier);
    const sameAs = (m.sameAs || []).filter(Boolean);
    const related = getRelatedMuseums(m, all);
    const galleryFiles = Utils.getMuseumGalleryFiles(m.identifier, imageManifest);
    const galleryHtml = galleryFiles.length
      ? `
        <div class="museu-gallery" aria-label="Galeria d'imatges del museu">
          ${galleryFiles.map((file, i) => {
            const src = Utils.museumDataImageUrl(m.identifier, file);
            const alt = `${m.name || 'Museu'} — imatge ${i + 1}`;
            const eager = i === 0 ? ' fetchpriority="high"' : '';
            return `<img src="${src}" alt="${escapeHtml(alt)}" width="1200" height="800" loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async"${eager} itemprop="image">`;
          }).join('')}
        </div>
      `
      : '';

    const html = `
      <header class="museu-header">
        <h1 itemprop="name">${escapeHtml(m.name)}</h1>
        ${m.alternateName ? `<p class="alternate-name">${escapeHtml(m.alternateName)}</p>` : ''}
      </header>
      ${galleryHtml}
      <div class="museu-body">
        <div class="museu-description-block">
          <p id="museu-description-text" itemprop="description">${escapeHtml(m.description)}</p>
          ${window.speechSynthesis && (m.description || '').trim() ? `
          <button type="button" id="btn-tts-museu" class="btn-tts btn-tts-museu" aria-describedby="museu-description-text" aria-label="Llegir la descripció del museu en veu alta">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
            Llegir descripció en veu alta
          </button>
          ` : ''}
        </div>

        <div class="info-grid">
          ${address ? `
          <div class="info-item">
            <strong>Adreça</strong>
            <span itemprop="address" itemscope itemtype="https://schema.org/PostalAddress">
              ${escapeHtml(fullAddress)}
            </span>
          </div>
          ` : ''}
          ${m.telephone ? `
          <div class="info-item">
            <strong>Telèfon</strong>
            <a href="tel:${m.telephone}" itemprop="telephone">${escapeHtml(m.telephone)}</a>
          </div>
          ` : ''}
          ${m.openingHours ? `
          <div class="info-item">
            <strong>Horari</strong>
            <span>${escapeHtml(Utils.formatOpeningHours(m.openingHours))}</span>
          </div>
          ` : ''}
          ${artStyle ? `
          <div class="info-item">
            <strong>Estil</strong>
            <span>${escapeHtml(artStyle)}</span>
          </div>
          ` : ''}
          ${foundingDate ? `
          <div class="info-item">
            <strong>Any fundació</strong>
            <span>${escapeHtml(foundingDate)}</span>
          </div>
          ` : ''}
          ${m.aggregateRating ? `
          <div class="info-item">
            <strong>Valoració</strong>
            <span itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating">
              ${m.aggregateRating.ratingValue}/5 (${m.aggregateRating.reviewCount} valoracions)
            </span>
          </div>
          ` : ''}
          ${m.isAccessibleForFree ? `
          <div class="info-item">
            <strong>Entrada</strong>
            <span>Gratuïta</span>
          </div>
          ` : ''}
        </div>

        <div class="museu-actions">
          ${m.url ? `<a href="${m.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Visitar web oficial</a>` : ''}
          ${m.hasMap ? `<a href="${m.hasMap}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">Veure al mapa</a>` : ''}
          <button type="button" class="btn-favorite ${isFav ? 'favorited' : ''}" data-favorite="${m.identifier}" aria-label="${isFav ? 'Treure de favorits' : 'Afegir a favorits'}">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span class="fav-label">${isFav ? 'A favorits' : 'Afegir a favorits'}</span>
          </button>
        </div>

        ${sameAs.length ? `
        <div class="museu-external-links">
          <strong>Més informació</strong>
          ${sameAs.map(url => `<a href="${url}" target="_blank" rel="noopener noreferrer">Wikipedia ↗</a>`).join(' ')}
        </div>
        ` : ''}

        ${related.length ? `
        <div class="museu-related">
          <h3>Museus relacionats</h3>
          <ul>
            ${related.map(r => `<li><a href="museu.html?id=${r.identifier}">${escapeHtml(r.name)}</a></li>`).join('')}
          </ul>
        </div>
        ` : ''}
      </div>
    `;

    const article = document.getElementById('museu-article');
    if (article) {
      article.innerHTML = html;
      article.setAttribute('itemscope', '');
      article.setAttribute('itemtype', 'https://schema.org/Museum');

      document.title = `${m.name} | Museus Illes Balears`;

      const favBtn = article.querySelector('[data-favorite]');
      if (favBtn) {
        const labelSpan = favBtn.querySelector('.fav-label');
        favBtn.addEventListener('click', () => {
          Utils.storage.toggleFavorite(m.identifier);
          const isFav = Utils.storage.isFavorite(m.identifier);
          favBtn.classList.toggle('favorited', isFav);
          favBtn.setAttribute('aria-label', isFav ? 'Treure de favorits' : 'Afegir a favorits');
          const svg = favBtn.querySelector('svg');
          if (svg) svg.setAttribute('fill', isFav ? 'currentColor' : 'none');
          if (labelSpan) labelSpan.textContent = isFav ? 'A favorits' : 'Afegir a favorits';
          Utils.showToast(isFav ? 'Guardat a favorits' : 'Tret de favorits', 'success');
        });
      }

      setupDescriptionTTS(m.description || '');
    }
  }

  function setupDrawerMenu() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('main-nav');
    const overlay = document.querySelector('.drawer-overlay');
    if (!toggle || !nav) return;

    const close = () => {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Obrir menú');
      document.body.classList.remove('drawer-open');
    };

    toggle.addEventListener('click', () => {
      if (toggle.getAttribute('aria-expanded') === 'true') close();
      else {
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', 'Tancar menú');
        document.body.classList.add('drawer-open');
      }
    });
    overlay?.addEventListener('click', close);
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
