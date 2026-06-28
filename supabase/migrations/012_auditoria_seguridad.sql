-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 012 Endurecimiento de seguridad e integridad
--   #1 Storage de documentos acotado por paciente
--   #6 documentos: quitar acceso de recepción a datos clínicos
--   #3 Auditoría extendida (citas, pagos, evaluaciones, documentos) + RPC de vista
--   #8 numero_sesion con advisory lock (evita colisión concurrente)
--   #9 pagos: descuento no mayor al monto
--   #18 search_path fijo en crear_paciente_con_tutores
--   #7 soft-delete en sesiones y evaluaciones
-- ════════════════════════════════════════════════════════════

-- ── #9 Descuento válido ──
alter table pagos drop constraint if exists pagos_descuento_valido;
alter table pagos
  add constraint pagos_descuento_valido check (descuento >= 0 and descuento <= monto);

-- ── #18 search_path fijo ──
alter function public.crear_paciente_con_tutores(jsonb, jsonb)
  set search_path = public;

-- ── #7 Soft-delete ──
alter table sesiones     add column if not exists deleted_at timestamptz;
alter table evaluaciones add column if not exists deleted_at timestamptz;

-- ── #8 numero_sesion con advisory lock por paciente ──
create or replace function public.set_numero_sesion()
returns trigger language plpgsql as $$
begin
  if new.numero_sesion is null or new.numero_sesion = 0 then
    perform pg_advisory_xact_lock(hashtext('sesion-' || new.paciente_id::text));
    select coalesce(max(numero_sesion), 0) + 1
      into new.numero_sesion
      from sesiones
     where paciente_id = new.paciente_id;
  end if;
  return new;
end;
$$;

-- ── #6 documentos (tabla): solo admin o terapeuta dueño del paciente ──
drop policy if exists documentos_acceso on documentos;
create policy documentos_acceso on documentos
  for all to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from pacientes p
      where p.id = documentos.paciente_id
        and (p.psicologo_asignado_id = auth.uid() or p.created_by = auth.uid())
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from pacientes p
      where p.id = documentos.paciente_id
        and (p.psicologo_asignado_id = auth.uid() or p.created_by = auth.uid())
    )
  );

-- ── #1 Storage de documentos acotado por paciente ──
--   La ruta es '<paciente_id>/<archivo>'; validamos contra la tabla pacientes.
do $$
begin
  drop policy if exists "equipo lee documentos" on storage.objects;
  drop policy if exists "equipo sube documentos" on storage.objects;
  drop policy if exists "equipo borra documentos" on storage.objects;
  drop policy if exists "equipo actualiza documentos" on storage.objects;
end$$;

create policy "documentos por paciente - select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documentos'
    and exists (
      select 1 from public.pacientes p
      where p.id::text = (storage.foldername(name))[1]
        and (public.is_admin() or p.psicologo_asignado_id = auth.uid() or p.created_by = auth.uid())
    )
  );

create policy "documentos por paciente - insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documentos'
    and exists (
      select 1 from public.pacientes p
      where p.id::text = (storage.foldername(name))[1]
        and (public.is_admin() or p.psicologo_asignado_id = auth.uid() or p.created_by = auth.uid())
    )
  );

create policy "documentos por paciente - update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'documentos'
    and exists (
      select 1 from public.pacientes p
      where p.id::text = (storage.foldername(name))[1]
        and (public.is_admin() or p.psicologo_asignado_id = auth.uid() or p.created_by = auth.uid())
    )
  );

create policy "documentos por paciente - delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documentos'
    and exists (
      select 1 from public.pacientes p
      where p.id::text = (storage.foldername(name))[1]
        and (public.is_admin() or p.psicologo_asignado_id = auth.uid() or p.created_by = auth.uid())
    )
  );

-- ── #3 Auditoría extendida ──
do $$
declare t text;
begin
  foreach t in array array['citas','pagos','evaluaciones','documentos'] loop
    execute format(
      'drop trigger if exists trg_audit on %I; '
      'create trigger trg_audit after insert or update or delete on %I '
      'for each row execute function public.fn_audit();', t, t);
  end loop;
end$$;

-- ── #3 Registro de acceso (VIEW) a un expediente ──
create or replace function public.registrar_vista_expediente(p_paciente_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into audit_log (tabla, registro_id, accion, usuario_id)
  values ('pacientes', p_paciente_id, 'VIEW', auth.uid());
end;
$$;
