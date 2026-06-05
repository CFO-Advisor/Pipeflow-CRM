-- Coluna de logo na empresa
alter table companies add column if not exists logo_url text;

-- Bucket público para logos de empresas
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-logos',
  'company-logos',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

create policy "Authenticated users can upload company logos"
  on storage.objects for insert
  with check (bucket_id = 'company-logos' and auth.role() = 'authenticated');

create policy "Anyone can view company logos"
  on storage.objects for select
  using (bucket_id = 'company-logos');

create policy "Authenticated users can update company logos"
  on storage.objects for update
  using (bucket_id = 'company-logos' and auth.role() = 'authenticated');

create policy "Authenticated users can delete company logos"
  on storage.objects for delete
  using (bucket_id = 'company-logos' and auth.role() = 'authenticated');
