-- Tabela de tipos de evento (tipo de escala)

-- IMPORTANTE:
-- Este modelo segue o padrão "id uuid" (sem chave text).
-- O relacionamento é feito via eventos.tipo_evento_id (FK).

create table if not exists public.tipos_evento (
  id uuid primary key,
  nome text not null unique,
  ordem int not null default 0
);

-- Seeds com UUIDs FIXOS (para permitir backfill e referências estáveis)
insert into public.tipos_evento (id, nome, ordem)
values
  ('11111111-1111-1111-1111-111111111111', 'Culto', 1),
  ('22222222-2222-2222-2222-222222222222', 'Ensaio', 2),
  ('33333333-3333-3333-3333-333333333333', 'Estudo Bíblico', 3),
  ('44444444-4444-4444-4444-444444444444', 'Confraternização', 4)
on conflict (id) do update set
  nome = excluded.nome,
  ordem = excluded.ordem;

-- Adiciona FK em eventos para tipos_evento
alter table public.eventos
  add column if not exists tipo_evento_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'eventos_tipo_evento_id_fkey'
  ) then
    alter table public.eventos
      add constraint eventos_tipo_evento_id_fkey
      foreign key (tipo_evento_id) references public.tipos_evento (id);
  end if;
end $$;

-- Backfill a partir do modelo antigo (eventos.tipo text)
-- Mantemos eventos.tipo por compatibilidade; depois pode ser removido.
update public.eventos set tipo_evento_id = '11111111-1111-1111-1111-111111111111'
where tipo_evento_id is null and tipo = 'culto';

update public.eventos set tipo_evento_id = '22222222-2222-2222-2222-222222222222'
where tipo_evento_id is null and tipo = 'ensaio';

update public.eventos set tipo_evento_id = '33333333-3333-3333-3333-333333333333'
where tipo_evento_id is null and (tipo = 'estudo_biblico' or tipo = 'estudo biblico' or tipo = 'estudo bíblico');

update public.eventos set tipo_evento_id = '44444444-4444-4444-4444-444444444444'
where tipo_evento_id is null and (tipo = 'confraternizacao' or tipo = 'confraternização');
