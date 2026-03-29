/**
 * Museus Illes Balears - Script principal
 * Tecnologia Multimèdia - UIB
 */

(function () {
  'use strict';

  let museumsData = [];
  let museumsLeafletMap = null;
  let museumImagesManifest = {};

  /** Carrusel del hero (pàgina d'inici): rotació automàtica i punts navegables */
  function initHeroCarousel() {
    const root = document.querySelector('.hero-carousel');
    if (!root) return;
    const slides = root.querySelectorAll('.hero-slide');
    if (slides.length <= 1) return;

    let dotsRoot = document.querySelector('.hero-carousel-dots');
    if (!dotsRoot) {
      dotsRoot = document.createElement('div');
      dotsRoot.className = 'hero-carousel-dots';
      dotsRoot.setAttribute('role', 'tablist');
      dotsRoot.setAttribute('aria-label', 'Imatges de la portada');
      const hero = root.closest('.hero-fullscreen') || root.parentElement;
      const filters = hero?.querySelector('.hero-filters');
      if (hero && filters) hero.insertBefore(dotsRoot, filters);
      else root.insertAdjacentElement('afterend', dotsRoot);
    }

    const duration = 5500;
    let active = 0;
    let intervalId = null;

    dotsRoot.innerHTML = '';
    const dotBtns = [];

    function setSlide(index) {
      const n = slides.length;
      const next = ((index % n) + n) % n;
      slides[active].classList.remove('is-active');
      dotBtns[active]?.classList.remove('is-active');
      dotBtns[active]?.setAttribute('aria-selected', 'false');
      dotBtns[active]?.setAttribute('tabindex', '-1');
      active = next;
      slides[active].classList.add('is-active');
      dotBtns[active]?.classList.add('is-active');
      dotBtns[active]?.setAttribute('aria-selected', 'true');
      dotBtns[active]?.setAttribute('tabindex', '0');
    }

    slides.forEach((_, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hero-carousel-dot' + (idx === 0 ? ' is-active' : '');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
      btn.setAttribute('tabindex', idx === 0 ? '0' : '-1');
      btn.setAttribute('aria-label', `Imatge ${idx + 1} de ${slides.length}`);
      btn.addEventListener('click', () => {
        setSlide(idx);
        restartAuto();
      });
      dotsRoot.appendChild(btn);
      dotBtns.push(btn);
    });

    function restartAuto() {
      if (slides.length <= 1) return;
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => setSlide(active + 1), duration);
    }

    restartAuto();
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (intervalId) clearInterval(intervalId);
        intervalId = null;
      } else {
        restartAuto();
      }
    });
  }

  /** Inicialització */
  async function init() {
    initHeroCarousel();
    if (!document.getElementById('museums-grid')) return;
    showLoading();
    try {
      await loadMuseums();
      hideLoading();
      renderMuseums(museumsData);
      initMuseumsMap();
    } catch {
      hideLoading();
    }
    setupFilters();
    setupDrawerMenu();
    setupFavorites();
    setupWeather();
    let rutesJson = [];
    try {
      const raw = await Utils.fetchJSON('data/rutes.json');
      rutesJson = Array.isArray(raw.rutes) ? raw.rutes : [];
    } catch (err) {
      console.error('Error carregant rutes:', err);
    }
    renderRutes(rutesJson);
    injectJSONLD();
  }

  /** Mostra estat de càrrega */
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

  /** Carrega museus des de JSON */
  async function loadMuseums() {
    try {
      const [data, manifest] = await Promise.all([
        Utils.fetchJSON('data/museus.json'),
        Utils.fetchJSON('data/images/manifest.json').catch(() => ({}))
      ]);
      museumsData = data['@graph'] || [];
      museumImagesManifest = manifest && typeof manifest === 'object' ? manifest : {};
    } catch (err) {
      console.error('Error carregant museus:', err);
      const grid = document.getElementById('museums-grid');
      if (grid) {
        grid.innerHTML = `
          <div class="error-state" role="alert">
            <p class="error-state-title">No s'han pogut carregar les dades</p>
            <p class="error-state-desc">Comprova la connexió a internet i torna a intentar-ho.</p>
            <button type="button" class="btn btn-primary" onclick="location.reload()">Tornar a intentar</button>
          </div>
        `;
      }
      throw err;
    }
  }

  /** Renderitza les targetes de museus */
  function renderMuseums(museums) {
    const grid = document.getElementById('museums-grid');
    const noResults = document.getElementById('no-results');
    if (!grid) return;

    if (!museums.length) {
      grid.innerHTML = '';
      noResults.classList.remove('visually-hidden');
      noResults.innerHTML = `
        <div class="empty-state">
          <span class="empty-state-icon" aria-hidden="true">🔍</span>
          <p class="empty-state-title">Cap museu coincideix amb els criteris</p>
          <p class="empty-state-desc">Prova a canviar els filtres. Per exemple, selecciona una altra illa o un estil artístic diferent.</p>
          <button type="button" class="btn btn-secondary" id="btn-clear-filters">Netejar filtres</button>
        </div>
      `;
      noResults.querySelector('#btn-clear-filters')?.addEventListener('click', clearFilters);
      return;
    }

    noResults.classList.add('visually-hidden');
    noResults.innerHTML = 'Cap museu coincideix amb els criteris seleccionats.';
    grid.innerHTML = museums.map(m => createMuseumCard(m)).join('');

    grid.querySelectorAll('[data-favorite]').forEach(btn => {
      btn.addEventListener('click', handleFavoriteClick);
    });
  }

  function clearFilters() {
    const island = document.getElementById('filter-island');
    const style = document.getElementById('filter-style');
    const free = document.getElementById('filter-free');
    [island, style, free].forEach(el => { if (el) el.value = ''; });
    renderMuseums(museumsData);
  }

  /** Crea HTML de targeta de museu */
  function createMuseumCard(m) {
    const id = m.identifier;
    const name = m.name || m.alternateName;
    const desc = (m.description || '').substring(0, 120) + '…';
    const artStyle = Utils.getProperty(m, 'artStyle');
    const island = Utils.getIsland(m);
    const rating = m.aggregateRating?.ratingValue || '-';
    const isFav = Utils.storage.isFavorite(id);
    const detailUrl = `museu.html?id=${id}`;
    const sameAs = (m.sameAs || []).filter(Boolean);
    const galleryFiles = Utils.getMuseumGalleryFiles(id, museumImagesManifest);
    const coverSrc = Utils.museumDataImageUrl(id, galleryFiles[0]);
    const coverAlt = name ? `Imatge: ${name}` : '';

    return `
      <article class="museum-card" role="listitem" itemscope itemtype="https://schema.org/Museum">
        <div class="museum-card-image">
          <img src="${coverSrc}" alt="${escapeHtml(coverAlt)}" width="640" height="400" loading="lazy" decoding="async" itemprop="image" onerror="this.style.display='none'">
        </div>
        <div class="museum-card-body">
          <h3>
            <a href="${detailUrl}" itemprop="name">${escapeHtml(name)}</a>
          </h3>
          <div class="museum-card-meta">
            ${artStyle ? `<span>${escapeHtml(artStyle)}</span>` : ''}
            <span>${escapeHtml(island)}</span>
          </div>
          <p itemprop="description">${escapeHtml(desc)}</p>
          ${sameAs.length ? `
            <div class="museum-card-links">
              ${sameAs.map(url => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="link-external">Wikipedia</a>`).join('')}
            </div>
          ` : ''}
          <div class="museum-card-actions">
            <span class="rating" aria-label="Valoració: ${rating} de 5">★ ${rating}</span>
            <button type="button" class="btn-favorite ${isFav ? 'favorited' : ''}" 
              data-favorite="${id}" 
              aria-label="${isFav ? 'Treure de favorits' : 'Afegir a favorits'}">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /** Mapa Leaflet amb marcadors des de les coordenades del JSON */
  function initMuseumsMap() {
    const el = document.getElementById('map-museus');
    if (!el || typeof L === 'undefined' || !museumsData.length) return;

    const map = L.map('map-museus', {
      scrollWheelZoom: true,
      attributionControl: true
    });
    museumsLeafletMap = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);

    const bounds = [];
    museumsData.forEach(m => {
      const lat = m.geo?.latitude;
      const lon = m.geo?.longitude;
      if (lat == null || lon == null) return;
      bounds.push([lat, lon]);
      const marker = L.marker([lat, lon]).addTo(map);
      const name = escapeHtml(m.name || '');
      marker.bindPopup(
        `<strong>${name}</strong><br><a href="museu.html?id=${m.identifier}">Veure fitxa</a>`
      );
    });

    if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 10 });
    } else {
      map.setView([39.6, 2.8], 8);
    }

    setTimeout(() => map.invalidateSize(), 100);
  }

  /** Filtros */
  function setupFilters() {
    const island = document.getElementById('filter-island');
    const style = document.getElementById('filter-style');
    const free = document.getElementById('filter-free');

    const applyFilters = () => {
      const islandVal = island?.value || '';
      const styleVal = style?.value || '';
      const freeVal = free?.value || '';

      const filtered = museumsData.filter(m => {
        const artStyle = Utils.getProperty(m, 'artStyle') || '';
        const mIsland = Utils.getIsland(m);
        const isFree = m.isAccessibleForFree === true;
        const hasFormentera = (m.name || '').toLowerCase().includes('formentera') || (m.description || '').toLowerCase().includes('formentera');
        if (islandVal === 'Formentera' && !hasFormentera) return false;
        if (islandVal && islandVal !== 'Formentera' && mIsland !== islandVal) return false;
        if (styleVal && !artStyle.includes(styleVal)) return false;
        if (freeVal === 'true' && !isFree) return false;
        if (freeVal === 'false' && isFree) return false;

        return true;
      });

      renderMuseums(filtered);
    };

    [island, style, free].forEach(el => {
      if (el) el.addEventListener('input', applyFilters);
      if (el && el.tagName === 'SELECT') el.addEventListener('change', applyFilters);
    });
  }

  /** Drawer menu mòbil */
  function setupDrawerMenu() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('main-nav');
    const overlay = document.querySelector('.drawer-overlay');
    if (!toggle || !nav) return;

    const open = () => {
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Tancar menú');
      nav.setAttribute('aria-expanded', 'true');
      document.body.classList.add('drawer-open');
    };
    const close = () => {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Obrir menú');
      nav.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('drawer-open');
      setTimeout(() => museumsLeafletMap?.invalidateSize(), 350);
    };

    toggle.addEventListener('click', () => {
      if (toggle.getAttribute('aria-expanded') === 'true') close();
      else open();
    });
    overlay?.addEventListener('click', close);
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
  }

  /** Favorits */
  function handleFavoriteClick(e) {
    const btn = e.currentTarget;
    const id = btn.dataset.favorite;
    const favs = Utils.storage.toggleFavorite(id);
    const isFav = Utils.storage.isFavorite(id);
    btn.classList.toggle('favorited', isFav);
    btn.setAttribute('aria-label', isFav ? 'Treure de favorits' : 'Afegir a favorits');
    const svg = btn.querySelector('svg');
    if (svg) svg.setAttribute('fill', isFav ? 'currentColor' : 'none');
    renderFavorites(favs);
    Utils.showToast(isFav ? 'Guardat a favorits' : 'Tret de favorits', 'success');
  }

  function setupFavorites() {
    renderFavorites(Utils.storage.getFavorites());
  }

  function renderFavorites(ids) {
    const list = document.getElementById('favorites-list');
    if (!list) return;

    const favMuseums = museumsData.filter(m => ids.includes(m.identifier));

    if (favMuseums.length === 0) {
      list.innerHTML = '<p id="favorites-empty" class="favorites-empty">Afegeix museus a favorits per veure\'ls aquí.</p>';
      return;
    }

    list.innerHTML = favMuseums.map(m => `
      <div class="favorite-item" role="listitem">
        <a href="museu.html?id=${m.identifier}">${escapeHtml(m.name)}</a>
        <button type="button" class="btn-favorite favorited" data-favorite="${m.identifier}" aria-label="Treure de favorits">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
    `).join('');

    list.querySelectorAll('[data-favorite]').forEach(btn => {
      btn.addEventListener('click', handleFavoriteClick);
    });
  }

  /** API Meteorologia (Open-Meteo) */
  async function setupWeather() {
    const container = document.getElementById('weather-widget');
    if (!container) return;

    try {
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=39.57&longitude=2.65&current=temperature_2m,weather_code&timezone=Europe/Madrid');
      const data = await res.json();
      const temp = data.current?.temperature_2m ?? '—';
      const code = data.current?.weather_code ?? 0;
      const desc = getWeatherDesc(code);
      container.innerHTML = `
        <span class="weather-temp" aria-label="Temperatura actual">${Math.round(temp)}°C</span>
        <span class="weather-desc">${desc}</span>
      `;
      container.classList.remove('weather-loading');
    } catch {
      container.innerHTML = '<span class="weather-error">Meteorologia no disponible</span>';
      container.classList.remove('weather-loading');
    }
  }

  function getWeatherDesc(code) {
    const map = { 0: 'Despejat', 1: 'Principalment clar', 2: 'Parcialment ennuvolat', 3: 'Ennuvolat', 45: 'Boira', 46: 'Boira gelada', 51: 'Ruixat', 61: 'Pluja lleu', 63: 'Pluja moderada', 80: 'Ruixat', 95: 'Tempesta' };
    return map[code] || 'Meteorologia';
  }

  /** Etiqueta visible per a un museu (dades carregades o id) */
  function rutaMuseumLabel(id) {
    const m = museumsData.find(x => x.identifier === id);
    if (!m) return id;
    return m.alternateName || m.name || id;
  }

  /** Rutes culturals (dades des de data/rutes.json) */
  function renderRutes(rutes) {
    const container = document.getElementById('rutes-list');
    if (!container) return;

    if (!rutes.length) {
      container.innerHTML = `
        <p class="rutes-empty" role="status">No hi ha rutes disponibles en aquest moment.</p>
      `;
      return;
    }

    function illaSlug(illa) {
      const s = (illa || '').toLowerCase();
      if (s.includes('eivissa') || s.includes('ibiza')) return 'eivissa';
      if (s.includes('menorca')) return 'menorca';
      if (s.includes('mallorca')) return 'mallorca';
      if (s.includes('formentera')) return 'formentera';
      return 'balears';
    }

    container.innerHTML = rutes.map(r => {
      const ids = Array.isArray(r.museuIds) ? r.museuIds : [];
      const parades = ids.map((id, i) => {
        const sep = i > 0
          ? '<span class="ruta-parada-arrow" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>'
          : '';
        const label = rutaMuseumLabel(id);
        return `${sep}<a class="ruta-parada" href="museu.html?id=${encodeURIComponent(id)}"><span class="ruta-parada-ord" aria-hidden="true">${i + 1}</span><span class="ruta-parada-text">${escapeHtml(label)}</span></a>`;
      }).join('');

      const illa = r.illa || '';
      const durada = r.durada || '';
      const slug = illaSlug(illa);

      return `
      <article class="ruta-card" data-illa="${escapeHtml(slug)}" role="listitem">
        <div class="ruta-card-top">
          <span class="ruta-badge">${escapeHtml(illa)}</span>
          ${durada ? `<span class="ruta-duration"><svg class="ruta-duration-icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span class="visually-hidden">Durada aproximada: </span>${escapeHtml(durada)}</span>` : ''}
        </div>
        <h3 class="ruta-title">${escapeHtml(r.nom || '')}</h3>
        <p class="ruta-desc">${escapeHtml(r.descripcio || r.desc || '')}</p>
        <div class="ruta-parades-wrap">
          <span class="ruta-parades-label">Parades</span>
          <div class="ruta-parades">${parades}</div>
        </div>
      </article>`;
    }).join('');
  }

  /** JSON-LD per SEO */
  function injectJSONLD() {
    if (!museumsData.length) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': museumsData
    });
    document.head.appendChild(script);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
