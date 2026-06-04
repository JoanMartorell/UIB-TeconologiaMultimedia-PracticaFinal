/**
 * Museus Illes Balears — Utilitats
 * Helpers purs reutilitzats per tots els mòduls (sense estat, sense DOM intrusiu).
 */
(function () {
  'use strict';

  /** Escapa text per inserir-lo dins HTML sense risc d'XSS. */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
  }

  /** Normalitza una cadena per comparar-la sense accents ni majúscules. */
  function normalize(str) {
    return (str || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  /** Distància en km entre dos punts (fórmula haversine). */
  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  /** Retarda l'execució d'fn fins ms ms després de l'última crida. */
  function debounce(fn, ms) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  /** Toast de feedback efímer (substitueix l'existent en pantalla). */
  function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-visible'));
    setTimeout(() => {
      toast.classList.remove('toast-visible');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  /** Recupera el valor d'una `additionalProperty` Schema.org pel seu nom. */
  function getProperty(museum, name) {
    const props = museum?.additionalProperty || [];
    const found = props.find(p => p.name === name);
    return found ? found.value : null;
  }

  /** Dedueix l'illa del museu a partir de l'adreça (o el nom com a fallback). */
  function getIsland(museum) {
    const locality = museum?.address?.addressLocality || '';
    const name = (museum?.name || '').toLowerCase();
    if (locality.includes('Palma') || locality.includes('Mallorca') ||
        locality === 'Sóller' || locality === 'Alcúdia') return 'Mallorca';
    if (locality === 'Maó' || locality === 'Mahón' || locality === 'Alaior' || locality.includes('Menorca')) return 'Menorca';
    if (name.includes('formentera')) return 'Formentera';
    if (locality.includes('Eivissa') || locality.includes('Ibiza')) return 'Eivissa';
    return locality || 'Balears';
  }

  /** Format llegible de les hores d'obertura (substitueix `;` per separador visual). */
  function formatOpeningHours(hours) {
    if (!hours) return 'Consultar web';
    return hours.replace(/;/g, ' | ');
  }

  /** Wrapper sobre localStorage per gestionar la llista d'IDs favorits. */
  const storage = {
    KEY: 'museus-favoritos',
    getFavorites() {
      try {
        const data = localStorage.getItem(this.KEY);
        return data ? JSON.parse(data) : [];
      } catch { return []; }
    },
    setFavorites(ids) {
      try { localStorage.setItem(this.KEY, JSON.stringify(ids)); return true; }
      catch { return false; }
    },
    toggleFavorite(id) {
      const favs = this.getFavorites();
      const idx = favs.indexOf(id);
      if (idx >= 0) favs.splice(idx, 1); else favs.push(id);
      this.setFavorites(favs);
      return favs;
    },
    isFavorite(id) { return this.getFavorites().includes(id); }
  };

  /** Fetch JSON amb llançament d'error si la resposta no és OK. */
  async function fetchJSON(url, options = {}) {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`Error ${res.status} carregant ${url}`);
    return res.json();
  }

  /** Llegeix els query params actuals com a URLSearchParams. */
  function getUrlParams() {
    return new URLSearchParams(window.location.search);
  }

  /** Construeix la URL d'una imatge local del museu. */
  function museumDataImageUrl(identifier, filename) {
    if (!identifier || !filename) return '';
    return `media/images/museus/${identifier}/${filename}`;
  }

  /** Llista de fitxers d'imatge per a un museu (manifest o `01.jpg` per defecte). */
  function getMuseumGalleryFiles(identifier, manifest) {
    const files = manifest?.[identifier];
    if (Array.isArray(files) && files.length) return files;
    return ['01.jpg'];
  }

  // Exposem l'API global
  window.Utils = {
    escapeHtml, normalize, haversine, debounce, showToast,
    getProperty, getIsland, formatOpeningHours,
    storage, fetchJSON, getUrlParams,
    museumDataImageUrl, getMuseumGalleryFiles
  };
})();
