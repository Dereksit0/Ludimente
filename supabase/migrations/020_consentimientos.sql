-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 020 Consentimientos y firma digital
--   • consentimientos : documentos de consentimiento por paciente,
--     con firma capturada (PNG base64) del tutor.
--   Administrativo → gestiona admin/recepción; clínico solo lectura.
-- ════════════════════════════════════════════════════════════

create table if not exists consentimientos (
  id                  uuid primary key default gen_random_uuid(),
  paciente_id         uuid not null references pacientes(id) on delete cascade,
  tipo                text not null default 'otro' check (tipo in (
                        'consentimiento_informado','aviso_privacidad',
                        'autorizacion_evaluacion','autorizacion_imagenes','otro')),
  titulo              text not null,
  contenido           text,
  firmado             boolean not null default false,
  firmante_nombre     text,
  firmante_parentesco text,
  firma_data          text,
  firmado_at          timestamptz,
  created_by          uuid references profiles(id),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
create index if not exists idx_consent_paciente on consentimientos(paciente_id);

drop trigger if exists trg_updated_at on consentimientos;
create trigger trg_updated_at before update on consentimientos
  for each row execute function public.set_updated_at();

alter table consentimientos enable row level security;

-- Gestión: admin y recepción.
create policy consent_gestion on consentimientos
  for all to authenticated
  using (public.is_admin() or public.auth_role() = 'recepcionista')
  with check (public.is_admin() or public.auth_role() = 'recepcionista');

-- Lectura adicional para clínicos.
create policy consent_clinico_read on consentimientos
  for select to authenticated using (public.is_clinico());

do $$
begin
  execute 'drop trigger if exists trg_audit on consentimientos';
  execute 'create trigger trg_audit after insert or update or delete on consentimientos '
       || 'for each row execute function public.fn_audit()';
end$$;
