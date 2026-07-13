-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 032 Tarifas configurables por tipo de cita
--   Antes había un único `precio_sesion_default` aplicado a
--   cualquier cita. Ahora cada tipo de cita tiene su propio precio,
--   editable por la administradora desde Configuración.
--   Las entrevistas (evaluación inicial, entrevista con padres,
--   entrevista para adultos) se siembran en $0: no se cobran, solo
--   sirven para conocer al paciente y definir su plan. Las demás
--   (terapias, talleres, etc.) heredan el precio que ya estaba
--   configurado como tarifa general.
-- ════════════════════════════════════════════════════════════

-- `id` uuid (y no `tipo`) es la llave primaria porque `fn_audit()` espera
-- un campo `id` en toda tabla auditada; `tipo` queda unique en su lugar.
create table if not exists precios_citas (
  id         uuid primary key default gen_random_uuid(),
  tipo       text not null unique check (tipo in (
               'evaluacion_inicial','entrevista_adultos','sesion_intervencion',
               'terapia_lenguaje','terapia_ocupacional','terapia_conductual',
               'terapia_psicologica_adultos','terapia_familiar',
               'valoracion_neuropsicologica','devolucion_resultados','seguimiento',
               'entrevista_padres','asesoria_escolar','taller','urgencia','otro')),
  precio     numeric(10,2) not null default 0 check (precio >= 0),
  updated_at timestamptz default now()
);

drop trigger if exists trg_updated_at on precios_citas;
create trigger trg_updated_at before update on precios_citas
  for each row execute function public.set_updated_at();

alter table precios_citas enable row level security;

-- Lectura: cualquier persona autenticada (se usa al agendar y en reportes).
create policy precios_citas_read on precios_citas
  for select to authenticated using (true);

-- Escritura: solo admin (es tarifa/financiero, igual que `pagos` y `paquetes`).
create policy precios_citas_admin_write on precios_citas
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

do $$
begin
  execute 'drop trigger if exists trg_audit on precios_citas';
  execute 'create trigger trg_audit after insert or update or delete on precios_citas '
       || 'for each row execute function public.fn_audit()';
end$$;

-- Siembra inicial: entrevistas gratis, el resto hereda la tarifa general vigente.
insert into precios_citas (tipo, precio)
select
  v.tipo,
  case
    when v.tipo in ('evaluacion_inicial', 'entrevista_adultos', 'entrevista_padres') then 0
    else coalesce((select precio_sesion_default from configuracion limit 1), 500)
  end
from (values
  ('evaluacion_inicial'), ('entrevista_adultos'), ('sesion_intervencion'),
  ('terapia_lenguaje'), ('terapia_ocupacional'), ('terapia_conductual'),
  ('terapia_psicologica_adultos'), ('terapia_familiar'),
  ('valoracion_neuropsicologica'), ('devolucion_resultados'), ('seguimiento'),
  ('entrevista_padres'), ('asesoria_escolar'), ('taller'), ('urgencia'), ('otro')
) as v(tipo)
on conflict (tipo) do nothing;
