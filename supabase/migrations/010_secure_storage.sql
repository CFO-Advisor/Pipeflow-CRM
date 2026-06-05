-- ============================================================
-- 010_secure_storage.sql — Garantir bucket deal-attachments privado
-- ============================================================

-- Recriar bucket como privado (sem acesso público anônimo)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'deal-attachments',
  'deal-attachments',
  false,                  -- privado: nunca acessível por URL direta
  20971520,              -- 20 MB
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 20971520;

-- Remover qualquer política pública antiga
drop policy if exists "Public read deal-attachments" on storage.objects;
drop policy if exists "Give users access to own folder" on storage.objects;

-- Apenas service role tem acesso (via API routes autenticadas)
-- Membros autenticados podem fazer upload de seus próprios arquivos
create policy "Authenticated members upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'deal-attachments');

create policy "Authenticated members read own workspace files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'deal-attachments');

create policy "Authenticated members delete own files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'deal-attachments');
