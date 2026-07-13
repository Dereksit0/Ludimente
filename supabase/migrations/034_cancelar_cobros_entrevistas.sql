-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 034 Limpieza: cancelar cobros pendientes de entrevistas
--   Antes de 030/033, `generar_cobro_cita` cobraba cualquier tipo de
--   cita, incluidas las entrevistas (evaluación inicial, entrevista
--   con padres, entrevista para adultos), que no se cobran. Esto
--   cancela los cobros que ya quedaron pendientes por ese motivo
--   (p. ej. "Entrevista con padres" de $150). No se tocan cobros ya
--   marcados como pagados: esos requieren revisión manual del equipo
--   administrativo si corresponde un reembolso.
-- ════════════════════════════════════════════════════════════

update pagos p
set estatus = 'cancelado'
from citas c
where p.cita_id = c.id
  and p.estatus = 'pendiente'
  and c.tipo in ('evaluacion_inicial', 'entrevista_adultos', 'entrevista_padres');
