/**
 * Museus Illes Balears — Mapa Leaflet
 * Mostra cada museu com a marcador i obre el modal des del popup.
 */
(function () {
  'use strict';

  const state = window.MuseusApp.state;

  /** Inicialitza el mapa amb tiles OSM i centra-ho als marcadors disponibles. */
  function initMuseumsMap() {
    const el = document.getElementById('map-museus');
    if (!el || typeof L === 'undefined' || !state.museums.length) return;

    const map = L.map('map-museus', {
      scrollWheelZoom: false, // Evita zoom accidental al fer scroll vertical
      attributionControl: true
    });
    state.leafletMap = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);

    // Activem el zoom amb roda només quan l'usuari interactua amb el mapa.
    el.addEventListener('click', () => map.scrollWheelZoom.enable());
    el.addEventListener('mouseleave', () => map.scrollWheelZoom.disable());

    const bounds = [];
    state.museums.forEach(m => {
      const lat = m.geo?.latitude;
      const lon = m.geo?.longitude;
      if (lat == null || lon == null) return;
      bounds.push([lat, lon]);
      const marker = L.marker([lat, lon]).addTo(map);
      const name = Utils.escapeHtml(m.name || '');
      marker.bindPopup(
        `<strong>${name}</strong><br><a href="#museu=${Utils.escapeHtml(m.identifier)}" data-open-modal="${Utils.escapeHtml(m.identifier)}">Veure detalls</a>`
      );
    });

    if (bounds.length === 1) map.setView(bounds[0], 14);
    else if (bounds.length > 1) map.fitBounds(bounds, { padding: [48, 48], maxZoom: 10 });
    else map.setView([39.6, 2.8], 8);

    setTimeout(() => map.invalidateSize(), 100);
  }

  window.MuseusApp.map = { initMuseumsMap };
})();
