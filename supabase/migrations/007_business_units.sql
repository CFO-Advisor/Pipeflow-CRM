-- ── Unidades de Negócio ─────────────────────────────────────────────
-- Hierarquia: Empresa → Unidade de Negócio (disponível em todos os planos)

create table if not exists business_units (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade not null,
  company_id   uuid references companies(id)  on delete cascade not null,
  name         text not null,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

create index if not exists business_units_workspace_id_idx on business_units(workspace_id);
create index if not exists business_units_company_id_idx   on business_units(company_id);

alter table business_units enable row level security;

create policy "bu_member_access" on business_units
  for all using (is_workspace_member(workspace_id));

-- Coluna business_unit_id em leads e deals (nullable, retrocompatível)
alter table leads  add column if not exists business_unit_id uuid references business_units(id) on delete set null;
alter table deals  add column if not exists business_unit_id uuid references business_units(id) on delete set null;
