-- Campo de data agendada nas atividades (para exibição no calendário)
alter table activities add column if not exists scheduled_at date;
