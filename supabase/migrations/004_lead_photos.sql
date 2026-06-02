-- Coluna de foto no perfil do lead
alter table leads add column if not exists photo_url text;

-- Bucket público para fotos de leads (avatares exibidos em listas)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lead-photos',
  'lead-photos',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "Authenticated users can upload lead photos"
  on storage.objects for insert
  with check (bucket_id = 'lead-photos' and auth.role() = 'authenticated');

create policy "Anyone can view lead photos"
  on storage.objects for select
  using (bucket_id = 'lead-photos');

create policy "Authenticated users can update lead photos"
  on storage.objects for update
  using (bucket_id = 'lead-photos' and auth.role() = 'authenticated');

create policy "Authenticated users can delete lead photos"
  on storage.objects for delete
  using (bucket_id = 'lead-photos' and auth.role() = 'authenticated');
