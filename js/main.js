/**
 * Museus Illes Balears - Script principal
 * Tecnologia Multimèdia - UIB
 */

(function () {
  'use strict';

  let museumsData = [];
  let museumsLeafletMap = null;

  /** Inicialització */
  async function init() {
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
    setupGeolocation();
    setupWeather();
    setupRutes();
    setupPersistentSearch();
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
      const data = await Utils.fetchJSON('data/museus.json');
      museumsData = data['@graph'] || [];
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
          <p class="empty-state-desc">Prova a canviar els filtres o la cerca. Per exemple, selecciona una altra illa o un estil artístic diferent.</p>
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
    const search = document.getElementById('search-input');
    const island = document.getElementById('filter-island');
    const style = document.getElementById('filter-style');
    const free = document.getElementById('filter-free');
    [search, island, style, free].forEach(el => { if (el) el.value = ''; });
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

    return `
      <article class="museum-card" role="listitem" itemscope itemtype="https://schema.org/Museum">
        <div class="museum-card-image" aria-hidden="true">🏛️</div>
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
    const search = document.getElementById('search-input');
    const island = document.getElementById('filter-island');
    const style = document.getElementById('filter-style');
    const free = document.getElementById('filter-free');

    const applyFilters = () => {
      const q = (search?.value || '').toLowerCase();
      const islandVal = island?.value || '';
      const styleVal = style?.value || '';
      const freeVal = free?.value || '';

      const filtered = museumsData.filter(m => {
        const name = (m.name || '').toLowerCase();
        const desc = (m.description || '').toLowerCase();
        const artStyle = Utils.getProperty(m, 'artStyle') || '';
        const mIsland = Utils.getIsland(m);
        const isFree = m.isAccessibleForFree === true;
        const hasFormentera = (m.name || '').toLowerCase().includes('formentera') || (m.description || '').toLowerCase().includes('formentera');

        if (q && !name.includes(q) && !desc.includes(q)) return false;
        if (islandVal === 'Formentera' && !hasFormentera) return false;
        if (islandVal && islandVal !== 'Formentera' && mIsland !== islandVal) return false;
        if (styleVal && !artStyle.includes(styleVal)) return false;
        if (freeVal === 'true' && !isFree) return false;
        if (freeVal === 'false' && isFree) return false;

        return true;
      });

      renderMuseums(filtered);
    };

    [search, island, style, free].forEach(el => {
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

  /** Geolocalització (Geolocation API) */
  function setupGeolocation() {
    const btn = document.getElementById('btn-geolocation');
    if (!btn || !navigator.geolocation) return;

    btn.addEventListener('click', () => {
      btn.disabled = true;
      btn.innerHTML = '<span class="btn-spinner"></span> Obtenint ubicació…';

      navigator.geolocation.getCurrentPosition(
        pos => {
          const { latitude, longitude } = pos.coords;
          const sorted = [...museumsData].sort((a, b) => {
            const distA = distance(latitude, longitude, a.geo?.latitude, a.geo?.longitude);
            const distB = distance(latitude, longitude, b.geo?.latitude, b.geo?.longitude);
            return distA - distB;
          });
          renderMuseums(sorted);
          Utils.showToast('Ordenat per proximitat', 'success');
          btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Museus propers';
          btn.disabled = false;
        },
        () => {
          btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Museus propers';
          btn.disabled = false;
          Utils.showToast('No s\'ha pogut obtenir la ubicació. Comprova els permisos.', 'error');
        }
      );
    });
  }

  function distance(lat1, lon1, lat2, lon2) {
    if (!lat2 || !lon2) return Infinity;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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

  /** Rutes culturals */
  function setupRutes() {
    const container = document.getElementById('rutes-list');
    if (!container || !museumsData.length) return;

    const rutes = [
      { nom: 'Art contemporani a Palma', illes: ['Mallorca'], desc: 'Es Baluard i Fundació Miró en un dia', ids: ['M001', 'M004'] },
      { nom: 'Patrimoni arqueològic a Eivissa', illes: ['Ibiza'], desc: 'MACE i MAEF: art i arqueologia a Dalt Vila', ids: ['M003', 'M005'] },
      { nom: 'Història de Menorca', illes: ['Menorca'], desc: 'Museu de Menorca i cultura talayòtica', ids: ['M002'] }
    ];

    container.innerHTML = rutes.map(r => `
      <div class="ruta-card">
        <h3>${escapeHtml(r.nom)}</h3>
        <p>${escapeHtml(r.desc)}</p>
        <div class="ruta-museus">
          ${r.ids.map(id => {
            const m = museumsData.find(x => x.identifier === id);
            return m ? `<a href="museu.html?id=${id}">${escapeHtml(m.name)}</a>` : '';
          }).filter(Boolean).join(' → ')}
        </div>
      </div>
    `).join('');
  }

  /** Cercador persistent */
  function setupPersistentSearch() {
    const searchSticky = document.getElementById('search-sticky');
    const searchInput = document.getElementById('search-input');
    const searchStickyInput = document.getElementById('search-sticky-input');
    if (!searchSticky || !searchInput || !searchStickyInput) return;

    const obs = new IntersectionObserver(([e]) => {
      searchSticky.classList.toggle('visible', !e.isIntersecting);
    }, { threshold: 0 });

    const filtersSection = document.getElementById('filtros');
    if (filtersSection) obs.observe(filtersSection);

    searchStickyInput.addEventListener('input', (e) => {
      searchInput.value = e.target.value;
      searchInput.dispatchEvent(new Event('input'));
    });
    searchInput.addEventListener('input', (e) => {
      searchStickyInput.value = e.target.value;
    });
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
