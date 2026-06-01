-- ============================================================
-- MIGRAÇÃO 002: Plano MAX — Multi-empresa e RBAC Hierárquico
-- ============================================================

-- 1. Tabela de empresas (disponível no plano MAX)
create table companies (
  id           uuid        primary key default gen_random_uuid(),
  workspace_id uuid        references workspaces(id) on delete cascade not null,
  name         text        not null,
  cnpj         text,
  active       boolean     not null default true,
  created_at   timestamptz default now()
);

-- 2. Papel hierárquico de vendas em cada membro
--    master > director > manager > seller
alter table workspace_members
  add column sales_role  text not null default 'seller',
  add column manager_id  uuid references workspace_members(id) on delete set null;

-- Migração: admins existentes herdam o papel 'master'
update workspace_members set sales_role = 'master' where role = 'admin';

-- 3. Acesso por empresa (para plano MAX)
create table user_company_access (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid references workspace_members(id) on delete cascade not null,
  company_id uuid references companies(id) on delete cascade not null,
  unique(member_id, company_id)
);

-- 4. Permissões finas por usuário e recurso
create table user_permissions (
  id          uuid    primary key default gen_random_uuid(),
  member_id   uuid    references workspace_members(id) on delete cascade not null,
  resource    text    not null, -- 'leads' | 'deals' | 'activities' | 'reports'
  can_view    boolean not null default true,
  can_create  boolean not null default true,
  can_edit    boolean not null default true,
  can_delete  boolean not null default false,
  data_scope  text    not null default 'own', -- 'all' | 'team' | 'own'
  unique(member_id, resource)
);

-- 5. company_id nas tabelas principais (nullable — Free/Pro não usam)
alter table leads      add column company_id uuid references companies(id) on delete set null;
alter table deals      add column company_id uuid references companies(id) on delete set null;
alter table activities add column company_id uuid references companies(id) on delete set null;

-- ============================================================
-- ÍNDICES
-- ============================================================

create index on companies(workspace_id);
create index on workspace_members(manager_id);
create index on user_company_access(member_id);
create index on user_company_access(company_id);
create index on user_permissions(member_id);
create index on leads(company_id);
create index on deals(company_id);
create index on activities(company_id);

-- ============================================================
-- ROW LEVEL SECURITY — Novas tabelas
-- ============================================================

alter table companies           enable row level security;
alter table user_company_access enable row level security;
alter table user_permissions    enable row level security;

-- ============================================================
-- FUNÇÕES AUXILIARES PARA RLS
-- ============================================================

-- Retorna o sales_role do usuário atual no workspace
create or replace function get_sales_role(wid uuid)
returns text as $$
  select sales_role
  from   workspace_members
  where  workspace_id = wid and user_id = auth.uid()
  limit  1
$$ language sql security definer stable;

-- Retorna o id do membro atual no workspace
create or replace function get_member_id(wid uuid)
returns uuid as $$
  select id
  from   workspace_members
  where  workspace_id = wid and user_id = auth.uid()
  limit  1
$$ language sql security definer stable;

-- Verifica acesso a um registro considerando plano e hierarquia de vendas.
-- wid:          workspace_id do registro
-- assigned_uid: assigned_to (leads/deals) ou author_id (activities)
-- comp_id:      company_id do registro (nullable)
create or replace function can_access_resource(
  wid          uuid,
  assigned_uid uuid,
  comp_id      uuid
) returns boolean as $$
declare
  ws_plan    text;
  m          record;
begin
  select plan into ws_plan from workspaces where id = wid;

  -- Free / Pro: basta ser membro do workspace
  if ws_plan is distinct from 'max' then
    return is_workspace_member(wid);
  end if;

  -- MAX: verificação hierárquica
  select id, sales_role, manager_id
  into   m
  from   workspace_members
  where  workspace_id = wid and user_id = auth.uid();

  if not found then return false; end if;

  -- master: acessa tudo
  if m.sales_role = 'master' then return true; end if;

  -- Registros sem responsável: apenas master/director/manager podem acessar
  if assigned_uid is null then
    return m.sales_role in ('master', 'director', 'manager');
  end if;

  -- director: acessa registros nas empresas atribuídas a ele
  if m.sales_role = 'director' then
    if comp_id is null then return true; end if;
    return exists (
      select 1 from user_company_access
      where  member_id = m.id and company_id = comp_id
    );
  end if;

  -- manager: acessa seus registros e os dos subordinados diretos
  if m.sales_role = 'manager' then
    return (assigned_uid = auth.uid())
      or exists (
        select 1 from workspace_members
        where  workspace_id = wid
          and  manager_id   = m.id
          and  user_id      = assigned_uid
      );
  end if;

  -- seller: apenas os próprios registros
  return assigned_uid = auth.uid();
end;
$$ language plpgsql security definer stable;

-- ============================================================
-- ATUALIZAR POLÍTICAS: leads, deals, activities
-- ============================================================

drop policy if exists "leads_all"      on leads;
drop policy if exists "deals_all"      on deals;
drop policy if exists "activities_all" on activities;

-- Leads: acesso por papel hierárquico
create policy "leads_access" on leads
  for all using (can_access_resource(workspace_id, assigned_to, company_id));

-- Deals: acesso por papel hierárquico
create policy "deals_access" on deals
  for all using (can_access_resource(workspace_id, assigned_to, company_id));

-- Activities: quem pode ver a lead pode ver suas atividades
create policy "activities_access" on activities
  for all using (
    case
      when (select plan from workspaces where id = workspace_id) = 'max' then
        exists (
          select 1 from leads l
          where  l.id = activities.lead_id
            and  can_access_resource(l.workspace_id, l.assigned_to, l.company_id)
        )
      else
        is_workspace_member(workspace_id)
    end
  );

-- ============================================================
-- POLÍTICAS RLS — Novas tabelas
-- ============================================================

-- Companies: membros listam; admin/master gerenciam
create policy "companies_select" on companies
  for select using (is_workspace_member(workspace_id));

create policy "companies_write" on companies
  for all using (
    exists (
      select 1 from workspace_members
      where  workspace_id = companies.workspace_id
        and  user_id      = auth.uid()
        and  (role = 'admin' or sales_role = 'master')
    )
  );

-- user_company_access: membro vê os próprios; admin/master gerenciam
create policy "uca_select" on user_company_access
  for select using (
    exists (
      select 1 from workspace_members wm
      join   companies c on c.id = user_company_access.company_id
      where  wm.user_id      = auth.uid()
        and  wm.workspace_id = c.workspace_id
        and  (
          wm.id = user_company_access.member_id
          or wm.sales_role in ('master', 'director')
          or wm.role = 'admin'
        )
    )
  );

create policy "uca_write" on user_company_access
  for all using (
    exists (
      select 1 from workspace_members wm
      join   companies c on c.id = user_company_access.company_id
      where  wm.user_id      = auth.uid()
        and  wm.workspace_id = c.workspace_id
        and  (wm.role = 'admin' or wm.sales_role = 'master')
    )
  );

-- user_permissions: membro vê as próprias; admin/master/manager gerenciam
create policy "uperm_select" on user_permissions
  for select using (
    member_id in (select id from workspace_members where user_id = auth.uid())
    or exists (
      select 1 from workspace_members wm
      join   workspace_members target on target.id = user_permissions.member_id
      where  wm.user_id      = auth.uid()
        and  wm.workspace_id = target.workspace_id
        and  wm.sales_role   in ('master', 'director', 'manager')
    )
  );

create policy "uperm_write" on user_permissions
  for all using (
    exists (
      select 1 from workspace_members wm
      join   workspace_members target on target.id = user_permissions.member_id
      where  wm.user_id      = auth.uid()
        and  wm.workspace_id = target.workspace_id
        and  (wm.role = 'admin' or wm.sales_role in ('master', 'director'))
    )
  );

-- workspace_members: admin/master podem atualizar papéis
create policy "workspace_members_update" on workspace_members
  for update using (
    exists (
      select 1 from workspace_members admin_m
      where  admin_m.workspace_id = workspace_members.workspace_id
        and  admin_m.user_id      = auth.uid()
        and  (admin_m.role = 'admin' or admin_m.sales_role = 'master')
    )
  );
