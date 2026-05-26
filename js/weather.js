/**
 * Museus Illes Balears — Widget de meteorologia
 * Mostra la temperatura actual de Palma via Open-Meteo (API pública sense clau).
 */
(function () {
  'use strict';

  const CODES = {
    0: 'Despejat', 1: 'Principalment clar', 2: 'Parcialment ennuvolat', 3: 'Ennuvolat',
    45: 'Boira', 48: 'Boira gelada',
    51: 'Plovisqueja', 53: 'Plovisqueja', 55: 'Plovisqueja densa',
    61: 'Pluja lleu', 63: 'Pluja moderada', 65: 'Pluja forta',
    71: 'Neu lleu', 73: 'Neu moderada', 75: 'Neu forta',
    80: 'Ruixats', 81: 'Ruixats moderats', 82: 'Ruixats violents',
    95: 'Tempesta', 96: 'Tempesta amb pedra', 99: 'Tempesta amb pedra'
  };

  /** Demana la meteo actual i pinta-la al header (amb timeout per no penjar). */
  async function setupWeather() {
    const container = document.getElementById('weather-widget');
    if (!container) return;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);

    try {
      const res = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=39.57&longitude=2.65&current=temperature_2m,weather_code&timezone=Europe/Madrid',
        { signal: ctrl.signal }
      );
      clearTimeout(timer);
      if (!res.ok) throw new Error('Meteo HTTP ' + res.status);
      const data = await res.json();
      const temp = data.current?.temperature_2m ?? '—';
      const code = data.current?.weather_code ?? 0;
      container.innerHTML = `
        <span class="weather-temp" aria-label="Temperatura actual">${Math.round(temp)}°C</span>
        <span class="weather-desc">${CODES[code] || 'Meteorologia'}</span>
      `;
      container.classList.remove('weather-loading');
    } catch {
      clearTimeout(timer);
      container.innerHTML = '<span class="weather-error">Meteorologia no disponible</span>';
      container.classList.remove('weather-loading');
    }
  }

  window.MuseusApp.weather = { setupWeather };
})();
