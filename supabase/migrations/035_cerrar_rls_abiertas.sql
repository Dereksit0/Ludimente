-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 035 Cerrar políticas RLS demasiado abiertas
--   Varias tablas quedaron con `using (true)` o `for all using (true)`
--   desde su alta inicial, sin volver a alinearse con el patrón que
--   el resto del sistema sí sigue ("recepción no ve datos clínicos",
--   "solo admin/dueño puede borrar algo de valor").
-- ════════════════════════════════════════════════════════════

-- ── Tamizajes: son datos clínicos, no debe leerlos recepción ──
drop policy if exists tamizaje_lectura on tamizajes;
create policy tamizaje_lectura on tamizajes
  for select to authenticated using (public.is_clinico());

-- ── Formatos llenados: mismo criterio de lectura clínica ──
drop policy if exists formato_llenado_lectura on formatos_llenados;
create policy formato_llenado_lectura on formatos_llenados
  for select to authenticated using (public.is_clinico());

-- Gestión: cualquier clínico puede crear (llenar un formato nuevo),
-- pero solo admin o quien lo creó puede editar/borrar uno existente.
drop policy if exists formato_llenado_gestion on formatos_llenados;
create policy formato_llenado_creacion on formatos_llenados
  for insert to authenticated with check (public.is_clinico());
create policy formato_llenado_actualizacion on formatos_llenados
  for update to authenticated
  using (public.is_admin() or created_by = auth.uid())
  with check (public.is_admin() or created_by = auth.uid());
create policy formato_llenado_borrado on formatos_llenados
  for delete to authenticated
  using (public.is_admin() or created_by = auth.uid());

-- ── Inventario: lectura sigue abierta a todo el staff (es operativo),
--    pero borrar (irreversible) queda solo para admin/clínico ──
drop policy if exists inventario_staff on inventario_items;
create policy inventario_lectura on inventario_items
  for select to authenticated using (true);
create policy inventario_creacion on inventario_items
  for insert to authenticated with check (true);
create policy inventario_actualizacion on inventario_items
  for update to authenticated using (true) with check (true);
create policy inventario_borrado on inventario_items
  for delete to authenticated using (public.is_admin() or public.is_clinico());

-- ── Biblioteca de recursos: mismo criterio — cualquiera comparte,
--    solo admin/clínico o el autor pueden borrar ──
drop policy if exists recursos_staff on recursos;
create policy recursos_lectura on recursos
  for select to authenticated using (true);
create policy recursos_creacion on recursos
  for insert to authenticated with check (true);
create policy recursos_actualizacion on recursos
  for update to authenticated using (true) with check (true);
create policy recursos_borrado on recursos
  for delete to authenticated
  using (public.is_admin() or public.is_clinico() or created_by = auth.uid());

-- Storage del bucket "recursos": el borrado de archivos sigue la misma regla.
drop policy if exists recursos_delete on storage.objects;
create policy recursos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'recursos'
    and (public.is_admin() or public.is_clinico() or owner = auth.uid())
  );

-- ── Auditoría: tablas sensibles que hoy no dejan rastro ──
alter table configuracion enable row level security;

do $$
begin
  execute 'drop trigger if exists trg_audit on profiles';
  execute 'create trigger trg_audit after insert or update or delete on profiles '
       || 'for each row execute function public.fn_audit()';
  execute 'drop trigger if exists trg_audit on paquetes';
  execute 'create trigger trg_audit after insert or update or delete on paquetes '
       || 'for each row execute function public.fn_audit()';
  execute 'drop trigger if exists trg_audit on configuracion';
  execute 'create trigger trg_audit after insert or update or delete on configuracion '
       || 'for each row execute function public.fn_audit()';
end$$;
