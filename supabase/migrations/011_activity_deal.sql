-- ============================================================
-- 011_activity_deal.sql — Vincular atividades a negócios (deals)
-- ============================================================

alter table activities
  add column if not exists deal_id uuid references deals(id) on delete set null;

create index if not exists activities_deal_id_idx on activities(deal_id);
