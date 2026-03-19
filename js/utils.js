/**
 * Museus Illes Balears - Utilitats
 * Tecnologia Multimèdia - UIB
 */

const Utils = {
  /** Mostra toast de feedback */
  showToast(message, type = 'success') {
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
  },
  /** Obtiene el valor de additionalProperty por nombre */
  getProperty(museum, name) {
    const props = museum.additionalProperty || [];
    const found = props.find(p => p.name === name);
    return found ? found.value : null;
  },

  /** Obté la ciutat/illa del museu */
  getIsland(museum) {
    const locality = museum.address?.addressLocality || '';
    const name = (museum.name || '').toLowerCase();
    if (locality.includes('Palma') || locality.includes('Mallorca')) return 'Mallorca';
    if (locality.includes('Mahón') || locality.includes('Menorca')) return 'Menorca';
    if (name.includes('formentera')) return 'Formentera';
    if (locality.includes('Ibiza') || locality.includes('Eivissa')) return 'Ibiza';
    return locality || 'Balears';
  },

  /** Formatea las horas de apertura para mostrar */
  formatOpeningHours(hours) {
    if (!hours) return 'Consultar web';
    return hours.replace(/;/g, ' | ');
  },

  /** Almacenamiento local para favoritos (Web Storage API) */
  storage: {
    getFavorites() {
      try {
        const data = localStorage.getItem('museus-favoritos');
        return data ? JSON.parse(data) : [];
      } catch {
        return [];
      }
    },
    setFavorites(ids) {
      try {
        localStorage.setItem('museus-favoritos', JSON.stringify(ids));
        return true;
      } catch {
        return false;
      }
    },
    toggleFavorite(id) {
      const favs = this.getFavorites();
      const idx = favs.indexOf(id);
      if (idx >= 0) favs.splice(idx, 1);
      else favs.push(id);
      this.setFavorites(favs);
      return favs;
    },
    isFavorite(id) {
      return this.getFavorites().includes(id);
    }
  },

  /** Carga datos JSON de forma asíncrona */
  async fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return res.json();
  },

  /** Obtiene parámetros de la URL */
  getUrlParams() {
    return new URLSearchParams(window.location.search);
  }
};
