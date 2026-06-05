-- ============================================================
-- 009_goals_commissions.sql — Metas e Comissões de Vendas
-- ============================================================

-- Metas individuais por membro e período
create table if not exists sales_goals (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  member_id    uuid not null references workspace_members(id) on delete cascade,
  goal_type    text not null check (goal_type in ('revenue', 'deals_count')),
  target_value numeric not null check (target_value > 0),
  period_start date not null,
  period_end   date not null check (period_end >= period_start),
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz default now(),
  unique (member_id, goal_type, period_start, period_end)
);

-- Regras de comissão configuradas por workspace
create table if not exists commission_rules (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name         text not null,
  percentage   numeric not null check (percentage >= 0 and percentage <= 100),
  applies_to   text not null default 'all'
                 check (applies_to in ('all','seller','manager','director','master')),
  active       boolean not null default true,
  created_at   timestamptz default now()
);

-- Comissões calculadas a partir de deals fechados
create table if not exists commissions (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  deal_id      uuid not null references deals(id) on delete cascade,
  member_id    uuid not null references workspace_members(id) on delete cascade,
  rule_id      uuid references commission_rules(id) on delete set null,
  deal_value   numeric not null,
  percentage   numeric not null,
  amount       numeric not null,  -- deal_value * percentage / 100
  status       text not null default 'pending'
                 check (status in ('pending','paid')),
  paid_at      timestamptz,
  created_at   timestamptz default now(),
  unique (deal_id, member_id)
);

-- Índices
create index if not exists sales_goals_workspace_id_idx on sales_goals(workspace_id);
create index if not exists sales_goals_member_id_idx on sales_goals(member_id);
create index if not exists sales_goals_period_idx on sales_goals(period_start, period_end);
create index if not exists commission_rules_workspace_id_idx on commission_rules(workspace_id);
create index if not exists commissions_workspace_id_idx on commissions(workspace_id);
create index if not exists commissions_member_id_idx on commissions(member_id);
create index if not exists commissions_deal_id_idx on commissions(deal_id);
create index if not exists commissions_status_idx on commissions(status);

-- RLS
alter table sales_goals enable row level security;
alter table commission_rules enable row level security;
alter table commissions enable row level security;

-- Políticas
create policy "workspace members can view sales goals"
  on sales_goals for select
  using (is_workspace_member(workspace_id));

create policy "workspace members can manage sales goals"
  on sales_goals for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy "workspace members can manage commission rules"
  on commission_rules for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy "workspace members can manage commissions"
  on commissions for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));
