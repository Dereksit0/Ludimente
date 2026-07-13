-- ════════════════════════════════════════════════════════════
-- LUDIMENTE — 031 Decisión (acepto / no acepto) en consentimientos
--   Algunos consentimientos (uso de imágenes, redes sociales)
--   piden al tutor marcar una decisión explícita, no solo firmar.
--   `requiere_decision` marca si ese documento la necesita;
--   `decision` guarda la elección capturada al firmar.
-- ════════════════════════════════════════════════════════════

alter table consentimientos
  add column if not exists requiere_decision boolean not null default false,
  add column if not exists decision text
    check (decision in ('acepta', 'no_acepta'));
