-- 013_goal_bonus_rules.sql — Regras de bônus por atingimento de meta
--
-- Tipos de bônus:
--   fixed        → valor fixo em R$ (ex: R$ 1.000)
--   salary_pct   → % do salário base (ex: 100% = um salário completo)
--   revenue_pct  → % da receita gerada no período (ex: 5% do total vendido)
--
-- trigger_pct → a partir de qual % da meta o bônus é desbloqueado (ex: 100 = 100%)

create table if not exists goal_bonus_rules (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name         text not null,
  trigger_pct  numeric not null check (trigger_pct > 0 and trigger_pct <= 300),
  bonus_type   text not null check (bonus_type in ('fixed', 'salary_pct', 'revenue_pct')),
  bonus_value  numeric not null check (bonus_value > 0),
  applies_to   text not null default 'all'
                 check (applies_to in ('all', 'seller', 'manager', 'director', 'master')),
  active       boolean not null default true,
  created_at   timestamptz default now()
);

create index if not exists goal_bonus_rules_workspace_id_idx on goal_bonus_rules(workspace_id);

alter table goal_bonus_rules enable row level security;

create policy "workspace members can manage goal bonus rules"
  on goal_bonus_rules for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));
