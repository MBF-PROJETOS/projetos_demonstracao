/* ============================================================
   CONFIG.JS — Configurações centrais do site
   ============================================================ */
const CONFIG = {
  storageKey: 'mb_projects_v1',
  authKey:    'mb_admin_session',
  passKey:    'mb_admin_pass',
  defaultPass:'mb2026',  // ⚠️ troque no console: Admin.setPassword('novaSenha')
  screenshot: url => `https://image.thum.io/get/width/800/crop/700/noanimate/${url}`,
};
