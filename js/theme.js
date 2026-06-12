/* ============================================================
   THEME.JS — Modo claro / escuro
   Carregado no <head> para aplicar o tema antes da pintura
   (evita "flash" de tema errado ao abrir a página)
   ============================================================ */
const Theme = {
  key: 'mb_theme',

  get current() {
    return localStorage.getItem(this.key) || 'dark';
  },

  apply(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(this.key, theme);
    this.syncIcon();
  },

  toggle() {
    this.apply(this.current === 'dark' ? 'light' : 'dark');
  },

  syncIcon() {
    const btn = document.getElementById('themeBtn');
    if (btn) {
      btn.textContent = this.current === 'dark' ? '☀️' : '🌙';
      btn.title = this.current === 'dark' ? 'Modo claro' : 'Modo escuro';
    }
  },
};

Theme.apply(Theme.current);
