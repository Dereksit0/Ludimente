-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 002 Row Level Security
-- ════════════════════════════════════════════════════════════

-- Helper SECURITY DEFINER: lee el rol del usuario actual SIN gatillar
-- las políticas RLS de `profiles` (evita recursión infinita).
create or replace function public.auth_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and activo);
$$;

create or replace function public.is_clinico()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','psicologo') and activo);
$$;

-- ── Habilitar RLS en TODAS las tablas ──
alter table profiles              enable row level security;
alter table pacientes             enable row level security;
alter table tutores               enable row level security;
alter table citas                 enable row level security;
alter table sesiones              enable row level security;
alter table evaluaciones          enable row level security;
alter table evaluacion_subpruebas enable row level security;
alter table documentos            enable row level security;
alter table pagos                 enable row level security;
alter table audit_log             enable row level security;
alter table portal_accesos        enable row level security;
alter table configuracion         enable row level security;

-- ─────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────
create policy profiles_select_all on profiles
  for select to authenticated using (true);

create policy profiles_update_self on profiles
  for update to authenticated using (id = auth.uid());

create policy profiles_admin_all on profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────
-- PACIENTES
--   admin: todo · psicólogo: los suyos · recepción: lectura
-- ─────────────────────────────────────────
create policy pacientes_admin_all on pacientes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy pacientes_psicologo_rw on pacientes
  for all to authenticated
  using (auth_role() = 'psicologo' and (psicologo_asignado_id = auth.uid() or created_by = auth.uid()))
  with check (auth_role() = 'psicologo');

create policy pacientes_recepcionista_read on pacientes
  for select to authenticated using (auth_role() = 'recepcionista');

create policy pacientes_recepcionista_insert on pacientes
  for insert to authenticated with check (auth_role() = 'recepcionista');

-- ─────────────────────────────────────────
-- TUTORES (siguen el acceso del paciente)
-- ─────────────────────────────────────────
create policy tutores_acceso on tutores
  for all to authenticated
  using (
    public.is_admin()
    or auth_role() = 'recepcionista'
    or exists (
      select 1 from pacientes p
      where p.id = tutores.paciente_id
        and (p.psicologo_asignado_id = auth.uid() or p.created_by = auth.uid())
    )
  )
  with check (
    public.is_admin()
    or auth_role() = 'recepcionista'
    or exists (
      select 1 from pacientes p
      where p.id = tutores.paciente_id
        and (p.psicologo_asignado_id = auth.uid() or p.created_by = auth.uid())
    )
  );

-- ─────────────────────────────────────────
-- CITAS (recepción gestiona agenda completa)
-- ─────────────────────────────────────────
create policy citas_clinico_admin on citas
  for all to authenticated
  using (public.is_admin() or psicologo_id = auth.uid())
  with check (public.is_admin() or psicologo_id = auth.uid());

create policy citas_recepcionista on citas
  for all to authenticated
  using (auth_role() = 'recepcionista')
  with check (auth_role() = 'recepcionista');

-- ─────────────────────────────────────────
-- SESIONES (notas clínicas: NUNCA recepción)
-- ─────────────────────────────────────────
create policy sesiones_no_recepcion on sesiones
  for all to authenticated
  using (
    auth_role() <> 'recepcionista'
    and (public.is_admin() or psicologo_id = auth.uid())
  )
  with check (
    auth_role() <> 'recepcionista'
    and (public.is_admin() or psicologo_id = auth.uid())
  );

-- ─────────────────────────────────────────
-- EVALUACIONES (clínicas: NUNCA recepción)
-- ─────────────────────────────────────────
create policy evaluaciones_no_recepcion on evaluaciones
  for all to authenticated
  using (
    auth_role() <> 'recepcionista'
    and (public.is_admin() or psicologo_id = auth.uid())
  )
  with check (
    auth_role() <> 'recepcionista'
    and (public.is_admin() or psicologo_id = auth.uid())
  );

create policy subpruebas_no_recepcion on evaluacion_subpruebas
  for all to authenticated
  using (
    auth_role() <> 'recepcionista'
    and exists (
      select 1 from evaluaciones e
      where e.id = evaluacion_subpruebas.evaluacion_id
        and (public.is_admin() or e.psicologo_id = auth.uid())
    )
  )
  with check (
    auth_role() <> 'recepcionista'
    and exists (
      select 1 from evaluaciones e
      where e.id = evaluacion_subpruebas.evaluacion_id
        and (public.is_admin() or e.psicologo_id = auth.uid())
    )
  );

-- ─────────────────────────────────────────
-- DOCUMENTOS
-- ─────────────────────────────────────────
create policy documentos_acceso on documentos
  for all to authenticated
  using (
    public.is_admin()
    or auth_role() = 'recepcionista'
    or exists (
      select 1 from pacientes p
      where p.id = documentos.paciente_id
        and (p.psicologo_asignado_id = auth.uid() or p.created_by = auth.uid())
    )
  )
  with check (
    public.is_admin()
    or auth_role() = 'recepcionista'
    or exists (
      select 1 from pacientes p
      where p.id = documentos.paciente_id
        and (p.psicologo_asignado_id = auth.uid() or p.created_by = auth.uid())
    )
  );

-- ─────────────────────────────────────────
-- PAGOS (admin + recepción; psicólogo lectura de los suyos)
-- ─────────────────────────────────────────
create policy pagos_admin_recepcion on pagos
  for all to authenticated
  using (public.is_admin() or auth_role() = 'recepcionista')
  with check (public.is_admin() or auth_role() = 'recepcionista');

create policy pagos_psicologo_read on pagos
  for select to authenticated
  using (
    auth_role() = 'psicologo'
    and exists (
      select 1 from pacientes p
      where p.id = pagos.paciente_id and p.psicologo_asignado_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────
-- AUDIT LOG (solo admin lee; escritura vía triggers SECURITY DEFINER)
-- ─────────────────────────────────────────
create policy audit_admin_read on audit_log
  for select to authenticated using (public.is_admin());

-- ─────────────────────────────────────────
-- PORTAL_ACCESOS (gestión solo admin/recepción desde el sistema)
-- ─────────────────────────────────────────
create policy portal_gestion on portal_accesos
  for all to authenticated
  using (public.is_admin() or auth_role() = 'recepcionista')
  with check (public.is_admin() or auth_role() = 'recepcionista');

-- ─────────────────────────────────────────
-- CONFIGURACIÓN (lectura todos; escritura solo admin)
-- ─────────────────────────────────────────
create policy config_read on configuracion
  for select to authenticated using (true);

create policy config_admin_write on configuracion
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
