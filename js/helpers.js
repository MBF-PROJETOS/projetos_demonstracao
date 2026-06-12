/* ============================================================
   HELPERS.JS — Funções utilitárias
   ============================================================ */
const $ = id => document.getElementById(id);

const domainOf = url => {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return url; }
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const escapeHtml = s => s.replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
);
