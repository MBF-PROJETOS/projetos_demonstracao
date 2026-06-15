-- ============================================================
-- MB FINANCE — Hub interno
-- Schema dedicado + segurança (RLS) para o Supabase
-- Cole TUDO isto no SQL Editor do Supabase e clique em "Run".
-- ============================================================
-- Modelo de segurança:
--   • Qualquer visitante (anon)  -> SÓ LEITURA dos projetos.
--   • Admin autenticado da lista -> criar / editar / excluir.
-- A senha do admin NÃO fica no código: a autenticação é feita
-- pelo Supabase Auth e o RLS é aplicado no servidor.
-- ============================================================

-- 1) Garante o schema dedicado
create schema if not exists "Hub_Mbfinance";

-- 2) Lista de administradores (allowlist por e-mail)
--    Só quem estiver aqui pode escrever, mesmo logado.
create table if not exists "Hub_Mbfinance".admins (
  email      text primary key,
  added_at   timestamptz not null default now()
);

-- 3) Tabela de projetos do hub
create table if not exists "Hub_Mbfinance".projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  url         text not null,
  description text not null default '',
  category    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 4) Função: o usuário logado é admin?
--    SECURITY DEFINER + search_path vazio = seguro e sem recursão de RLS.
create or replace function "Hub_Mbfinance".is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from "Hub_Mbfinance".admins a
    where lower(a.email) = lower(auth.jwt() ->> 'email')
  );
$$;

-- 5) Liga o RLS nas duas tabelas
alter table "Hub_Mbfinance".projects enable row level security;
alter table "Hub_Mbfinance".admins   enable row level security;

-- 6) Políticas de acesso aos projetos
drop policy if exists projects_public_read   on "Hub_Mbfinance".projects;
drop policy if exists projects_admin_insert  on "Hub_Mbfinance".projects;
drop policy if exists projects_admin_update  on "Hub_Mbfinance".projects;
drop policy if exists projects_admin_delete  on "Hub_Mbfinance".projects;

create policy projects_public_read on "Hub_Mbfinance".projects
  for select using (true);

create policy projects_admin_insert on "Hub_Mbfinance".projects
  for insert with check ("Hub_Mbfinance".is_admin());

create policy projects_admin_update on "Hub_Mbfinance".projects
  for update using ("Hub_Mbfinance".is_admin())
            with check ("Hub_Mbfinance".is_admin());

create policy projects_admin_delete on "Hub_Mbfinance".projects
  for delete using ("Hub_Mbfinance".is_admin());

-- 7) A tabela de admins: só admin logado consegue ler; ninguém escreve via API
drop policy if exists admins_read on "Hub_Mbfinance".admins;
create policy admins_read on "Hub_Mbfinance".admins
  for select using ("Hub_Mbfinance".is_admin());

-- 8) Permissões para a API REST (PostgREST) enxergar o schema/tabelas
grant usage on schema "Hub_Mbfinance" to anon, authenticated;
grant select on "Hub_Mbfinance".projects to anon, authenticated;
grant insert, update, delete on "Hub_Mbfinance".projects to authenticated;
grant select on "Hub_Mbfinance".admins to authenticated;

-- Futuras tabelas no schema também ficam acessíveis por padrão
alter default privileges in schema "Hub_Mbfinance"
  grant select on tables to anon, authenticated;

-- 9) Mantém updated_at sempre atualizado
create or replace function "Hub_Mbfinance".set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_projects_updated on "Hub_Mbfinance".projects;
create trigger trg_projects_updated
  before update on "Hub_Mbfinance".projects
  for each row execute function "Hub_Mbfinance".set_updated_at();

-- 10) Cadastra o admin inicial (troque/adicione e-mails à vontade)
insert into "Hub_Mbfinance".admins (email)
values ('pedro.azara09@gmail.com')
on conflict (email) do nothing;

-- ============================================================
-- IMPORTANTE — 2 passos manuais no painel depois de rodar:
--
-- (A) Expor o schema à API:
--     Project Settings → API → "Exposed schemas"
--     adicione:  Hub_Mbfinance   → Save
--
-- (B) Criar o usuário admin no Auth:
--     Authentication → Users → "Add user"
--     e-mail: pedro.azara09@gmail.com  + uma senha forte
--     (o e-mail PRECISA estar na tabela admins acima)
--
--     E desative cadastros públicos:
--     Authentication → Providers → Email → desligue "Allow new users to sign up"
-- ============================================================
