-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 009 Fix: search_path de las funciones del portal
--   gen_salt()/crypt() viven en el esquema `extensions` en Supabase
--   cloud; las funciones del portal deben incluirlo en el search_path.
-- ════════════════════════════════════════════════════════════

create or replace function public.portal_generar_acceso(
  p_tutor_id    uuid,
  p_paciente_id uuid,
  p_pin         text
)
returns text
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_codigo text;
begin
  if p_pin is null or length(trim(p_pin)) < 4 then
    raise exception 'El PIN debe tener al menos 4 dígitos';
  end if;

  delete from portal_accesos
   where tutor_id = p_tutor_id and paciente_id = p_paciente_id;

  loop
    v_codigo := portal_gen_codigo();
    exit when not exists (
      select 1 from portal_accesos where codigo_acceso = v_codigo
    );
  end loop;

  insert into portal_accesos (tutor_id, paciente_id, codigo_acceso, pin_hash, activo)
  values (p_tutor_id, p_paciente_id, v_codigo, crypt(p_pin, gen_salt('bf')), true);

  return v_codigo;
end;
$$;

create or replace function public.portal_login(p_codigo text, p_pin text)
returns table(acceso_id uuid, pac_id uuid, pac_nombre text, tut_nombre text)
language plpgsql security definer set search_path = public, extensions as $$
begin
  return query
  update portal_accesos pa
     set ultimo_acceso = now()
    from tutores t, pacientes p
   where pa.codigo_acceso = upper(trim(p_codigo))
     and t.id = pa.tutor_id
     and p.id = pa.paciente_id
     and pa.activo = true
     and (pa.expires_at is null or pa.expires_at > now())
     and pa.pin_hash = crypt(p_pin, pa.pin_hash)
  returning pa.id, pa.paciente_id,
            (p.nombre || ' ' || p.apellido_paterno), t.nombre_completo;
end;
$$;

revoke all on function public.portal_generar_acceso(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.portal_login(text, text)              from public, anon, authenticated;
