/* ============================================================
   MAIN.JS — Inicialização da aplicação
   ============================================================ */
(function init() {
  $('year').textContent = new Date().getFullYear();
  Theme.syncIcon();

  // Saudação + relógio (atualiza a cada 30s)
  UI.greet();
  setInterval(() => UI.greet(), 30000);

  if (Admin.isLogged) {
    document.body.classList.add('is-admin');
    $('navAdminBtn').innerHTML = '＋ <span class="txt">Novo projeto</span>';
  }

  // Fechar modal clicando fora
  document.querySelectorAll('.overlay').forEach(o =>
    o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); })
  );

  // Atalhos de teclado
  document.addEventListener('keydown', e => {
    const typing = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);

    // ESC fecha modais
    if (e.key === 'Escape') {
      document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'));
      if (typing) document.activeElement.blur();
      return;
    }
    // "/" foca a busca
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

  UI.render();
})();
