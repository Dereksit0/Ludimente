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

/** Días de la semana para la planeación de terapias. */
export const DIAS_SEMANA = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
] as const;

export const DIA_SEMANA_LABEL: Record<number, string> = Object.fromEntries(
  DIAS_SEMANA.map((d) => [d.value, d.label]),
);

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
  { value: "feliz", label: "😁 Feliz" },
  { value: "contento", label: "🙂 Contento" },
  { value: "bien", label: "🙂 Bien" },
  { value: "tranquilo", label: "😌 Tranquilo" },
  { value: "neutral", label: "😐 Neutral" },
  { value: "regular", label: "😐 Regular" },
  { value: "cansado", label: "🥱 Cansado" },
  { value: "ansioso", label: "😰 Ansioso" },
  { value: "nervioso", label: "😬 Nervioso" },
  { value: "frustrado", label: "😣 Frustrado" },
  { value: "triste", label: "😢 Triste" },
  { value: "irritable", label: "😤 Irritable" },
  { value: "enojado", label: "😠 Enojado" },
  { value: "desregulado", label: "🌀 Desregulado" },
  { value: "euforico", label: "🤩 Eufórico" },
  { value: "mal", label: "🙁 Mal" },
  { value: "muy_mal", label: "😞 Muy mal" },
] as const;

export const HUMOR_LABEL: Record<string, string> = Object.fromEntries(
  HUMOR_OPCIONES.map((h) => [h.value, h.label]),
);

export const AREA_TRABAJO_LABEL: Record<string, string> = Object.fromEntries(
  AREA_TRABAJO_OPCIONES.map((a) => [a.value, a.label]),
);

// ── Tamizaje inicial (evaluación base por áreas) ──
export const TAMIZAJE_AREAS = [
  { value: "trazo", label: "Trazo / Grafomotricidad" },
  { value: "lenguaje", label: "Lenguaje" },
  { value: "lectura", label: "Lectura" },
  { value: "escritura", label: "Escritura" },
  { value: "matematicas", label: "Matemáticas" },
  { value: "atencion", label: "Atención" },
  { value: "memoria", label: "Memoria" },
  { value: "motricidad_fina", label: "Motricidad fina" },
  { value: "motricidad_gruesa", label: "Motricidad gruesa" },
  { value: "socioemocional", label: "Socioemocional" },
  { value: "autonomia", label: "Autonomía" },
] as const;

export const TAMIZAJE_AREA_LABEL: Record<string, string> = Object.fromEntries(
  TAMIZAJE_AREAS.map((a) => [a.value, a.label]),
);

export const NIVEL_TAMIZAJE_OPCIONES = [
  { value: "no_evaluado", label: "No evaluado" },
  { value: "no_logrado", label: "No logrado" },
  { value: "en_proceso", label: "En proceso" },
  { value: "logrado", label: "Logrado" },
] as const;

export const NIVEL_TAMIZAJE_LABEL: Record<string, string> = Object.fromEntries(
  NIVEL_TAMIZAJE_OPCIONES.map((n) => [n.value, n.label]),
);

/** Clases de color por nivel (heatmap de la vista comparativa). */
export const NIVEL_TAMIZAJE_CLASES: Record<string, string> = {
  no_evaluado: "bg-gray-100 text-gray-400",
  no_logrado: "bg-red-100 text-red-700",
  en_proceso: "bg-yellow-100 text-yellow-700",
  logrado: "bg-green-100 text-green-700",
};

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
  {
    value: "autorizacion_redes_sociales",
    label: "Autorización de grabación y redes sociales",
  },
  { value: "otro", label: "Otro" },
] as const;

export const TIPO_CONSENTIMIENTO_LABEL: Record<string, string> =
  Object.fromEntries(TIPO_CONSENTIMIENTO_OPCIONES.map((t) => [t.value, t.label]));

/**
 * Textos base editables por tipo de consentimiento.
 * Redactados conforme a la normativa mexicana aplicable:
 * LFPDPPP (derechos ARCO), NOM-004-SSA3-2012 del expediente clínico,
 * y la NOM-024-SSA3 para sistemas de información en salud.
 */
export const PLANTILLA_CONSENTIMIENTO: Record<string, string> = {
  consentimiento_informado: `CONSENTIMIENTO INFORMADO PARA EVALUACIÓN E INTERVENCIÓN PSICOPEDAGÓGICA

En mi calidad de padre, madre o tutor legal del menor, declaro que se me ha informado de manera clara y comprensible lo siguiente:

1. NATURALEZA DEL SERVICIO. El menor recibirá servicios de evaluación y/o intervención psicopedagógica con fines diagnósticos, terapéuticos y de seguimiento, llevados a cabo por profesionales calificados.

2. PROCEDIMIENTOS. Se me han explicado los objetivos, las técnicas, la duración aproximada y los posibles beneficios y limitaciones del proceso, así como las alternativas disponibles.

3. CARÁCTER VOLUNTARIO. Mi participación y la del menor es libre y voluntaria; puedo revocar este consentimiento en cualquier momento mediante escrito, sin que ello afecte la atención recibida hasta esa fecha.

4. CONFIDENCIALIDAD. La información generada se maneja de forma confidencial y forma parte del expediente clínico conforme a la NOM-004-SSA3-2012, resguardándose por el tiempo que marca la normativa. Solo se compartirá con terceros previa autorización por escrito o por mandato de autoridad competente.

5. PROTECCIÓN DE DATOS. El tratamiento de los datos personales se realiza conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares y al Aviso de Privacidad que me ha sido entregado.

Manifiesto que se me dio oportunidad de resolver todas mis dudas y que OTORGO MI CONSENTIMIENTO de forma informada.`,

  aviso_privacidad: `AVISO DE PRIVACIDAD

En cumplimiento de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), su Reglamento y los Lineamientos del Aviso de Privacidad, hacemos de su conocimiento lo siguiente:

1. RESPONSABLE. El consultorio es responsable del tratamiento, uso y protección de los datos personales del menor y de sus tutores.

2. DATOS RECABADOS. Datos de identificación, contacto, escolares, así como datos personales sensibles relativos al estado de salud físico, psicológico y de desarrollo del menor, necesarios para la prestación del servicio.

3. FINALIDADES. Los datos se utilizan para integrar el expediente clínico, realizar evaluaciones e intervenciones, dar seguimiento, emitir reportes, agendar citas y para fines administrativos y de facturación.

4. DERECHOS ARCO. Usted puede ejercer en todo momento sus derechos de Acceso, Rectificación, Cancelación y Oposición, así como revocar su consentimiento, mediante solicitud presentada ante el consultorio.

5. TRANSFERENCIAS. Sus datos no serán transferidos a terceros sin su consentimiento, salvo las excepciones previstas en el artículo 37 de la LFPDPPP.

Al firmar, manifiesto que he leído y comprendido el presente Aviso de Privacidad y otorgo mi consentimiento para el tratamiento de los datos personales, incluidos los sensibles, conforme a las finalidades aquí descritas.`,

  autorizacion_evaluacion: `AUTORIZACIÓN PARA LA APLICACIÓN DE EVALUACIONES

En mi calidad de padre, madre o tutor legal del menor, AUTORIZO la aplicación de las pruebas, tests e instrumentos psicopedagógicos y/o psicológicos que el equipo profesional considere pertinentes para el diagnóstico, planeación y seguimiento del menor.

Declaro que se me ha informado el propósito de cada instrumento, su carácter técnico y que los resultados serán interpretados exclusivamente por personal calificado e integrados al expediente clínico conforme a la NOM-004-SSA3-2012.

Entiendo que los resultados se me darán a conocer en una sesión de devolución y que la información se maneja de forma confidencial conforme a la LFPDPPP.`,

  autorizacion_imagenes: `AUTORIZACIÓN PARA EL USO DE IMÁGENES Y VIDEOS

En mi calidad de padre, madre o tutor legal del menor, manifiesto lo siguiente respecto a la toma de fotografías y/o videograbaciones del menor durante las sesiones:

Entiendo que dichos materiales podrán utilizarse con fines exclusivamente clínicos, de análisis del caso, supervisión profesional y seguimiento del proceso, y que en ningún caso se difundirán pública o comercialmente sin mi autorización expresa y por escrito.

El tratamiento de estas imágenes, consideradas datos personales, se realiza conforme a la LFPDPPP y al Aviso de Privacidad del consultorio. Puedo revocar esta autorización en cualquier momento mediante escrito.

Marque su decisión:  ( ) SÍ autorizo    ( ) NO autorizo`,

  autorizacion_redes_sociales: `AUTORIZACIÓN DE GRABACIÓN Y USO DE IMAGEN EN REDES SOCIALES

En mi calidad de padre, madre o tutor legal del menor, y siendo titular de la patria potestad, manifiesto lo siguiente respecto a la captación de su imagen y voz (fotografía y/o video) durante las actividades del centro y su posible difusión en redes sociales y medios digitales del consultorio (Facebook, Instagram, TikTok, página web, etc.):

1. FINALIDAD. Las imágenes y videos se utilizarán con fines de difusión, promoción y divulgación de las actividades y servicios del centro.

2. DERECHOS DE IMAGEN DEL MENOR. Reconozco que la imagen y voz del menor son datos personales y que, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y al derecho a la propia imagen, su difusión requiere mi consentimiento expreso al tratarse de una persona menor de edad.

3. ALCANCE. La autorización no implica contraprestación económica alguna y se limita a las finalidades aquí descritas; el centro se compromete a hacer un uso digno y respetuoso del material y a no cederlo a terceros con fines distintos.

4. REVOCACIÓN. Puedo revocar esta autorización en cualquier momento mediante escrito; la revocación aplicará a publicaciones futuras, sin afectar las ya difundidas cuando su retiro no sea materialmente posible.

Marque su decisión:
( ) SÍ autorizo la grabación y el uso de la imagen del menor en redes sociales y medios digitales del centro.
( ) NO autorizo. (El menor no aparecerá en publicaciones del centro.)`,

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
