-- ════════════════════════════════════════════════════════════
-- 025: Antecedentes del paciente + desborde y más opciones de humor
-- ════════════════════════════════════════════════════════════

-- ── Antecedentes terapéuticos / clínicos del paciente ──
alter table pacientes
  add column if not exists antecedentes text;

-- ── Sesiones: desborde emocional ──
alter table sesiones
  add column if not exists tuvo_desborde boolean not null default false,
  add column if not exists desborde_notas text;

-- ── Sesiones: ampliar el catálogo de humor del paciente ──
alter table sesiones drop constraint if exists sesiones_humor_paciente_check;
alter table sesiones add constraint sesiones_humor_paciente_check
  check (humor_paciente in (
    'muy_bien','bien','regular','mal','muy_mal',
    'feliz','contento','tranquilo','neutral','ansioso','nervioso',
    'irritable','enojado','triste','frustrado','cansado','desregulado','euforico'
  ));
