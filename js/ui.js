/* ============================================================
   UI.JS — Renderização, modais e feedback visual
   ============================================================ */
const UI = {
  toastTimer: null,

  toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  },

  openModal(id)  { $(id).classList.add('open'); },
  closeModal(id) { $(id).classList.remove('open'); },

  /* ---------- Saudação ---------- */
  greet() {
    const h = new Date().getHours();
    const saud = h < 5 ? 'Boa madrugada' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    const name = localStorage.getItem('mb_user_name');
    $('greeting').textContent = name ? `${saud}, ${name}! 👋` : `${saud}! 👋`;
  },

  askName() {
    const name = prompt('Como você quer ser chamado(a)?', localStorage.getItem('mb_user_name') ?? '');
    if (name !== null) {
      name.trim() ? localStorage.setItem('mb_user_name', name.trim()) : localStorage.removeItem('mb_user_name');
      this.greet();
    }
  },

  /* ---------- Categorias / setores ---------- */
  categories() {
    return [...new Set(projects.map(p => p.category).filter(Boolean))].sort();
  },
  sectorsCount() {
    return new Set(projects.map(p => p.sector).filter(Boolean)).size;
  },

  setFilter(cat) { activeCategory = cat; this.render(); },

  chipsHTML() {
    const chip = (val, label) =>
      `<button class="chip ${activeCategory === val ? 'active' : ''}" onclick="UI.setFilter('${val.replace(/'/g, "\\'")}')">${label}</button>`;
    return [
      chip('all', 'Todos'),
      chip('favs', '⭐ Favoritos'),
      chip('mais-usados', '🔥 Mais usados'),
      ...this.categories().map(c => chip(c, escapeHtml(c))),
    ].join('');
  },

  /* ---------- Cards ---------- */
  cardHTML(p, i) {
    const safeName = escapeHtml(p.name), safeDesc = escapeHtml(p.desc);
    const initial = safeName.charAt(0).toUpperCase() || '★';
    const isFav = Favs.has(p.id);
    const icon = p.useScreenshot
      ? `<img class="shot-img" loading="lazy" src="${CONFIG.screenshot(p.url)}" alt=""
             onload="this.style.opacity=1;UI.setOnline('${p.id}',true)" onerror="this.remove()">`
      : `<img class="shot-favicon" loading="lazy" src="${CONFIG.favicon(p.url)}" alt=""
             onload="this.style.opacity=1;UI.setOnline('${p.id}',true)" onerror="this.remove();UI.setOnline('${p.id}',false)">`;
    const clicksBadge = p.clicks > 0 ? `<span class="clicks-badge" title="${p.clicks} acesso(s)">🔥 ${p.clicks}</span>` : '';
    const ownerLine = p.owner ? `<div class="card-owner">👤 ${escapeHtml(p.owner)}</div>` : '';
    const titleAttr = p.notes ? escapeHtml(p.notes) : `Visitar ${safeName}`;
    return `
    <article class="card ${p.pinned ? 'pinned' : ''}" style="transition-delay:${Math.min(i * 60, 360)}ms" onclick="UI.visit('${p.id}')" title="${titleAttr}">
      <div class="card-shot ${p.useScreenshot ? '' : 'icon-mode'}">
        <div class="shot-fallback">${initial}</div>
        ${icon}
        <span class="status-dot" id="dot_${p.id}" title="Disponibilidade (melhor esforço)"></span>
        ${p.pinned ? '<span class="pin-flag" title="Fixado">📌</span>' : ''}
        ${clicksBadge}
        <span class="card-visit">Visitar ↗</span>
        <button class="fav-btn ${isFav ? 'active' : ''}" title="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"
                onclick="event.stopPropagation();UI.toggleFav('${p.id}')">${isFav ? '⭐' : '☆'}</button>
        <div class="card-admin" onclick="event.stopPropagation()">
          <button class="icon-btn" title="${p.pinned ? 'Desafixar' : 'Fixar no topo'}" onclick="Admin.togglePin('${p.id}')">📌</button>
          <button class="icon-btn" title="Editar" onclick="Admin.openProjectModal('${p.id}')">✏️</button>
          <button class="icon-btn del" title="Excluir" onclick="Admin.deleteProject('${p.id}')">🗑️</button>
        </div>
      </div>
      <div class="card-body">
        <div class="card-domain">${escapeHtml(p.category || domainOf(p.url))}</div>
        <h3 class="card-title">${safeName}</h3>
        ${ownerLine}
        <p class="card-desc">${safeDesc}</p>
      </div>
    </article>`;
  },

  setOnline(id, ok) {
    const d = $('dot_' + id);
    if (d) d.classList.add(ok ? 'on' : 'off');
  },

  toggleFav(id) {
    const added = Favs.toggle(id);
    this.toast(added ? '⭐ Adicionado aos favoritos' : 'Removido dos favoritos');
    this.render();
  },

  /* ---------- Render principal ---------- */
  render() {
    const q = $('searchInput').value.trim().toLowerCase();
    let list = projects.filter(p =>
      !q || [p.name, p.desc, p.url, p.category, p.sector, p.owner]
        .some(v => (v ?? '').toLowerCase().includes(q))
    );
    if (activeCategory === 'favs') list = list.filter(p => Favs.has(p.id));
    else if (activeCategory !== 'all' && activeCategory !== 'mais-usados') list = list.filter(p => p.category === activeCategory);

    const byUsage = activeCategory === 'mais-usados';
    list.sort((a, b) => {
      if (byUsage && b.clicks !== a.clicks) return b.clicks - a.clicks;
      if (b.pinned !== a.pinned) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
      const fa = Favs.has(a.id) ? 1 : 0, fb = Favs.has(b.id) ? 1 : 0;
      if (fa !== fb) return fb - fa;
      return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    });

    $('chips').innerHTML = this.chipsHTML();

    const grouped = activeCategory === 'all' && !q && this.sectorsCount() > 1;
    let html;
    if (grouped) {
      const groups = {};
      list.forEach(p => { const s = p.sector || 'Geral'; (groups[s] ||= []).push(p); });
      html = Object.keys(groups)
        .sort((a, b) => a === 'Geral' ? 1 : b === 'Geral' ? -1 : a.localeCompare(b))
        .map(s => `<div class="sector-head">${escapeHtml(s)}</div>` + groups[s].map((p, i) => this.cardHTML(p, i)).join(''))
        .join('');
    } else {
      html = list.map((p, i) => this.cardHTML(p, i)).join('');
    }

    $('grid').innerHTML = html;
    $('countPill').textContent = list.length;
    $('emptyState').style.display = (projects.length === 0) ? 'block' : 'none';
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        document.querySelectorAll('.card').forEach(c => c.classList.add('visible'))
      )
    );
  },

  openFirst() {
    const first = document.querySelector('.card');
    if (first) first.click();
  },

  visit(id) {
    const p = projects.find(x => x.id === id);
    if (!p) return;
    Store.bumpClick(id);            // conta o acesso no banco (compartilhado)
    p.clicks = (p.clicks ?? 0) + 1; // reflete na hora nesta tela
    window.open(p.url, '_blank', 'noopener');
  },
};
