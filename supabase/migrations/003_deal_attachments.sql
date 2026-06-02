-- ============================================================
-- BUCKET DE STORAGE PARA ANEXOS DE NEGÓCIOS
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'deal-attachments',
  'deal-attachments',
  false,
  52428800, -- 50 MB por arquivo
  array[
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'message/rfc822',
    'application/vnd.ms-outlook'
  ]
)
on conflict (id) do nothing;

-- Políticas de storage: path = {workspace_id}/{deal_id}/{category}/{filename}
create policy "Authenticated users can upload deal attachments"
  on storage.objects for insert
  with check (
    bucket_id = 'deal-attachments'
    and auth.role() = 'authenticated'
  );

create policy "Authenticated users can view deal attachments"
  on storage.objects for select
  using (
    bucket_id = 'deal-attachments'
    and auth.role() = 'authenticated'
  );

create policy "Authenticated users can delete deal attachments"
  on storage.objects for delete
  using (
    bucket_id = 'deal-attachments'
    and auth.role() = 'authenticated'
  );

-- ============================================================
-- TABELA DE ANEXOS
-- ============================================================

create table deal_attachments (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references deals(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  category    text not null check (category in ('proposta', 'cotacao', 'apresentacao')),
  name        text not null,
  file_path   text not null,
  file_size   bigint,
  mime_type   text,
  created_at  timestamptz default now(),
  created_by  uuid references auth.users(id)
);

create index deal_attachments_deal_id_idx on deal_attachments(deal_id);
create index deal_attachments_workspace_id_idx on deal_attachments(workspace_id);

-- ============================================================
-- RLS
-- ============================================================

alter table deal_attachments enable row level security;

create policy "Workspace members can view attachments"
  on deal_attachments for select
  using (is_workspace_member(workspace_id));

create policy "Workspace members can insert attachments"
  on deal_attachments for insert
  with check (is_workspace_member(workspace_id));

create policy "Workspace members can delete attachments"
  on deal_attachments for delete
  using (is_workspace_member(workspace_id));
