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

  /* ---------- Saudação + relógio ---------- */
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

  /* ---------- Filtros de categoria ---------- */
  categories() {
    return [...new Set(projects.map(p => p.category).filter(Boolean))].sort();
  },

  setFilter(cat) {
    activeCategory = cat;
    this.render();
  },

  chipsHTML() {
    const chip = (val, label) =>
      `<button class="chip ${activeCategory === val ? 'active' : ''}" onclick="UI.setFilter('${val.replace(/'/g, "\\'")}')">${label}</button>`;
    return [
      chip('all', 'Todos'),
      chip('favs', '⭐ Favoritos'),
      ...this.categories().map(c => chip(c, escapeHtml(c))),
    ].join('');
  },

  /* ---------- Cards ---------- */
  cardHTML(p, i) {
    const safeName = escapeHtml(p.name), safeDesc = escapeHtml(p.desc);
    const initial = safeName.charAt(0).toUpperCase() || '★';
    const isFav = Favs.has(p.id);
    return `
    <article class="card" style="transition-delay:${Math.min(i * 60, 360)}ms" onclick="UI.visit('${p.id}')" title="Visitar ${safeName}">
      <div class="card-shot">
        <div class="shot-fallback">${initial}</div>
        <img loading="lazy" src="${CONFIG.screenshot(p.url)}" alt="Screenshot de ${safeName}"
             onload="this.style.position='relative'" onerror="this.remove()">
        <span class="card-visit">Visitar ↗</span>
        <button class="fav-btn ${isFav ? 'active' : ''}" title="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"
                onclick="event.stopPropagation();UI.toggleFav('${p.id}')">${isFav ? '⭐' : '☆'}</button>
        <div class="card-admin" onclick="event.stopPropagation()">
          <button class="icon-btn" title="Editar" onclick="Admin.openProjectModal('${p.id}')">✏️</button>
          <button class="icon-btn del" title="Excluir" onclick="Admin.deleteProject('${p.id}')">🗑️</button>
        </div>
      </div>
      <div class="card-body">
        <div class="card-domain">${escapeHtml(p.category || domainOf(p.url))}</div>
        <h3 class="card-title">${safeName}</h3>
        <p class="card-desc">${safeDesc}</p>
      </div>
    </article>`;
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
      !q || p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
        || p.url.toLowerCase().includes(q) || (p.category ?? '').toLowerCase().includes(q)
    );
    if (activeCategory === 'favs') list = list.filter(p => Favs.has(p.id));
    else if (activeCategory !== 'all') list = list.filter(p => p.category === activeCategory);

    // Favoritos primeiro, depois mais recentes
    list.sort((a, b) => (Favs.has(b.id) - Favs.has(a.id)) || (b.createdAt ?? 0) - (a.createdAt ?? 0));

    $('chips').innerHTML = this.chipsHTML();
    $('grid').innerHTML = list.map((p, i) => this.cardHTML(p, i)).join('');
    $('countPill').textContent = list.length;
    $('emptyState').style.display = (projects.length === 0) ? 'block' : 'none';
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        document.querySelectorAll('.card').forEach(c => c.classList.add('visible'))
      )
    );
  },

  /* Abre o primeiro resultado visível (Enter na busca) */
  openFirst() {
    const first = document.querySelector('.card');
    if (first) first.click();
  },

  visit(id) {
    const p = projects.find(x => x.id === id);
    if (p) window.open(p.url, '_blank', 'noopener');
  },
};
