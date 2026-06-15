/* ============================================================
   CONFIG.JS — Configurações centrais do site
   ------------------------------------------------------------
   A anon key é PÚBLICA por design (protegida pelo RLS no banco).
   NUNCA coloque aqui a senha do postgres nem a service_role key.
   ============================================================ */
const CONFIG = {
  // --- Supabase ---
  supabaseUrl: 'https://qdkiksitojyeembgzdey.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFka2lrc2l0b2p5ZWVtYmd6ZGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODE0NDEsImV4cCI6MjA4OTk1NzQ0MX0.bukGCjPyYclVkVLNxt-mRmNSlQhQxQDfTnpex9jTvOY',
  schema: 'Hub_Mbfinance',
  table: 'projects',

  // Chave do localStorage usada na migração 1x dos dados antigos
  legacyStorageKey: 'mb_projects_v1',

  // Serviço de screenshot dos cards
  screenshot: url => `https://image.thum.io/get/width/800/crop/700/noanimate/${url}`,
};

// Cliente Supabase (a lib é carregada via CDN no index.html, ANTES deste arquivo)
const sb = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

// Atalho para a tabela de projetos dentro do schema dedicado
const db = () => sb.schema(CONFIG.schema).from(CONFIG.table);
