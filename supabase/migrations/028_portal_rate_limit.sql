-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 028 Rate limiting del login del Portal de Padres
--   portal_login() no tenía freno: el PIN (4-6 dígitos) se podía
--   probar sin límite contra un código de acceso válido. Ahora se
--   cuentan los intentos fallidos por código y se bloquea temporalmente.
-- ════════════════════════════════════════════════════════════

alter table portal_accesos
  add column if not exists intentos_fallidos integer not null default 0,
  add column if not exists bloqueado_hasta   timestamptz;

create or replace function public.portal_login(p_codigo text, p_pin text)
returns table(acceso_id uuid, pac_id uuid, pac_nombre text, tut_nombre text)
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_row            portal_accesos%rowtype;
  v_max_intentos    constant integer := 5;
  v_bloqueo_minutos constant integer := 15;
begin
  select pa.* into v_row
  from portal_accesos pa
  where pa.codigo_acceso = upper(trim(p_codigo));

  if not found then
    return; -- código inexistente: no hay nada que penalizar
  end if;

  if v_row.bloqueado_hasta is not null and v_row.bloqueado_hasta > now() then
    raise exception 'portal_bloqueado';
  end if;

  if v_row.activo
     and (v_row.expires_at is null or v_row.expires_at > now())
     and v_row.pin_hash = crypt(p_pin, v_row.pin_hash)
  then
    update portal_accesos
       set ultimo_acceso = now(), intentos_fallidos = 0, bloqueado_hasta = null
     where id = v_row.id;

    return query
    select v_row.id, v_row.paciente_id,
           (p.nombre || ' ' || p.apellido_paterno), t.nombre_completo
    from tutores t, pacientes p
    where t.id = v_row.tutor_id and p.id = v_row.paciente_id;
    return;
  end if;

  -- PIN incorrecto (o acceso inactivo/expirado): contamos el intento fallido.
  if v_row.intentos_fallidos + 1 >= v_max_intentos then
    update portal_accesos
       set intentos_fallidos = 0,
           bloqueado_hasta = now() + (v_bloqueo_minutos || ' minutes')::interval
     where id = v_row.id;
  else
    update portal_accesos
       set intentos_fallidos = intentos_fallidos + 1
     where id = v_row.id;
  end if;

  return;
end;
$$;

revoke all on function public.portal_login(text, text) from public, anon, authenticated;
