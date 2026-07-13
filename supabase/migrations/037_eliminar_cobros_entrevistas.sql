-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 037 Quitar (no solo cancelar) los cobros de entrevistas
--   `pagos.monto` exige > 0, así que un cobro de "$0" no es
--   representable como fila. Como la entrevista SÍ se llevó a cabo
--   (la cita sigue en estatus 'completada', eso no se toca aquí),
--   lo correcto es que simplemente no exista ningún cobro asociado
--   — igual que ya pasa para las entrevistas nuevas desde 033.
--   Esto completa la limpieza de 034 (que solo las había marcado
--   'cancelado', dejando un registro confuso en Pagos/Cobranza).
-- ════════════════════════════════════════════════════════════

delete from pagos p
using citas c
where p.cita_id = c.id
  and p.estatus = 'cancelado'
  and c.tipo in ('evaluacion_inicial', 'entrevista_adultos', 'entrevista_padres');
