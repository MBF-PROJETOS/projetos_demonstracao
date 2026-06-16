/* ============================================================
   ADMIN.JS — Autenticação (Supabase Auth) e CRUD de projetos
   ------------------------------------------------------------
   A segurança real é aplicada no SERVIDOR pelo RLS. Mesmo que
   alguém burle a interface, o banco recusa escrita sem admin.
   ============================================================ */
const Admin = {
  previewTimer: null,
  _isLogged: false,

  get isLogged() { return this._isLogged; },

  // Atualiza o estado/visual conforme a sessão do Supabase
  async refreshSession() {
    const { data } = await sb.auth.getSession();
    this._isLogged = !!data.session;
    document.body.classList.toggle('is-admin', this._isLogged);
    const btn = $('navAdminBtn');
    if (btn) btn.innerHTML = this._isLogged
      ? '＋ <span class="txt">Novo projeto</span>'
      : '🔐 <span class="txt">Admin</span>';
    return this._isLogged;
  },

  handleNavClick() {
    this.isLogged
      ? this.openProjectModal()
      : (UI.openModal('loginOverlay'), setTimeout(() => $('emailInput')?.focus(), 250));
  },

  async login(e) {
    e.preventDefault();
    const email = $('emailInput').value.trim();
    const password = $('passInput').value;
    const btn = e.submitter;
    if (btn) { btn.disabled = true; btn.textContent = 'Entrando...'; }
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (btn) { btn.disabled = false; btn.textContent = 'Entrar'; }
    if (error) {
      UI.toast('❌ E-mail ou senha incorretos');
      $('passInput').select();
      return;
    }
    await this.refreshSession();
    UI.closeModal('loginOverlay');
    $('passInput').value = '';
    UI.toast('👋 Bem-vindo, admin!');
    await App.reload();
    this.offerMigration();
  },

  async logout() {
    await sb.auth.signOut();
    await this.refreshSession();
    UI.toast('Sessão encerrada');
  },

  openProjectModal(id = null) {
    if (!this.isLogged) return this.handleNavClick();
    editingId = id;
    const p = id ? projects.find(x => x.id === id) : null;
    $('projectModalTitle').textContent = p ? '✏️ Editar projeto' : '＋ Novo projeto';
    $('saveBtn').textContent = p ? 'Salvar alterações' : 'Salvar projeto';
    $('urlInput').value    = p?.url  ?? '';
    $('nameInput').value   = p?.name ?? '';
    $('descInput').value   = p?.desc ?? '';
    $('catInput').value    = p?.category ?? '';
    $('sectorInput').value = p?.sector ?? '';
    $('ownerInput').value  = p?.owner ?? '';
    $('notesInput').value  = p?.notes ?? '';
    $('shotInput').checked = !!p?.useScreenshot;
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
      if (!$('nameInput').value) {
        const base = domainOf(url).split('.')[0];
        $('nameInput').value = base.charAt(0).toUpperCase() + base.slice(1);
      }
    }, 500);
  },

  async saveProject(e) {
    e.preventDefault();
    const btn = $('saveBtn');
    const data = {
      url:      $('urlInput').value.trim(),
      name:     $('nameInput').value.trim(),
      desc:     $('descInput').value.trim(),
      category: $('catInput').value.trim(),
      sector:   $('sectorInput').value.trim(),
      owner:    $('ownerInput').value.trim(),
      notes:    $('notesInput').value.trim(),
      useScreenshot: $('shotInput').checked,
    };
    btn.disabled = true; btn.textContent = 'Salvando...';
    try {
      if (editingId) {
        await Store.update(editingId, data);
        UI.toast('✅ Projeto atualizado!');
      } else {
        await Store.insert(data);
        UI.toast('🎉 Projeto adicionado!');
      }
      UI.closeModal('projectOverlay');
      await App.reload();
    } catch (err) {
      console.error(err);
      UI.toast('❌ Não foi possível salvar (sem permissão ou sem conexão).');
    } finally {
      btn.disabled = false;
      btn.textContent = editingId ? 'Salvar alterações' : 'Salvar projeto';
    }
  },

  async deleteProject(id) {
    const p = projects.find(x => x.id === id);
    if (!confirm(`Excluir "${p.name}"?`)) return;
    try {
      await Store.remove(id);
      await App.reload();
      UI.toast('🗑️ Projeto excluído');
    } catch (err) {
      console.error(err);
      UI.toast('❌ Não foi possível excluir.');
    }
  },

  /* Migração 1x: leva os projetos antigos do navegador para o banco */
  async offerMigration() {
    const legacy = Store.legacy();
    if (!legacy.length) return;
    if (!confirm(`Encontrei ${legacy.length} projeto(s) salvo(s) antigamente neste navegador.\nMigrar para o banco compartilhado agora?`)) return;
    let ok = 0;
    for (const p of legacy) {
      try { await Store.insert({ name: p.name, url: p.url, desc: p.desc, category: p.category }); ok++; }
      catch (err) { console.error('Falha ao migrar', p, err); }
    }
    localStorage.removeItem(CONFIG.legacyStorageKey);
    UI.toast(`✅ ${ok} projeto(s) migrado(s)!`);
    await App.reload();
  },

  /* Fixar / desafixar no topo */
  async togglePin(id) {
    if (!this.isLogged) return this.handleNavClick();
    const p = projects.find(x => x.id === id);
    if (!p) return;
    try {
      await Store.setPinned(id, !p.pinned);
      await App.reload();
      UI.toast(p.pinned ? 'Desafixado' : '📌 Fixado no topo');
    } catch (err) {
      console.error(err);
      UI.toast('❌ Não foi possível fixar.');
    }
  },

  /* Backup: baixa todos os projetos em JSON */
  exportJSON() {
    const data = JSON.stringify(projects, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `hub-mbfinance-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    UI.toast('💾 Backup exportado');
  },

  /* Importa projetos de um arquivo JSON (somente admin) */
  importJSON(input) {
    if (!this.isLogged) return this.handleNavClick();
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      let arr;
      try { arr = JSON.parse(reader.result); }
      catch { return UI.toast('❌ Arquivo inválido'); }
      if (!Array.isArray(arr)) return UI.toast('❌ Formato inesperado');
      if (!confirm(`Importar ${arr.length} projeto(s)?`)) return;
      let ok = 0;
      for (const p of arr) {
        try {
          await Store.insert({
            name: p.name, url: p.url, desc: p.desc ?? p.description ?? '',
            category: p.category, sector: p.sector, owner: p.owner,
            notes: p.notes, useScreenshot: p.useScreenshot,
          });
          ok++;
        } catch (err) { console.error('Falha ao importar', p, err); }
      }
      input.value = '';
      UI.toast(`✅ ${ok} projeto(s) importado(s)`);
      await App.reload();
    };
    reader.readAsText(file);
  },
};
