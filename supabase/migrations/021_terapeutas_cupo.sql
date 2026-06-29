-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 021 Gestión multi-terapeuta
--   Añade capacidad (cupo_maximo) a los perfiles para medir la carga
--   de pacientes por terapeuta. `especialidad` ya existe.
--   Mantiene el grant de SELECT por columnas (ver migración 013).
-- ════════════════════════════════════════════════════════════

alter table profiles
  add column if not exists cupo_maximo integer not null default 20;

-- La UI necesita leer la capacidad; se suma al grant de columnas existente.
grant select (cupo_maximo) on public.profiles to authenticated;
