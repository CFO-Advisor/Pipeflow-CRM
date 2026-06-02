-- Campos de anexo nas atividades (para propostas enviadas)
alter table activities
  add column if not exists attachment_url  text,
  add column if not exists attachment_name text;
