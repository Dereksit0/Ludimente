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

// ── Citas ──
export const TIPO_CITA_OPCIONES = [
  { value: "evaluacion_inicial", label: "Evaluación inicial" },
  { value: "sesion_intervencion", label: "Sesión de intervención" },
  { value: "devolucion_resultados", label: "Devolución de resultados" },
  { value: "seguimiento", label: "Seguimiento" },
  { value: "entrevista_padres", label: "Entrevista con padres" },
  { value: "taller", label: "Taller" },
  { value: "otro", label: "Otro" },
] as const;

export const MODALIDAD_OPCIONES = [
  { value: "presencial", label: "Presencial" },
  { value: "videollamada", label: "Videollamada" },
] as const;

export const ESTATUS_CITA_OPCIONES = [
  { value: "programada", label: "Programada" },
  { value: "confirmada", label: "Confirmada" },
  { value: "completada", label: "Completada" },
  { value: "cancelada", label: "Cancelada" },
  { value: "no_asistio", label: "No asistió" },
  { value: "reagendada", label: "Reagendada" },
] as const;

/** Duraciones de cita en minutos. */
export const DURACION_OPCIONES = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 50, label: "50 min" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1 hora 30 min" },
] as const;

// ── Pagos ──
export const METODO_PAGO_OPCIONES = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta_debito", label: "Tarjeta de débito" },
  { value: "tarjeta_credito", label: "Tarjeta de crédito" },
  { value: "otro", label: "Otro" },
] as const;

export const ESTATUS_PAGO_OPCIONES = [
  { value: "pendiente", label: "Pendiente" },
  { value: "pagado", label: "Pagado" },
  { value: "cancelado", label: "Cancelado" },
  { value: "reembolsado", label: "Reembolsado" },
] as const;

/** Conceptos de pago frecuentes (autocompletado + libre). */
export const CONCEPTOS_PAGO = [
  "Evaluación inicial",
  "Sesión de intervención",
  "Seguimiento",
  "Devolución de resultados",
  "Entrevista con padres",
  "Taller",
  "Curso de verano",
] as const;

// ── Documentos ──
export const TIPO_DOCUMENTO_OPCIONES = [
  { value: "reporte_evaluacion", label: "Reporte de evaluación" },
  { value: "nota_sesion", label: "Nota de sesión" },
  { value: "consentimiento_informado", label: "Consentimiento informado" },
  { value: "carta_referencia", label: "Carta de referencia" },
  { value: "estudio_medico", label: "Estudio médico" },
  { value: "credencial", label: "Credencial / identificación" },
  { value: "otro", label: "Otro" },
] as const;

export const TIPO_DOCUMENTO_LABEL: Record<string, string> = Object.fromEntries(
  TIPO_DOCUMENTO_OPCIONES.map((d) => [d.value, d.label]),
);

// ── Sesiones (notas clínicas) ──
export const AREA_TRABAJO_OPCIONES = [
  { value: "lectura", label: "Lectura" },
  { value: "escritura", label: "Escritura" },
  { value: "matematicas", label: "Matemáticas" },
  { value: "atencion", label: "Atención" },
  { value: "memoria", label: "Memoria" },
  { value: "lenguaje", label: "Lenguaje" },
  { value: "socio_emocional", label: "Socioemocional" },
  { value: "motor", label: "Motor" },
  { value: "otro", label: "Otro" },
] as const;

export const HUMOR_OPCIONES = [
  { value: "muy_bien", label: "😄 Muy bien" },
  { value: "bien", label: "🙂 Bien" },
  { value: "regular", label: "😐 Regular" },
  { value: "mal", label: "🙁 Mal" },
  { value: "muy_mal", label: "😞 Muy mal" },
] as const;

export const AREA_TRABAJO_LABEL: Record<string, string> = Object.fromEntries(
  AREA_TRABAJO_OPCIONES.map((a) => [a.value, a.label]),
);

// ── Evaluaciones ──
export const TIPO_PRUEBA_OPCIONES = [
  { value: "WISC-V", label: "WISC-V (Inteligencia 6-16)" },
  { value: "WPPSI-IV", label: "WPPSI-IV (Inteligencia 2-7)" },
  { value: "BENDER-II", label: "Bender-II (Visomotor)" },
  { value: "PROLEC-R", label: "PROLEC-R (Lectura)" },
  { value: "PROESC", label: "PROESC (Escritura)" },
  { value: "TALE", label: "TALE (Lectura/Escritura)" },
  { value: "ENFEN", label: "ENFEN (Funciones ejecutivas)" },
  { value: "CONNERS-3", label: "Conners-3 (TDAH)" },
  { value: "BASC-3", label: "BASC-3 (Conducta)" },
  { value: "VINELAND-3", label: "Vineland-3 (Conducta adaptativa)" },
  { value: "BAYLEY-4", label: "Bayley-4 (Desarrollo)" },
  { value: "BEERY-VMI", label: "Beery-VMI (Visomotor)" },
  { value: "STROOP", label: "Stroop (Atención)" },
  { value: "TOUR", label: "Torre (Planificación)" },
  { value: "OTRO", label: "Otro" },
] as const;

export const ESTATUS_EVALUACION_OPCIONES = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_proceso", label: "En proceso" },
  { value: "calificada", label: "Calificada" },
  { value: "entregada", label: "Entregada" },
  { value: "archivada", label: "Archivada" },
] as const;

export const ESTATUS_EVALUACION_LABEL: Record<string, string> =
  Object.fromEntries(ESTATUS_EVALUACION_OPCIONES.map((e) => [e.value, e.label]));

// ── Biblioteca de recursos ──
export const CATEGORIA_RECURSO_OPCIONES = [
  { value: "actividad", label: "Actividad" },
  { value: "lectura", label: "Lectura" },
  { value: "juego", label: "Juego" },
  { value: "video", label: "Video" },
  { value: "documento", label: "Documento" },
  { value: "enlace", label: "Enlace" },
  { value: "ejercicio", label: "Ejercicio" },
] as const;

export const CATEGORIA_RECURSO_LABEL: Record<string, string> =
  Object.fromEntries(CATEGORIA_RECURSO_OPCIONES.map((c) => [c.value, c.label]));

// ── Inventario ──
export const CATEGORIA_INVENTARIO_OPCIONES = [
  { value: "material", label: "Material didáctico" },
  { value: "test", label: "Test / prueba" },
  { value: "juego", label: "Juego" },
  { value: "libro", label: "Libro" },
  { value: "mobiliario", label: "Mobiliario" },
  { value: "otro", label: "Otro" },
] as const;

export const CATEGORIA_INVENTARIO_LABEL: Record<string, string> =
  Object.fromEntries(CATEGORIA_INVENTARIO_OPCIONES.map((c) => [c.value, c.label]));

export const ESTADO_INVENTARIO_OPCIONES = [
  { value: "disponible", label: "Disponible" },
  { value: "prestado", label: "Prestado" },
  { value: "agotado", label: "Agotado" },
  { value: "mantenimiento", label: "Mantenimiento" },
] as const;

export const ESTADO_INVENTARIO_CLASES: Record<string, string> = {
  disponible: "bg-green-50 text-green-700",
  prestado: "bg-yellow-50 text-yellow-700",
  agotado: "bg-red-50 text-red-600",
  mantenimiento: "bg-blue-50 text-blue-700",
};

export const ESTADO_INVENTARIO_LABEL: Record<string, string> =
  Object.fromEntries(ESTADO_INVENTARIO_OPCIONES.map((e) => [e.value, e.label]));

// ── Consentimientos ──
export const TIPO_CONSENTIMIENTO_OPCIONES = [
  { value: "consentimiento_informado", label: "Consentimiento informado" },
  { value: "aviso_privacidad", label: "Aviso de privacidad" },
  { value: "autorizacion_evaluacion", label: "Autorización de evaluación" },
  { value: "autorizacion_imagenes", label: "Autorización de uso de imágenes" },
  { value: "otro", label: "Otro" },
] as const;

export const TIPO_CONSENTIMIENTO_LABEL: Record<string, string> =
  Object.fromEntries(TIPO_CONSENTIMIENTO_OPCIONES.map((t) => [t.value, t.label]));

/** Textos base editables por tipo de consentimiento. */
export const PLANTILLA_CONSENTIMIENTO: Record<string, string> = {
  consentimiento_informado:
    "Autorizo que mi hijo(a) reciba los servicios de evaluación e intervención psicopedagógica ofrecidos por el consultorio. Se me ha explicado el propósito, los procedimientos y la confidencialidad del proceso, y he tenido oportunidad de resolver mis dudas.",
  aviso_privacidad:
    "Manifiesto que se me ha dado a conocer el aviso de privacidad y autorizo el tratamiento de los datos personales de mi hijo(a) para los fines clínicos y administrativos del consultorio, conforme a la ley aplicable.",
  autorizacion_evaluacion:
    "Autorizo la aplicación de las pruebas y evaluaciones psicopedagógicas que el equipo considere pertinentes para el diagnóstico y seguimiento de mi hijo(a).",
  autorizacion_imagenes:
    "Autorizo la toma de fotografías o videos de mi hijo(a) durante las sesiones, con fines exclusivamente clínicos y de seguimiento, comprometiéndose el consultorio a no difundirlos públicamente sin mi consentimiento.",
  otro: "",
};

// ── Gastos ──
export const CATEGORIA_GASTO_OPCIONES = [
  { value: "renta", label: "Renta" },
  { value: "servicios", label: "Servicios (luz, agua, internet)" },
  { value: "nomina", label: "Nómina" },
  { value: "material", label: "Material didáctico" },
  { value: "equipo", label: "Equipo / mobiliario" },
  { value: "marketing", label: "Marketing / publicidad" },
  { value: "impuestos", label: "Impuestos" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "otro", label: "Otro" },
] as const;

export const CATEGORIA_GASTO_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIA_GASTO_OPCIONES.map((c) => [c.value, c.label]),
);

// ── Plan de intervención ──
export const ESTATUS_PLAN_OPCIONES = [
  { value: "activo", label: "Activo" },
  { value: "pausado", label: "Pausado" },
  { value: "completado", label: "Completado" },
  { value: "cancelado", label: "Cancelado" },
] as const;

export const AREA_OBJETIVO_OPCIONES = [
  { value: "lenguaje", label: "Lenguaje" },
  { value: "aprendizaje", label: "Aprendizaje" },
  { value: "conducta", label: "Conducta" },
  { value: "motriz", label: "Motriz" },
  { value: "socioemocional", label: "Socioemocional" },
  { value: "atencion", label: "Atención" },
  { value: "autonomia", label: "Autonomía" },
  { value: "otro", label: "Otro" },
] as const;

export const PRIORIDAD_OBJETIVO_OPCIONES = [
  { value: "alta", label: "Alta" },
  { value: "media", label: "Media" },
  { value: "baja", label: "Baja" },
] as const;

export const ESTATUS_OBJETIVO_OPCIONES = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_progreso", label: "En progreso" },
  { value: "logrado", label: "Logrado" },
  { value: "no_logrado", label: "No logrado" },
] as const;

/** Fortalezas y áreas de oportunidad sugeridas. */
export const FORTALEZAS_SUGERIDAS = [
  "Vocabulario",
  "Memoria visual",
  "Memoria auditiva",
  "Razonamiento perceptual",
  "Atención sostenida",
  "Creatividad",
  "Habilidades sociales",
  "Motricidad fina",
] as const;
