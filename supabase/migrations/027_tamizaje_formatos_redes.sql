-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 027
--   1) Nuevo tipo de consentimiento: autorización de grabación / redes
--   2) tamizajes        : evaluación base por áreas, por paciente
--   3) formatos_llenados: formatos del módulo llenados y guardados
-- ════════════════════════════════════════════════════════════

-- ── 1. Consentimiento de redes sociales ──
alter table consentimientos drop constraint if exists consentimientos_tipo_check;
alter table consentimientos add constraint consentimientos_tipo_check
  check (tipo in (
    'consentimiento_informado','aviso_privacidad',
    'autorizacion_evaluacion','autorizacion_imagenes',
    'autorizacion_redes_sociales','otro'));

-- ── 2. Tamizaje inicial ──
create table if not exists tamizajes (
  id            uuid primary key default gen_random_uuid(),
  paciente_id   uuid not null references pacientes(id) on delete cascade,
  evaluador_id  uuid references profiles(id),
  fecha         date not null default current_date,
  areas         jsonb not null default '{}'::jsonb,
  observaciones text,
  created_by    uuid references profiles(id),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists idx_tamizaje_paciente on tamizajes(paciente_id);

drop trigger if exists trg_updated_at on tamizajes;
create trigger trg_updated_at before update on tamizajes
  for each row execute function public.set_updated_at();

alter table tamizajes enable row level security;

drop policy if exists tamizaje_lectura on tamizajes;
create policy tamizaje_lectura on tamizajes
  for select to authenticated using (true);

drop policy if exists tamizaje_gestion on tamizajes;
create policy tamizaje_gestion on tamizajes
  for all to authenticated
  using (public.is_admin() or public.is_clinico())
  with check (public.is_admin() or public.is_clinico());

-- ── 3. Formatos llenados ──
create table if not exists formatos_llenados (
  id            uuid primary key default gen_random_uuid(),
  paciente_id   uuid not null references pacientes(id) on delete cascade,
  formato_id    text not null,
  titulo        text not null,
  respuestas    jsonb not null default '{}'::jsonb,
  created_by    uuid references profiles(id),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists idx_formato_llenado_paciente on formatos_llenados(paciente_id);

drop trigger if exists trg_updated_at on formatos_llenados;
create trigger trg_updated_at before update on formatos_llenados
  for each row execute function public.set_updated_at();

alter table formatos_llenados enable row level security;

drop policy if exists formato_llenado_lectura on formatos_llenados;
create policy formato_llenado_lectura on formatos_llenados
  for select to authenticated using (true);

drop policy if exists formato_llenado_gestion on formatos_llenados;
create policy formato_llenado_gestion on formatos_llenados
  for all to authenticated
  using (public.is_admin() or public.is_clinico())
  with check (public.is_admin() or public.is_clinico());

-- ── Auditoría ──
do $$
begin
  execute 'drop trigger if exists trg_audit on tamizajes';
  execute 'create trigger trg_audit after insert or update or delete on tamizajes for each row execute function public.fn_audit()';
  execute 'drop trigger if exists trg_audit on formatos_llenados';
  execute 'create trigger trg_audit after insert or update or delete on formatos_llenados for each row execute function public.fn_audit()';
end$$;
