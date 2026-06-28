-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 010 Pagos visibles solo para admin
--   Requerimiento: solo la dirección (admin) ve lo relacionado con pagos.
--   El portal de padres lee pagos vía service_role (no afectado por RLS).
-- ════════════════════════════════════════════════════════════

drop policy if exists pagos_admin_recepcion on pagos;
drop policy if exists pagos_psicologo_read on pagos;

create policy pagos_admin_only on pagos
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
