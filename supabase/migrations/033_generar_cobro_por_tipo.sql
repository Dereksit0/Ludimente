-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 033 El cobro automático usa la tarifa por tipo de cita
--   Sustituye el precio único (`precio_sesion_default`) por la
--   tarifa configurada en `precios_citas` para el tipo de esa cita.
--   Si el tipo no tiene tarifa registrada, cae al precio general
--   como respaldo. Con precio 0 (p. ej. cualquier entrevista) no
--   se genera cobro.
-- ════════════════════════════════════════════════════════════

create or replace function public.generar_cobro_cita(
  p_cita_id     uuid,
  p_paciente_id uuid,
  p_concepto    text
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_precio numeric;
  v_tipo   text;
begin
  -- Solo admin o el terapeuta dueño de la cita.
  if not (
    public.is_admin()
    or exists (
      select 1 from citas c
      where c.id = p_cita_id and c.psicologo_id = auth.uid()
    )
  ) then
    raise exception 'No autorizado para generar el cobro de esta cita';
  end if;

  -- No duplicar el cobro de la misma cita.
  if exists (select 1 from pagos where cita_id = p_cita_id) then
    return;
  end if;

  select tipo into v_tipo from citas where id = p_cita_id;

  select precio into v_precio from precios_citas where tipo = v_tipo;
  if v_precio is null then
    -- Tipo sin tarifa registrada: usar el precio general como respaldo.
    select precio_sesion_default into v_precio from configuracion limit 1;
  end if;

  if coalesce(v_precio, 0) <= 0 then
    return; -- gratis (p. ej. cualquier entrevista) o sin precio configurado
  end if;

  insert into pagos (paciente_id, cita_id, concepto, monto, metodo_pago, estatus)
  values (p_paciente_id, p_cita_id, p_concepto, v_precio, 'efectivo', 'pendiente');
end;
$$;

revoke all on function public.generar_cobro_cita(uuid, uuid, text) from public, anon;
grant execute on function public.generar_cobro_cita(uuid, uuid, text) to authenticated;
