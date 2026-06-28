-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 008 Portal de Padres (acceso por Código + PIN)
--   • portal_gen_codigo      : genera un código tipo LUDA-XXXX
--   • portal_generar_acceso  : staff crea/regenera el acceso de un tutor
--   • portal_login           : valida código + PIN (para el portal público)
--   Todas SECURITY DEFINER; se invocan desde el servidor con service_role.
-- ════════════════════════════════════════════════════════════

-- ── Código legible sin caracteres ambiguos (sin 0/O/1/I) ──
create or replace function public.portal_gen_codigo()
returns text language sql volatile as $$
  select 'LUDA-' || string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
           (floor(random() * 32) + 1)::int, 1), '')
  from generate_series(1, 4);
$$;

-- ── Staff genera (o regenera) el acceso de un tutor a un paciente ──
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

  -- Un solo acceso vigente por tutor+paciente: limpiamos el anterior.
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

-- ── Valida código + PIN; actualiza último acceso y devuelve el contexto ──
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

-- Estas funciones solo se invocan desde el servidor con service_role.
revoke all on function public.portal_generar_acceso(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.portal_login(text, text)              from public, anon, authenticated;
