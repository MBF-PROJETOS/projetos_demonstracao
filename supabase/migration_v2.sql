-- ============================================================
-- MB FINANCE — Hub interno — Migração v2
-- Colunas novas + contador de cliques. Cole no SQL Editor e Run.
-- Idempotente: pode rodar mais de uma vez sem problema.
-- ============================================================

-- 1) Novas colunas na tabela de projetos
alter table "Hub_Mbfinance".projects
  add column if not exists sector         text,
  add column if not exists owner          text,
  add column if not exists notes          text,
  add column if not exists pinned         boolean not null default false,
  add column if not exists clicks         integer not null default 0,
  add column if not exists use_screenshot boolean not null default false;

-- 2) Contador de cliques: qualquer visitante pode incrementar com segurança.
--    SECURITY DEFINER deixa a função (não o visitante) fazer o UPDATE,
--    então o RLS continua barrando escrita direta por quem não é admin.
create or replace function "Hub_Mbfinance".bump_click(pid uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update "Hub_Mbfinance".projects
     set clicks = clicks + 1
   where id = pid;
$$;

grant execute on function "Hub_Mbfinance".bump_click(uuid) to anon, authenticated;
