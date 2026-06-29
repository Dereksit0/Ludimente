-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 019 Reportes de progreso para padres
--   • reportes_progreso : informe de avance de un paciente en un
--     periodo, con snapshot de objetivos y narrativa para la familia.
--   Datos clínicos → RLS clínico (admin + psicólogo asignado).
--   El portal de padres los lee vía service_role (no afectado por RLS).
-- ════════════════════════════════════════════════════════════

create table if not exists reportes_progreso (
  id               uuid primary key default gen_random_uuid(),
  paciente_id      uuid not null references pacientes(id) on delete cascade,
  plan_id          uuid references planes_intervencion(id) on delete set null,
  psicologo_id     uuid references profiles(id),
  titulo           text not null,
  periodo_inicio   date,
  periodo_fin      date,
  resumen          text,
  logros           text,
  recomendaciones  text,
  objetivos_snapshot jsonb not null default '[]'::jsonb,
  compartido       boolean not null default false,
  created_by       uuid references profiles(id),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
create index if not exists idx_reprog_paciente on reportes_progreso(paciente_id);

drop trigger if exists trg_updated_at on reportes_progreso;
create trigger trg_updated_at before update on reportes_progreso
  for each row execute function public.set_updated_at();

alter table reportes_progreso enable row level security;

create policy reprog_clinico on reportes_progreso
  for all to authenticated
  using (public.is_clinico() and (public.is_admin() or psicologo_id = auth.uid()))
  with check (public.is_clinico() and (public.is_admin() or psicologo_id = auth.uid()));

do $$
begin
  execute 'drop trigger if exists trg_audit on reportes_progreso';
  execute 'create trigger trg_audit after insert or update or delete on reportes_progreso '
       || 'for each row execute function public.fn_audit()';
end$$;
