/* ============================================================
   STORE.JS — Camada de dados (Supabase + favoritos locais)
   ============================================================ */

/* Projetos: agora vivem no Supabase (compartilhados por todos).
   A LEITURA é pública; a ESCRITA exige admin autenticado (RLS). */
const Store = {
  async load() {
    const { data, error } = await db()
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('Erro ao carregar projetos:', error); throw error; }
    // Normaliza para o formato usado na tela
    return (data ?? []).map(r => ({
      id: r.id,
      name: r.name,
      url: r.url,
      desc: r.description ?? '',
      category: r.category ?? '',
      sector: r.sector ?? '',
      owner: r.owner ?? '',
      notes: r.notes ?? '',
      pinned: !!r.pinned,
      clicks: r.clicks ?? 0,
      useScreenshot: !!r.use_screenshot,
      createdAt: r.created_at ? new Date(r.created_at).getTime() : 0,
    }));
  },

  // Converte do formato da tela para as colunas do banco
  _toRow(p) {
    return {
      name: p.name,
      url: p.url,
      description: p.desc,
      category: p.category || null,
      sector: p.sector || null,
      owner: p.owner || null,
      notes: p.notes || null,
      pinned: !!p.pinned,
      use_screenshot: !!p.useScreenshot,
    };
  },

  async insert(p) {
    const { data, error } = await db().insert(this._toRow(p)).select().single();
    if (error) throw error;
    return data;
  },

  async update(id, p) {
    const { error } = await db().update(this._toRow(p)).eq('id', id);
    if (error) throw error;
  },

  async setPinned(id, pinned) {
    const { error } = await db().update({ pinned }).eq('id', id);
    if (error) throw error;
  },

  async remove(id) {
    const { error } = await db().delete().eq('id', id);
    if (error) throw error;
  },

  // Conta um clique (qualquer visitante) via função segura no banco
  async bumpClick(id) {
    try { await sb.schema(CONFIG.schema).rpc('bump_click', { pid: id }); }
    catch (e) { console.warn('Falha ao contar clique', e); }
  },

  /* Lê os projetos antigos salvos no navegador (para migração 1x) */
  legacy() {
    try { return JSON.parse(localStorage.getItem(CONFIG.legacyStorageKey)) ?? []; }
    catch { return []; }
  },
};

/* Favoritos — por navegador (cada pessoa tem os seus) */
const Favs = {
  key: 'mb_favs',
  load() {
    try { return new Set(JSON.parse(localStorage.getItem(this.key)) ?? []); }
    catch { return new Set(); }
  },
  toggle(id) {
    const set = this.load();
    set.has(id) ? set.delete(id) : set.add(id);
    localStorage.setItem(this.key, JSON.stringify([...set]));
    return set.has(id);
  },
  has(id) { return this.load().has(id); },
};

// Estado global da aplicação
let projects = [];          // preenchido por Store.load() na inicialização
let editingId = null;
let activeCategory = 'all'; // 'all' | 'favs' | nome da categoria
