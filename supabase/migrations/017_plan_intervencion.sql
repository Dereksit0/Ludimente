-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 017 Plan de intervención y objetivos terapéuticos
--   • planes_intervencion    : plan clínico de un paciente
--   • objetivos_intervencion : objetivos/metas dentro de un plan
--   • objetivo_seguimientos  : avances registrados en el tiempo
--   Datos clínicos → RLS clínico (admin + psicólogo asignado).
--   Recepción no tiene acceso (igual que sesiones/evaluaciones).
-- ════════════════════════════════════════════════════════════

create table if not exists planes_intervencion (
  id                 uuid primary key default gen_random_uuid(),
  paciente_id        uuid not null references pacientes(id) on delete cascade,
  psicologo_id       uuid references profiles(id),
  titulo             text not null,
  diagnostico_base   text,
  descripcion        text,
  fecha_inicio       date not null default current_date,
  fecha_fin_estimada date,
  estatus            text not null default 'activo'
                       check (estatus in ('activo','pausado','completado','cancelado')),
  created_by         uuid references profiles(id),
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);
create index if not exists idx_planes_paciente on planes_intervencion(paciente_id);
create index if not exists idx_planes_psicologo on planes_intervencion(psicologo_id);

create table if not exists objetivos_intervencion (
  id          uuid primary key default gen_random_uuid(),
  plan_id     uuid not null references planes_intervencion(id) on delete cascade,
  descripcion text not null,
  area        text not null default 'otro' check (area in (
                'lenguaje','aprendizaje','conducta','motriz',
                'socioemocional','atencion','autonomia','otro')),
  prioridad   text not null default 'media' check (prioridad in ('alta','media','baja')),
  estatus     text not null default 'pendiente'
                check (estatus in ('pendiente','en_progreso','logrado','no_logrado')),
  progreso    integer not null default 0 check (progreso between 0 and 100),
  fecha_meta  date,
  orden       integer not null default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists idx_objetivos_plan on objetivos_intervencion(plan_id);

create table if not exists objetivo_seguimientos (
  id          uuid primary key default gen_random_uuid(),
  objetivo_id uuid not null references objetivos_intervencion(id) on delete cascade,
  fecha       date not null default current_date,
  progreso    integer not null check (progreso between 0 and 100),
  nota        text,
  created_by  uuid references profiles(id),
  created_at  timestamptz default now()
);
create index if not exists idx_seg_objetivo on objetivo_seguimientos(objetivo_id);

-- updated_at
drop trigger if exists trg_updated_at on planes_intervencion;
create trigger trg_updated_at before update on planes_intervencion
  for each row execute function public.set_updated_at();
drop trigger if exists trg_updated_at on objetivos_intervencion;
create trigger trg_updated_at before update on objetivos_intervencion
  for each row execute function public.set_updated_at();

-- ── RLS ──
alter table planes_intervencion    enable row level security;
alter table objetivos_intervencion enable row level security;
alter table objetivo_seguimientos  enable row level security;

-- Planes: clínico; el psicólogo solo ve los suyos, el admin todos.
create policy planes_clinico on planes_intervencion
  for all to authenticated
  using (public.is_clinico() and (public.is_admin() or psicologo_id = auth.uid()))
  with check (public.is_clinico() and (public.is_admin() or psicologo_id = auth.uid()));

-- Objetivos: acceso heredado del plan padre.
create policy objetivos_clinico on objetivos_intervencion
  for all to authenticated
  using (exists (
    select 1 from planes_intervencion p
    where p.id = plan_id
      and public.is_clinico()
      and (public.is_admin() or p.psicologo_id = auth.uid())))
  with check (exists (
    select 1 from planes_intervencion p
    where p.id = plan_id
      and public.is_clinico()
      and (public.is_admin() or p.psicologo_id = auth.uid())));

-- Seguimientos: acceso heredado vía objetivo → plan.
create policy seguimientos_clinico on objetivo_seguimientos
  for all to authenticated
  using (exists (
    select 1 from objetivos_intervencion o
    join planes_intervencion p on p.id = o.plan_id
    where o.id = objetivo_id
      and public.is_clinico()
      and (public.is_admin() or p.psicologo_id = auth.uid())))
  with check (exists (
    select 1 from objetivos_intervencion o
    join planes_intervencion p on p.id = o.plan_id
    where o.id = objetivo_id
      and public.is_clinico()
      and (public.is_admin() or p.psicologo_id = auth.uid())));

-- ── Auditoría ──
do $$
declare t text;
begin
  foreach t in array array['planes_intervencion','objetivos_intervencion','objetivo_seguimientos'] loop
    execute format(
      'drop trigger if exists trg_audit on %I; '
      'create trigger trg_audit after insert or update or delete on %I '
      'for each row execute function public.fn_audit();', t, t);
  end loop;
end$$;
