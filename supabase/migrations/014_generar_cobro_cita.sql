-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 014 Generar cobro al completar una cita
--   `pagos` es solo-admin (010). Pero al cerrar una cita, el equipo
--   clínico debe poder generar el cobro pendiente automáticamente.
--   Lo hacemos con una función SECURITY DEFINER: el cobro lo crea el
--   sistema; el terapeuta sigue SIN poder leer/gestionar pagos.
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

  select precio_sesion_default into v_precio from configuracion limit 1;
  if coalesce(v_precio, 0) <= 0 then
    return; -- sin precio configurado, no se genera cobro
  end if;

  insert into pagos (paciente_id, cita_id, concepto, monto, metodo_pago, estatus)
  values (p_paciente_id, p_cita_id, p_concepto, v_precio, 'efectivo', 'pendiente');
end;
$$;

revoke all on function public.generar_cobro_cita(uuid, uuid, text) from public, anon;
grant execute on function public.generar_cobro_cita(uuid, uuid, text) to authenticated;
