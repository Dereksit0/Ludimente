-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 029 Ampliar catálogo de tipos de cita
--   Se agregan tipos para psicología de adultos, terapias
--   específicas y otros servicios del consultorio. El valor
--   'sesion_intervencion' se conserva (ahora se muestra como
--   "Terapia" en la interfaz) para no romper citas existentes.
-- ════════════════════════════════════════════════════════════

alter table citas drop constraint if exists citas_tipo_check;
alter table citas add constraint citas_tipo_check
  check (tipo in (
    'evaluacion_inicial',
    'entrevista_adultos',
    'sesion_intervencion',
    'terapia_lenguaje',
    'terapia_ocupacional',
    'terapia_conductual',
    'terapia_psicologica_adultos',
    'terapia_familiar',
    'valoracion_neuropsicologica',
    'devolucion_resultados',
    'seguimiento',
    'entrevista_padres',
    'asesoria_escolar',
    'taller',
    'urgencia',
    'otro'
  ));
