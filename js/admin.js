/* ============================================================
   ADMIN.JS — Autenticação e CRUD de projetos
   ============================================================ */
const Admin = {
  previewTimer: null,

  get isLogged() { return sessionStorage.getItem(CONFIG.authKey) === '1'; },
  get password() { return localStorage.getItem(CONFIG.passKey) ?? CONFIG.defaultPass; },

  setPassword(newPass) {
    if (!newPass || newPass.length < 4) return console.warn('Senha muito curta (mín. 4).');
    localStorage.setItem(CONFIG.passKey, newPass);
    console.log('✅ Senha atualizada.');
  },

  handleNavClick() {
    this.isLogged
      ? this.openProjectModal()
      : (UI.openModal('loginOverlay'), setTimeout(() => $('passInput').focus(), 250));
  },

  login(e) {
    e.preventDefault();
    if ($('passInput').value === this.password) {
      sessionStorage.setItem(CONFIG.authKey, '1');
      document.body.classList.add('is-admin');
      $('navAdminBtn').innerHTML = '＋ <span class="txt">Novo projeto</span>';
      UI.closeModal('loginOverlay');
      $('passInput').value = '';
      UI.toast('👋 Bem-vindo, admin!');
    } else {
      UI.toast('❌ Senha incorreta');
      $('passInput').select();
    }
  },

  logout() {
    sessionStorage.removeItem(CONFIG.authKey);
    document.body.classList.remove('is-admin');
    $('navAdminBtn').innerHTML = '🔐 <span class="txt">Admin</span>';
    UI.toast('Sessão encerrada');
  },

  openProjectModal(id = null) {
    if (!this.isLogged) return this.handleNavClick();
    editingId = id;
    const p = id ? projects.find(x => x.id === id) : null;
    $('projectModalTitle').textContent = p ? '✏️ Editar projeto' : '＋ Novo projeto';
    $('saveBtn').textContent = p ? 'Salvar alterações' : 'Salvar projeto';
    $('urlInput').value  = p?.url  ?? '';
    $('nameInput').value = p?.name ?? '';
    $('descInput').value = p?.desc ?? '';
    $('catInput').value  = p?.category ?? '';
    // Sugestões de categoria no datalist
    $('catList').innerHTML = [...new Set([...UI.categories(), 'Ferramentas', 'Analytics', 'Sites', 'Sistemas'])]
      .map(c => `<option value="${escapeHtml(c)}">`).join('');
    $('preview').classList.remove('show');
    if (p) this.onUrlInput();
    UI.openModal('projectOverlay');
    setTimeout(() => $('urlInput').focus(), 250);
  },

  // Mini janela: prévia ao digitar a URL
  onUrlInput() {
    clearTimeout(this.previewTimer);
    this.previewTimer = setTimeout(() => {
      const url = $('urlInput').value.trim();
      if (!/^https?:\/\/.+\..+/.test(url)) return $('preview').classList.remove('show');
      $('preview').classList.add('show');
      $('previewUrl').textContent = url;
      const img = $('previewImg'), loading = $('previewLoading');
      img.style.display = 'none';
      loading.style.display = 'grid';
      loading.innerHTML = '<div><div class="spinner"></div>Capturando o site...</div>';
      img.onload  = () => { img.style.display = 'block'; loading.style.display = 'none'; };
      img.onerror = () => { loading.innerHTML = '<div>⚠️ Não consegui capturar — o card usará um visual padrão.</div>'; };
      img.src = CONFIG.screenshot(url);
      // Sugere nome a partir do domínio
      if (!$('nameInput').value) {
        const base = domainOf(url).split('.')[0];
        $('nameInput').value = base.charAt(0).toUpperCase() + base.slice(1);
      }
    }, 500);
  },

  saveProject(e) {
    e.preventDefault();
    const data = {
      url:      $('urlInput').value.trim(),
      name:     $('nameInput').value.trim(),
      desc:     $('descInput').value.trim(),
      category: $('catInput').value.trim(),
    };
    if (editingId) {
      const i = projects.findIndex(x => x.id === editingId);
      projects[i] = { ...projects[i], ...data };
      UI.toast('✅ Projeto atualizado!');
    } else {
      projects.unshift({ id: uid(), createdAt: Date.now(), ...data });
      UI.toast('🎉 Projeto adicionado!');
    }
    Store.save(projects);
    UI.closeModal('projectOverlay');
    UI.render();
  },

  deleteProject(id) {
    const p = projects.find(x => x.id === id);
    if (!confirm(`Excluir "${p.name}"?`)) return;
    projects = projects.filter(x => x.id !== id);
    Store.save(projects);
    UI.render();
    UI.toast('🗑️ Projeto excluído');
  },
};
