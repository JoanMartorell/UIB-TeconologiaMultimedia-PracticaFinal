/**
 * Museus Illes Balears — Bootstrap de l'aplicació
 * Cablat de tots els mòduls + components transversals (carrusel, drawer, scrollspy).
 */
(function () {
  'use strict';

  const App = window.MuseusApp;

  /** Carrusel de fons del hero: rotació automàtica + dots navegables. */
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
    const dotBtns = [];

    function setSlide(i) {
      const n = slides.length;
      const next = ((i % n) + n) % n;
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

    dotsRoot.innerHTML = '';
    slides.forEach((_, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hero-carousel-dot' + (idx === 0 ? ' is-active' : '');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
      btn.setAttribute('tabindex', idx === 0 ? '0' : '-1');
      btn.setAttribute('aria-label', `Imatge ${idx + 1} de ${slides.length}`);
      btn.addEventListener('click', () => { setSlide(idx); restartAuto(); });
      dotsRoot.appendChild(btn);
      dotBtns.push(btn);
    });

    function restartAuto() {
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

  /** ScrollSpy: ressalta l'enllaç actiu del menú segons la secció visible. */
  function setupScrollSpy() {
    const navLinks = document.querySelectorAll('#main-nav a');
    const sections = [
      { id: 'inici', el: document.querySelector('.hero-fullscreen') },
      { id: 'museus', el: document.getElementById('museus') },
      { id: 'rutes', el: document.getElementById('rutes') },
      { id: 'mapa', el: document.getElementById('mapa') },
      { id: 'favoritos', el: document.getElementById('favoritos') },
      { id: 'nosaltres', el: document.getElementById('nosaltres') }
    ];

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const found = sections.find(s => s.el === entry.target);
        if (!found) return;
        navLinks.forEach(l => l.classList.remove('active'));
        if (found.id === 'inici') {
          document.querySelector('#main-nav a[href="index.html"]')?.classList.add('active');
        } else {
          document.querySelector(`#main-nav a[href$="#${found.id}"]`)?.classList.add('active');
        }
      });
    }, { rootMargin: '-40% 0px -60% 0px', threshold: 0 });

    sections.forEach(s => { if (s.el) observer.observe(s.el); });
  }

  /** Drawer (menú lateral en mòbil): obre/tanca amb hamburguesa + overlay. */
  function setupDrawerMenu() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('main-nav');
    const overlay = document.querySelector('.drawer-overlay');
    if (!toggle || !nav) return;

    const open = () => {
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Tancar menú');
      nav.setAttribute('aria-expanded', 'true');
      nav.classList.add('is-open');
      document.body.classList.add('drawer-open');
    };
    const close = () => {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Obrir menú');
      nav.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
      document.body.classList.remove('drawer-open');
      setTimeout(() => App.state.leafletMap?.invalidateSize(), 350);
    };

    toggle.addEventListener('click', () => {
      if (toggle.getAttribute('aria-expanded') === 'true') close();
      else open();
    });
    overlay?.addEventListener('click', close);
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
  }

  /** Posa l'any actual al footer per evitar mantenir-lo manualment. */
  function setFooterYear() {
    const el = document.getElementById('footer-year');
    if (el) el.textContent = new Date().getFullYear();
  }

  /** Punt d'entrada: orquestra dades + UI + mòduls. */
  async function init() {
    setFooterYear();
    initHeroCarousel();
    setupScrollSpy();
    setupDrawerMenu();
    App.modal.setupModal();
    App.weather.setupWeather();

    // Pintem skeleton mentre baixa el JSON
    if (document.getElementById('museums-grid')) App.render.showLoading();

    try {
      await App.data.loadMuseums();
      App.render.hideLoading();
      App.render.renderMuseums(App.state.museums);
      App.map.initMuseumsMap();
      App.filters.setupFilters();
      App.favorites.setupFavorites();
      App.geolocation.setupGeolocation();
      App.render.injectJSONLD();
      App.modal.openFromHashIfAny();
    } catch {
      App.render.hideLoading();
    }

    await App.data.loadRutes();
    App.render.renderRutes(App.state.rutes);

    // L'equip es carrega en paral·lel amb la resta (no bloqueja la UI principal)
    App.team?.setupTeam();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
