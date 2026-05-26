/**
 * Museus Illes Balears — PWA: registre del Service Worker
 * Manté la web funcional offline i preparada per a instal·lació.
 */
(function () {
  'use strict';

  if (!('serviceWorker' in navigator)) return;

  // Esperem el load per no competir amb la càrrega inicial.
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .catch(err => console.warn('SW no registrat:', err));
  });
})();
