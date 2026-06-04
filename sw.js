/**
 * Museus Illes Balears — Service Worker
 * Estratègia: cache-first per al shell, network-first per als JSON, fallback offline.
 */
const CACHE = 'museus-v6';
const SHELL = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './css/main.css',
  './css/modules/base.css',
  './css/modules/buttons.css',
  './css/modules/header.css',
  './css/modules/hero.css',
  './css/modules/filters.css',
  './css/modules/museums.css',
  './css/modules/states.css',
  './css/modules/rutes.css',
  './css/modules/map.css',
  './css/modules/favorites.css',
  './css/modules/team.css',
  './css/modules/museu-detail.css',
  './css/modules/modal.css',
  './css/modules/footer.css',
  './js/utils.js',
  './js/state.js',
  './js/data.js',
  './js/render.js',
  './js/modal.js',
  './js/filters.js',
  './js/map.js',
  './js/favorites.js',
  './js/weather.js',
  './js/geolocation.js',
  './js/speech.js',
  './js/team.js',
  './js/pwa.js',
  './js/main.js',
  './data/museus.json',
  './data/rutes.json',
  './data/team.json',
  './media/museus/manifest.json',
  './media/logo.svg'
];

// Pre-cache del shell mínim. skipWaiting() per activar la nova versió sense recarregar.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

// Esborra caches antics quan publiquem una versió nova.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Network-first per a JSON locals: si hi ha xarxa, sempre obtenim dades fresques.
  if (url.origin === location.origin && url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(req)
        .then(resp => {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
          return resp;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Cache-first per a la resta de recursos del mateix origen.
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req)
        .then(resp => {
          if (url.origin === location.origin && resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
          return resp;
        })
        .catch(() => {
          if (req.mode === 'navigate') return caches.match('./offline.html');
        });
    })
  );
});
