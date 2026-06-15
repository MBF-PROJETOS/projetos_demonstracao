/* ============================================================
   MAIN.JS — Inicialização da aplicação
   ============================================================ */
const App = {
  // Recarrega os projetos do banco e re-renderiza a tela
  async reload() {
    try {
      projects = await Store.load();
    } catch (err) {
      console.error(err);
      UI.toast('❌ Não consegui carregar os projetos do banco.');
      projects = [];
    }
    UI.render();
  },
};

(async function init() {
  $('year').textContent = new Date().getFullYear();
  Theme.syncIcon();

  // Saudação (atualiza a cada 30s)
  UI.greet();
  setInterval(() => UI.greet(), 30000);

  // Estado de admin a partir da sessão do Supabase
  await Admin.refreshSession();
  // Mantém o visual em sincronia se a sessão mudar (expirar, outra aba, etc.)
  sb.auth.onAuthStateChange(() => Admin.refreshSession());

  // Fechar modal clicando fora
  document.querySelectorAll('.overlay').forEach(o =>
    o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); })
  );

  // Atalhos de teclado
  document.addEventListener('keydown', e => {
    const typing = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
    if (e.key === 'Escape') {
      document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'));
      if (typing) document.activeElement.blur();
      return;
    }
    if (e.key === '/' && !typing) {
      e.preventDefault();
      $('searchInput').focus();
      $('searchInput').select();
    }
  });

  // Enter na busca abre o primeiro resultado
  $('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') UI.openFirst();
  });

  // Carrega os projetos do banco e renderiza
  await App.reload();
})();
