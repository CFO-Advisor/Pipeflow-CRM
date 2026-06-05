-- ============================================================
-- 008_proposals.sql — Gestão de Propostas e Contratos
-- ============================================================

-- Propostas vinculadas a deals
create table if not exists proposals (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  deal_id         uuid not null references deals(id) on delete cascade,
  lead_id         uuid references leads(id) on delete set null,
  title           text not null,
  description     text,
  valid_until     date,
  status          text not null default 'draft'
                    check (status in ('draft','sent','awaiting_signature','signed','rejected','expired')),
  total_value     numeric not null default 0,
  notes           text,
  created_by      uuid references auth.users(id) on delete set null,
  signed_by_seller_at  timestamptz,
  signed_by_client_at  timestamptz,
  public_token    text unique not null default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  pdf_path        text,       -- path no Storage: proposals/{id}/original.pdf
  signed_pdf_path text,       -- path no Storage: proposals/{id}/signed.pdf
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Itens de linha da proposta
create table if not exists proposal_items (
  id           uuid primary key default gen_random_uuid(),
  proposal_id  uuid not null references proposals(id) on delete cascade,
  description  text not null,
  quantity     numeric not null default 1 check (quantity > 0),
  unit_price   numeric not null default 0,
  position     int not null default 0
);

-- Templates reutilizáveis de proposta
create table if not exists proposal_templates (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name         text not null,
  description  text,
  items        jsonb not null default '[]',  -- [{description, quantity, unit_price}]
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz default now()
);

-- Índices
create index if not exists proposals_workspace_id_idx on proposals(workspace_id);
create index if not exists proposals_deal_id_idx on proposals(deal_id);
create index if not exists proposals_status_idx on proposals(status);
create index if not exists proposals_public_token_idx on proposals(public_token);
create index if not exists proposal_items_proposal_id_idx on proposal_items(proposal_id);
create index if not exists proposal_templates_workspace_id_idx on proposal_templates(workspace_id);

-- Trigger updated_at
create or replace function update_proposals_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists proposals_updated_at on proposals;
create trigger proposals_updated_at
  before update on proposals
  for each row execute function update_proposals_updated_at();

-- RLS
alter table proposals enable row level security;
alter table proposal_items enable row level security;
alter table proposal_templates enable row level security;

-- Políticas: membros do workspace têm acesso completo
create policy "workspace members can manage proposals"
  on proposals for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy "workspace members can manage proposal items"
  on proposal_items for all
  using (
    exists (
      select 1 from proposals p
      where p.id = proposal_items.proposal_id
        and is_workspace_member(p.workspace_id)
    )
  )
  with check (
    exists (
      select 1 from proposals p
      where p.id = proposal_items.proposal_id
        and is_workspace_member(p.workspace_id)
    )
  );

create policy "workspace members can manage proposal templates"
  on proposal_templates for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

-- Acesso público à proposta via token (sem autenticação) — apenas leitura
create policy "public read via token"
  on proposals for select
  using (true);  -- filtro por token feito na query com service client
