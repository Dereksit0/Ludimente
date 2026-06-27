// ════════════════════════════════════════════════════════════
// Catálogos de la aplicación (listas predefinidas con opción libre).
// ════════════════════════════════════════════════════════════

/** Diagnósticos frecuentes en psicopedagogía infantil (autocompletado + libre). */
export const DIAGNOSTICOS_COMUNES = [
  "TDAH - Predominio inatento",
  "TDAH - Predominio hiperactivo-impulsivo",
  "TDAH - Combinado",
  "Trastorno del Espectro Autista (TEA)",
  "Dislexia",
  "Disgrafía",
  "Discalculia",
  "Trastorno del lenguaje",
  "Trastorno del aprendizaje",
  "Discapacidad intelectual",
  "Trastorno de ansiedad",
  "Dificultades de atención",
  "Retraso madurativo",
  "Trastorno del procesamiento sensorial",
] as const;

/** Parentescos para tutores. */
export const PARENTESCOS = [
  "Madre",
  "Padre",
  "Abuela",
  "Abuelo",
  "Tía",
  "Tío",
  "Tutor/a legal",
  "Hermano/a",
  "Otro",
] as const;

/** Grados escolares. */
export const GRADOS_ESCOLARES = [
  "Maternal",
  "Preescolar 1",
  "Preescolar 2",
  "Preescolar 3",
  "1° primaria",
  "2° primaria",
  "3° primaria",
  "4° primaria",
  "5° primaria",
  "6° primaria",
  "1° secundaria",
  "2° secundaria",
  "3° secundaria",
  "Otro",
] as const;

/** Niveles de estudios de tutores. */
export const NIVELES_ESTUDIOS = [
  "Primaria",
  "Secundaria",
  "Preparatoria",
  "Licenciatura",
  "Posgrado",
  "Otro",
] as const;

// ── Etiquetas de selects con valor de BD ──
export const SEXO_OPCIONES = [
  { value: "masculino", label: "Masculino" },
  { value: "femenino", label: "Femenino" },
  { value: "otro", label: "Otro" },
] as const;

export const TURNO_OPCIONES = [
  { value: "matutino", label: "Matutino" },
  { value: "vespertino", label: "Vespertino" },
  { value: "otro", label: "Otro" },
] as const;

export const ESTATUS_PACIENTE_OPCIONES = [
  { value: "lista_espera", label: "Lista de espera" },
  { value: "activo", label: "Activo" },
  { value: "en_evaluacion", label: "En evaluación" },
  { value: "en_intervencion", label: "En intervención" },
  { value: "seguimiento", label: "Seguimiento" },
  { value: "alta", label: "Alta" },
  { value: "inactivo", label: "Inactivo" },
] as const;
