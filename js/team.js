/**
 * Museus Illes Balears — Equip (Nosaltres)
 * Carrega `data/team.json` (Schema.org/Person) i pinta una secció amb targetes.
 * També injecta JSON-LD perquè els cercadors puguin llegir l'autoria del projecte.
 */
(function () {
  'use strict';

  const state = window.MuseusApp.state;
  state.team = [];

  /** Retorna les inicials a mostrar quan no hi ha foto carregada. */
  function getInitials(name) {
    return (name || '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  }

  /** Normalitza el camp email (treu el prefix mailto: si en porta) per mostrar-lo. */
  function plainEmail(value) {
    if (!value) return '';
    return value.replace(/^mailto:/i, '');
  }

  /** Construeix l'HTML d'una targeta de persona. */
  function createMemberCard(p) {
    const name = Utils.escapeHtml(p.name || 'Pendent');
    const initials = Utils.escapeHtml(getInitials(p.name));
    const desc = Utils.escapeHtml(p.description || '');
    const jobTitle = Utils.escapeHtml(p.jobTitle || '');
    const email = plainEmail(p.email);
    const affName = p.affiliation?.name ? Utils.escapeHtml(p.affiliation.name) : '';

    const imageBlock = p.image
      ? `<img src="${Utils.escapeHtml(p.image)}" alt="Foto de ${name}" width="120" height="120" loading="lazy" decoding="async" itemprop="image" data-team-img>`
      : '';

    const emailBlock = email
      ? `<a class="team-email" href="mailto:${Utils.escapeHtml(email)}" itemprop="email">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
             <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
             <polyline points="22,6 12,13 2,6"/>
           </svg>
           ${Utils.escapeHtml(email)}
         </a>`
      : '';

    return `
      <article class="team-card" itemscope itemtype="https://schema.org/Person">
        <div class="team-avatar" aria-hidden="${imageBlock ? 'true' : 'false'}">
          <span class="team-avatar-initials">${initials}</span>
          ${imageBlock}
        </div>
        <div class="team-info">
          <h3 class="team-name" itemprop="name">${name}</h3>
          ${jobTitle ? `<p class="team-role" itemprop="jobTitle">${jobTitle}</p>` : ''}
          ${affName ? `<p class="team-affiliation" itemprop="affiliation" itemscope itemtype="https://schema.org/CollegeOrUniversity"><span itemprop="name">${affName}</span></p>` : ''}
          ${desc ? `<p class="team-desc" itemprop="description">${desc}</p>` : ''}
          ${emailBlock}
        </div>
      </article>
    `;
  }

  /** Pinta la secció de l'equip a partir d'un array de persones. */
  function renderTeam(people) {
    const list = document.getElementById('team-list');
    if (!list) return;
    if (!people.length) {
      list.innerHTML = '<p class="team-empty">Informació de l\'equip pendent.</p>';
      return;
    }
    list.innerHTML = people.map(createMemberCard).join('');
    // Si la foto no es pot carregar, fem fallback a les inicials.
    list.querySelectorAll('img[data-team-img]').forEach(img => {
      img.addEventListener('error', () => { img.style.display = 'none'; });
    });
  }

  /** Injecta JSON-LD Schema.org/Person de l'equip a la <head>. */
  function injectTeamJSONLD(people) {
    if (!people.length) return;
    const existing = document.getElementById('team-jsonld');
    if (existing) existing.remove();
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'team-jsonld';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': people
    });
    document.head.appendChild(script);
  }

  /** Punt d'entrada: carrega el JSON, pinta i injecta dades estructurades. */
  async function setupTeam() {
    try {
      const data = await Utils.fetchJSON('data/team.json');
      state.team = Array.isArray(data['@graph']) ? data['@graph'] : [];
    } catch (err) {
      console.error('Error carregant equip:', err);
      state.team = [];
    }
    renderTeam(state.team);
    injectTeamJSONLD(state.team);
  }

  window.MuseusApp.team = { setupTeam, renderTeam };
})();
