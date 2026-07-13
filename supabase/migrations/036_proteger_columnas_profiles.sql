-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 036 Blindar columnas sensibles de `profiles`
--   `profiles_update_self` (002) deja a cualquier usuario actualizar
--   su propia fila sin restricción de columna. Combinado con la UI de
--   Terapeutas (que no oculta el botón "Editar" en la propia tarjeta),
--   un psicólogo podía cambiar su propio `cupo_maximo`/`especialidad`,
--   y en teoría su `role`/`activo` llamando la API directo. Solo admin
--   puede tocar esas columnas; el resto (nombre, contacto, avatar,
--   color de agenda) lo sigue pudiendo editar cualquiera su propia fila.
-- ════════════════════════════════════════════════════════════

create or replace function public.fn_proteger_columnas_profiles()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.activo is distinct from old.activo
     or new.cupo_maximo is distinct from old.cupo_maximo
     or new.especialidad is distinct from old.especialidad
     or new.usuario is distinct from old.usuario
     or new.cedula_prof is distinct from old.cedula_prof then
    raise exception 'Solo un administrador puede cambiar rol, estado, cupo, especialidad, usuario o cédula.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_proteger_columnas_profiles on profiles;
create trigger trg_proteger_columnas_profiles
  before update on profiles
  for each row execute function public.fn_proteger_columnas_profiles();
