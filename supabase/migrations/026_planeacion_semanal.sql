-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 026 Planeación semanal de terapias
--   • planeaciones : plan de cada paciente por día/horario, para que
--     cualquier terapeuta pueda cubrir si falta el titular.
--   Lectura: todo el personal. Escritura: admin y clínicos.
-- ════════════════════════════════════════════════════════════

create table if not exists planeaciones (
  id            uuid primary key default gen_random_uuid(),
  paciente_id   uuid not null references pacientes(id) on delete cascade,
  terapeuta_id  uuid references profiles(id),
  dia_semana    smallint not null default 1 check (dia_semana between 1 and 7),
  horario       text,
  objetivos     text,
  inicio        text,
  desarrollo    text,
  cierre        text,
  materiales    text,
  notas         text,
  activo        boolean not null default true,
  created_by    uuid references profiles(id),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists idx_planeacion_paciente on planeaciones(paciente_id);
create index if not exists idx_planeacion_dia on planeaciones(dia_semana);

drop trigger if exists trg_updated_at on planeaciones;
create trigger trg_updated_at before update on planeaciones
  for each row execute function public.set_updated_at();

alter table planeaciones enable row level security;

-- Lectura: todo el personal autenticado (para poder cubrir a otro terapeuta).
drop policy if exists planeacion_lectura on planeaciones;
create policy planeacion_lectura on planeaciones
  for select to authenticated using (true);

-- Escritura: admin y clínicos.
drop policy if exists planeacion_gestion on planeaciones;
create policy planeacion_gestion on planeaciones
  for all to authenticated
  using (public.is_admin() or public.is_clinico())
  with check (public.is_admin() or public.is_clinico());

do $$
begin
  execute 'drop trigger if exists trg_audit on planeaciones';
  execute 'create trigger trg_audit after insert or update or delete on planeaciones '
       || 'for each row execute function public.fn_audit()';
end$$;
