-- Habilitar extensão para UUIDs
create extension if not exists "pgcrypto";

-- ============================================================
-- TABELAS
-- ============================================================

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  plan text not null default 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now()
);

create table workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'member',
  invited_email text,
  joined_at timestamptz default now(),
  unique(workspace_id, user_id)
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  name text not null,
  email text,
  phone text,
  company text,
  position text,
  status text not null default 'active',
  assigned_to uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table deals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  lead_id uuid references leads(id) on delete cascade not null,
  title text not null,
  value numeric default 0,
  stage text not null default 'new_lead',
  assigned_to uuid references auth.users(id),
  deadline date,
  position integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table activities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  lead_id uuid references leads(id) on delete cascade not null,
  author_id uuid references auth.users(id),
  type text not null,
  description text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

create index on workspace_members(workspace_id);
create index on workspace_members(user_id);
create index on leads(workspace_id);
create index on deals(workspace_id);
create index on deals(stage);
create index on activities(lead_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table leads enable row level security;
alter table deals enable row level security;
alter table activities enable row level security;

-- Helper function para verificar membership
create or replace function is_workspace_member(wid uuid)
returns boolean as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = wid and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- Workspaces: membros podem ver e admins podem editar
create policy "workspace_members_select" on workspaces
  for select using (is_workspace_member(id));

create policy "workspace_members_update" on workspaces
  for update using (
    exists (
      select 1 from workspace_members
      where workspace_id = id and user_id = auth.uid() and role = 'admin'
    )
  );

create policy "workspace_insert" on workspaces
  for insert with check (true);

-- Workspace members
create policy "workspace_members_select" on workspace_members
  for select using (is_workspace_member(workspace_id));

create policy "workspace_members_insert" on workspace_members
  for insert with check (
    exists (
      select 1 from workspace_members
      where workspace_id = workspace_members.workspace_id
        and user_id = auth.uid()
        and role = 'admin'
    )
  );

create policy "workspace_members_delete" on workspace_members
  for delete using (
    exists (
      select 1 from workspace_members wm
      where wm.workspace_id = workspace_members.workspace_id
        and wm.user_id = auth.uid()
        and wm.role = 'admin'
    )
  );

-- Leads
create policy "leads_all" on leads
  for all using (is_workspace_member(workspace_id));

-- Deals
create policy "deals_all" on deals
  for all using (is_workspace_member(workspace_id));

-- Activities
create policy "activities_all" on activities
  for all using (is_workspace_member(workspace_id));

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_updated_at
  before update on leads
  for each row execute function update_updated_at();

create trigger deals_updated_at
  before update on deals
  for each row execute function update_updated_at();
