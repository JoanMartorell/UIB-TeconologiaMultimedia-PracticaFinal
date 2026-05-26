/**
 * Museus Illes Balears — Estat compartit
 * Magatzem únic per a dades carregades, filtres actius i preferències d'ordre.
 * Es manté global per a que tots els mòduls IIFE hi accedeixin sense imports.
 */
(function () {
  'use strict';

  window.MuseusApp = window.MuseusApp || {};

  window.MuseusApp.state = {
    museums: [],
    imagesManifest: {},
    rutes: [],
    activeFilters: { q: '', island: '', style: '', free: '' },
    sortBy: 'default',
    userCoords: null,
    leafletMap: null,
    lastFocusedBeforeModal: null
  };
})();
