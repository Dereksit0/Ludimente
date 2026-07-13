-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 030 La evaluación/entrevista inicial no se cobra
--   `generar_cobro_cita` (014) generaba un cobro genérico al
--   completar CUALQUIER cita, incluida la evaluación inicial.
--   Esa primera cita es gratuita: sirve para conocer al paciente
--   y definir qué plan necesita, así que no debe facturarse.
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

  -- La evaluación inicial es gratuita: no se genera cobro.
  if v_tipo = 'evaluacion_inicial' then
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
