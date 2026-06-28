-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 013 Restringir PII del equipo (#13)
--   Cualquier autenticado podía leer email/teléfono/cédula/usuario de
--   todo el equipo (profiles_select_all). Limitamos las columnas legibles
--   por el rol `authenticated` a las que la UI realmente necesita.
--   El rol service_role (server actions de admin) conserva acceso total.
-- ════════════════════════════════════════════════════════════

revoke select on public.profiles from authenticated;

grant select
  (id, full_name, avatar_url, color_agenda, role, especialidad, activo,
   created_at, updated_at)
  on public.profiles
  to authenticated;
