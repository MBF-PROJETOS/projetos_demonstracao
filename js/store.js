/* ============================================================
   STORE.JS — Camada de persistência (localStorage)
   ============================================================ */
const Store = {
  load() {
    try { return JSON.parse(localStorage.getItem(CONFIG.storageKey)) ?? []; }
    catch { return []; }
  },
  save(projects) {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(projects));
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
let projects = Store.load();
let editingId = null;
let activeCategory = 'all'; // 'all' | 'favs' | nome da categoria
