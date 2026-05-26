/**
 * Museus Illes Balears — Modal de detall
 * Gestiona el <dialog>, focus-trap, deep-link via hash i la peça TTS.
 */
(function () {
  'use strict';

  const state = window.MuseusApp.state;
  const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex="0"], input, select, textarea';
  let isUpdatingHash = false;

  /** Configura listeners únics del modal (delegació de clic, focus-trap, popstate). */
  function setupModal() {
    const modal = document.getElementById('museu-modal');
    const closeBtn = document.getElementById('close-modal');
    if (!modal) return;

    modal.addEventListener('close', onModalClose);
    closeBtn?.addEventListener('click', () => closeModal());
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    modal.addEventListener('keydown', trapFocus);

    // Obre el modal des de qualsevol [data-open-modal] del document.
    document.body.addEventListener('click', e => {
      const trigger = e.target.closest('[data-open-modal]');
      if (!trigger) return;
      e.preventDefault();
      state.lastFocusedBeforeModal = trigger;
      openModal(trigger.getAttribute('data-open-modal'));
    });

    // Sincronitza els canvis d'URL (botó enrere/endavant) amb el modal.
    window.addEventListener('popstate', () => {
      if (isUpdatingHash) return;
      const id = readMuseuFromHash();
      if (id) openModal(id, { skipPush: true });
      else if (modal.open) modal.close();
    });
  }

  /** Llegeix l'id del museu del fragment d'URL (`#museu=Mxxx`). */
  function readMuseuFromHash() {
    const h = location.hash || '';
    const m = h.match(/^#museu=(M\d+)/i);
    return m ? m[1] : null;
  }

  /** Si la URL actual ja contenia #museu=…, obrim el modal corresponent. */
  function openFromHashIfAny() {
    const id = readMuseuFromHash();
    if (id) openModal(id, { skipPush: true });
  }

  /** Restaura títol, scroll, foco i URL en tancar. */
  function onModalClose() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    document.body.style.overflow = '';
    document.title = 'Museus Illes Balears | Art i Disseny';

    if (location.hash.startsWith('#museu=')) {
      isUpdatingHash = true;
      history.replaceState(null, '', location.pathname + location.search);
      isUpdatingHash = false;
    }

    if (state.lastFocusedBeforeModal && typeof state.lastFocusedBeforeModal.focus === 'function') {
      try { state.lastFocusedBeforeModal.focus(); } catch { /* node desconnectat */ }
    }
  }

  /** Limita el Tab als elements focusables dins del modal. */
  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const modal = e.currentTarget;
    const focusables = Array.from(modal.querySelectorAll(FOCUSABLE))
      .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  /** Tanca el modal si està obert; el listener `close` neteja la resta. */
  function closeModal() {
    const modal = document.getElementById('museu-modal');
    if (modal?.open) modal.close();
  }

  /** Construeix el contingut del modal i el mostra (actualitza també l'URL). */
  function openModal(id, opts = {}) {
    const m = state.museums.find(x => x.identifier === id);
    if (!m) return;

    const modal = document.getElementById('museu-modal');
    const modalBody = document.getElementById('modal-body');
    if (!modal || !modalBody) return;

    modalBody.innerHTML = buildModalContent(m);
    bindModalActions(m);

    if (!modal.open) {
      modal.showModal();
      document.body.style.overflow = 'hidden';
    }
    document.title = `${m.name} | Museus Illes Balears`;

    if (!opts.skipPush) {
      const target = `#museu=${m.identifier}`;
      if (location.hash !== target) {
        isUpdatingHash = true;
        history.pushState({ museu: m.identifier }, '', target);
        isUpdatingHash = false;
      }
    }
  }

  /** Genera l'HTML interior de l'<article> del modal a partir del museu. */
  function buildModalContent(m) {
    const id = m.identifier;
    const displayName = m.name || m.alternateName;
    const name = Utils.escapeHtml(displayName);
    const desc = Utils.escapeHtml(m.description || 'No hi ha descripció disponible.');
    const artStyle = Utils.escapeHtml(Utils.getProperty(m, 'artStyle') || 'No especificat');
    const island = Utils.escapeHtml(Utils.getIsland(m));
    const isFree = Utils.escapeHtml(m.isAccessibleForFree ? 'Gratuïta' : 'De pagament');
    const isFav = Utils.storage.isFavorite(id);

    const addr = m.address || {};
    const addressLine = [addr.streetAddress, addr.addressLocality, addr.addressRegion].filter(Boolean).join(', ');
    const founding = Utils.getProperty(m, 'foundingDate');
    const ratingVal = m.aggregateRating?.ratingValue;
    const reviewCount = m.aggregateRating?.reviewCount;
    const tel = m.telephone || '';
    const telHref = tel ? `tel:${tel.replace(/\s/g, '')}` : '';
    const hours = Utils.escapeHtml(Utils.formatOpeningHours(m.openingHours));
    const sameAs = (m.sameAs || []).filter(Boolean);

    const headerAlt = m.alternateName && m.name && m.alternateName !== m.name
      ? `<p class="museu-header-alt">${Utils.escapeHtml(m.alternateName)}</p>`
      : '';

    const infoItem = (label, inner) =>
      `<div class="info-item"><strong>${label}</strong> <span>${inner}</span></div>`;

    let infoGrid = '';
    infoGrid += infoItem('Illa:', island);
    infoGrid += infoItem('Estil artístic:', artStyle);
    if (founding) infoGrid += infoItem('Any de fundació:', Utils.escapeHtml(String(founding)));
    infoGrid += infoItem('Entrada:', isFree);
    if (ratingVal != null && ratingVal !== '') {
      const r = Utils.escapeHtml(String(ratingVal));
      const rev = reviewCount ? ` <span class="info-muted">(${Utils.escapeHtml(String(reviewCount))} opinions)</span>` : '';
      infoGrid += infoItem('Valoració:', `★ ${r}${rev}`);
    }
    if (addressLine) infoGrid += infoItem('Adreça:', Utils.escapeHtml(addressLine));
    if (tel) infoGrid += infoItem('Telèfon:', `<a href="${Utils.escapeHtml(telHref)}">${Utils.escapeHtml(tel)}</a>`);
    infoGrid += infoItem('Horari:', hours);

    const extLinks = [];
    if (m.url) extLinks.push(`<a href="${Utils.escapeHtml(m.url)}" target="_blank" rel="noopener noreferrer" class="link-external">Web oficial</a>`);
    if (m.hasMap) extLinks.push(`<a href="${Utils.escapeHtml(m.hasMap)}" target="_blank" rel="noopener noreferrer" class="link-external">Com arribar-hi (mapa)</a>`);
    sameAs.forEach(url => {
      extLinks.push(`<a href="${Utils.escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="link-external">${Utils.escapeHtml(window.MuseusApp.render.sameAsLinkLabel(url))}</a>`);
    });
    if (m.video_url) extLinks.push(`<a href="${Utils.escapeHtml(m.video_url)}" target="_blank" rel="noopener noreferrer" class="link-external">Vídeo</a>`);

    const linksBlock = extLinks.length
      ? `<nav class="museu-external-links" aria-label="Enllaços útils">${extLinks.join('')}</nav>`
      : '';

    const ttsAvailable = !!window.speechSynthesis && (m.description || '').trim();
    const ttsButton = ttsAvailable ? `
      <button type="button" id="btn-tts-museu" class="btn-tts btn-tts-museu" aria-describedby="museu-description-text" aria-label="Llegir la descripció del museu en veu alta">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
        Llegir descripció en veu alta
      </button>` : '';

    const galleryFiles = Utils.getMuseumGalleryFiles(id, state.imagesManifest);
    const carouselBlock = buildCarouselHtml(id, galleryFiles, displayName);

    // Museus relacionats (només si n'hi ha 1 o més)
    const related = window.MuseusApp.render.getRelatedMuseums(m, 3);
    const relatedBlock = related.length ? `
      <aside class="museu-related" aria-labelledby="related-title">
        <h3 id="related-title">Museus relacionats</h3>
        <ul>
          ${related.map(r => `<li><a href="#museu=${Utils.escapeHtml(r.identifier)}" data-open-modal="${Utils.escapeHtml(r.identifier)}">${Utils.escapeHtml(r.name)}</a></li>`).join('')}
        </ul>
      </aside>` : '';

    return `
      <header class="museu-header museu-header-compact">
        <h2 id="modal-title">${name}</h2>
        ${headerAlt}
      </header>
      <div class="museu-body modal-body-scroll">
        ${carouselBlock}
        <div class="info-grid">${infoGrid}</div>
        ${linksBlock}
        <div class="museu-description-block">
          <h3>Sobre el museu</h3>
          <p id="museu-description-text">${desc}</p>
          ${ttsButton}
        </div>
        <div class="museu-actions">
          <button type="button" class="btn btn-secondary btn-favorite ${isFav ? 'favorited' : ''}" data-modal-fav="${Utils.escapeHtml(id)}">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            ${isFav ? 'Guardat' : 'Guardar a Favorits'}
          </button>
        </div>
        ${relatedBlock}
      </div>
    `;
  }

  /**
   * Construeix el carousel d'imatges del museu.
   * - 0 imatges: retorna placeholder amb gradient.
   * - 1 imatge: imatge gran, sense fletxes ni dots.
   * - N imatges: track amb scroll-snap, fletxes prev/next, dots i comptador.
   */
  function buildCarouselHtml(id, files, name) {
    const list = Array.isArray(files) && files.length ? files : [];

    if (!list.length) {
      return `<div class="museu-carousel museu-carousel-empty" aria-label="Sense imatges disponibles"></div>`;
    }

    const slides = list.map((file, i) => {
      const src = Utils.escapeHtml(Utils.museumDataImageUrl(id, file));
      const alt = Utils.escapeHtml(`${name || 'Museu'} — imatge ${i + 1} de ${list.length}`);
      const eager = i === 0 ? 'eager' : 'lazy';
      const fetchPrio = i === 0 ? ' fetchpriority="high"' : '';
      return `<img class="museu-carousel-slide" src="${src}" alt="${alt}" loading="${eager}" decoding="async"${fetchPrio} data-fallback>`;
    }).join('');

    // Una sola imatge: no calen controls
    if (list.length === 1) {
      return `<div class="museu-carousel museu-carousel-single" role="img" aria-label="${Utils.escapeHtml(name || 'Museu')}">${slides}</div>`;
    }

    const dots = list.map((_, i) =>
      `<button type="button" class="museu-carousel-dot${i === 0 ? ' is-active' : ''}" data-go="${i}" aria-label="Anar a la imatge ${i + 1}" aria-current="${i === 0}"></button>`
    ).join('');

    return `
      <section class="museu-carousel" aria-roledescription="carrusel" aria-label="Galeria d'imatges del museu" tabindex="0">
        <div class="museu-carousel-track" role="group">${slides}</div>
        <button type="button" class="museu-carousel-arrow museu-carousel-prev" aria-label="Imatge anterior">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <button type="button" class="museu-carousel-arrow museu-carousel-next" aria-label="Imatge següent">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <div class="museu-carousel-dots" role="tablist">${dots}</div>
        <span class="museu-carousel-counter" aria-live="polite">1 / ${list.length}</span>
      </section>
    `;
  }

  /** Cablat del carousel: scroll-snap nadiu + fletxes + dots + teclat. */
  function setupModalCarousel(root) {
    if (!root || !root.classList.contains('museu-carousel') || root.classList.contains('museu-carousel-single')) return;

    const track = root.querySelector('.museu-carousel-track');
    const slides = root.querySelectorAll('.museu-carousel-slide');
    const prev = root.querySelector('.museu-carousel-prev');
    const next = root.querySelector('.museu-carousel-next');
    const dots = root.querySelectorAll('.museu-carousel-dot');
    const counter = root.querySelector('.museu-carousel-counter');
    if (!track || slides.length <= 1) return;

    const total = slides.length;
    let active = 0;

    /** Salta a una posició concreta amb scroll suau. */
    function goTo(index) {
      const target = Math.max(0, Math.min(total - 1, index));
      track.scrollTo({ left: slides[target].offsetLeft, behavior: 'smooth' });
    }

    /** Detecta la slide activa segons l'scrollLeft real i actualitza UI. */
    function syncActive() {
      const w = track.clientWidth || 1;
      const idx = Math.round(track.scrollLeft / w);
      if (idx === active) return;
      active = idx;
      dots.forEach((d, i) => {
        d.classList.toggle('is-active', i === idx);
        d.setAttribute('aria-current', i === idx);
      });
      if (counter) counter.textContent = `${idx + 1} / ${total}`;
    }

    prev.addEventListener('click', () => goTo(active - 1));
    next.addEventListener('click', () => goTo(active + 1));
    dots.forEach(dot => dot.addEventListener('click', () => goTo(+dot.dataset.go)));

    // Teclat: fletxes només quan el carousel té el foco.
    root.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(active - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goTo(active + 1); }
    });

    // Si una imatge falla, l'amaguem (no rompre el carousel sencer).
    slides.forEach(img => img.addEventListener('error', () => { img.style.visibility = 'hidden'; }));

    // Throttle del sync amb requestAnimationFrame.
    let raf = null;
    track.addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { syncActive(); raf = null; });
    });
  }

  /** Enllaça els botons interns del modal (favorit + TTS) sense onclick inline. */
  function bindModalActions(m) {
    const modalBody = document.getElementById('modal-body');
    if (!modalBody) return;

    const favBtn = modalBody.querySelector('[data-modal-fav]');
    if (favBtn) {
      favBtn.addEventListener('click', () => {
        Utils.storage.toggleFavorite(m.identifier);
        const isFav = Utils.storage.isFavorite(m.identifier);
        favBtn.classList.toggle('favorited', isFav);
        favBtn.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          ${isFav ? 'Guardat' : 'Guardar a Favorits'}
        `;
        // Refresquem els altres llocs on apareix l'estat de favorit
        window.MuseusApp.render.renderMuseums(window.MuseusApp.filters?.getFiltered() || state.museums);
        window.MuseusApp.favorites?.refresh();
        Utils.showToast(isFav ? 'Guardat a favorits' : 'Tret de favorits', 'success');
      });
    }

    window.MuseusApp.speech?.bindTTS(m.description || '');
    setupModalCarousel(modalBody.querySelector('.museu-carousel'));
  }

  window.MuseusApp.modal = { setupModal, openModal, closeModal, openFromHashIfAny };
})();
