import { TIPO_PRUEBA_OPCIONES } from "@/lib/catalogos";

// ════════════════════════════════════════════════════════════
// Formatos de pruebas imprimibles (hojas en blanco para usar a mano).
// Modelo de datos estructurado → se renderiza a HTML membretado.
// ════════════════════════════════════════════════════════════

export type CampoFormato =
  | { tipo: "texto"; label: string; ancho?: "medio" | "completo" }
  | { tipo: "lineas"; label?: string; n: number }
  | { tipo: "checklist"; opciones: string[]; columnas?: number }
  | { tipo: "escala"; filas: string[]; niveles: string[] }
  | { tipo: "tabla"; columnas: string[]; filas: number }
  | { tipo: "parrafo"; texto: string };

export interface SeccionFormato {
  titulo: string;
  campos: CampoFormato[];
}

export interface Formato {
  id: string;
  titulo: string;
  categoria: "Entrevista" | "Sensorial" | "Evaluación" | "Instrumento";
  descripcion: string;
  instrucciones?: string;
  secciones: SeccionFormato[];
}

/** Encabezado de datos del paciente que comparten todos los formatos. */
const DATOS_PACIENTE: SeccionFormato = {
  titulo: "Datos del paciente",
  campos: [
    { tipo: "texto", label: "Nombre completo", ancho: "completo" },
    { tipo: "texto", label: "Fecha de nacimiento" },
    { tipo: "texto", label: "Edad" },
    { tipo: "texto", label: "Sexo" },
    { tipo: "texto", label: "Escuela" },
    { tipo: "texto", label: "Grado escolar" },
    { tipo: "texto", label: "Fecha de aplicación" },
    { tipo: "texto", label: "Aplicador(a)" },
  ],
};

// ── 1. Entrevista inicial (anamnesis) ──
const ENTREVISTA_INICIAL: Formato = {
  id: "entrevista-inicial",
  titulo: "Entrevista inicial (Anamnesis)",
  categoria: "Entrevista",
  descripcion:
    "Historia clínica y de desarrollo que se llena en la primera cita con los padres o tutores.",
  secciones: [
    DATOS_PACIENTE,
    {
      titulo: "Datos de los padres / tutores",
      campos: [
        { tipo: "texto", label: "Nombre de la madre" },
        { tipo: "texto", label: "Ocupación / escolaridad" },
        { tipo: "texto", label: "Nombre del padre" },
        { tipo: "texto", label: "Ocupación / escolaridad" },
        { tipo: "texto", label: "Teléfono de contacto" },
        { tipo: "texto", label: "Con quién vive el menor" },
      ],
    },
    {
      titulo: "Motivo de consulta",
      campos: [
        { tipo: "lineas", label: "¿Qué los trae a consulta? ¿Quién lo refiere?", n: 4 },
      ],
    },
    {
      titulo: "Antecedentes del embarazo y parto",
      campos: [
        { tipo: "texto", label: "Embarazo planeado / deseado" },
        { tipo: "texto", label: "Complicaciones en el embarazo" },
        { tipo: "texto", label: "Tipo de parto" },
        { tipo: "texto", label: "Semanas de gestación / peso al nacer" },
        { tipo: "lineas", label: "Observaciones perinatales", n: 2 },
      ],
    },
    {
      titulo: "Desarrollo psicomotor",
      campos: [
        { tipo: "texto", label: "Sostuvo la cabeza (edad)" },
        { tipo: "texto", label: "Se sentó (edad)" },
        { tipo: "texto", label: "Gateó (edad)" },
        { tipo: "texto", label: "Caminó (edad)" },
        { tipo: "texto", label: "Primeras palabras (edad)" },
        { tipo: "texto", label: "Control de esfínteres (edad)" },
      ],
    },
    {
      titulo: "Historia médica",
      campos: [
        { tipo: "texto", label: "Enfermedades importantes" },
        { tipo: "texto", label: "Hospitalizaciones / cirugías" },
        { tipo: "texto", label: "Alergias" },
        { tipo: "texto", label: "Medicamentos actuales" },
        { tipo: "texto", label: "Antecedentes familiares relevantes", ancho: "completo" },
      ],
    },
    {
      titulo: "Historia escolar",
      campos: [
        { tipo: "texto", label: "Edad de ingreso a la escuela" },
        { tipo: "texto", label: "Cambios de escuela" },
        { tipo: "lineas", label: "Desempeño y dificultades escolares", n: 3 },
      ],
    },
    {
      titulo: "Conducta y área socioemocional",
      campos: [
        { tipo: "lineas", label: "Carácter, relación con pares y familia, intereses, miedos", n: 4 },
      ],
    },
    {
      titulo: "Observaciones del entrevistador",
      campos: [{ tipo: "lineas", n: 4 }],
    },
  ],
};

/** Encabezado de datos para el formato de adultos (sin escuela/tutores). */
const DATOS_PACIENTE_ADULTO: SeccionFormato = {
  titulo: "Datos del paciente",
  campos: [
    { tipo: "texto", label: "Nombre completo", ancho: "completo" },
    { tipo: "texto", label: "Fecha de nacimiento" },
    { tipo: "texto", label: "Edad" },
    { tipo: "texto", label: "Sexo" },
    { tipo: "texto", label: "Estado civil" },
    { tipo: "texto", label: "Ocupación" },
    { tipo: "texto", label: "Escolaridad" },
    { tipo: "texto", label: "Teléfono de contacto" },
    { tipo: "texto", label: "Fecha de aplicación" },
    { tipo: "texto", label: "Aplicador(a)" },
  ],
};

// ── 1b. Entrevista para adultos (anamnesis) ──
const ENTREVISTA_ADULTOS: Formato = {
  id: "entrevista-adultos",
  titulo: "Entrevista inicial para adultos",
  categoria: "Entrevista",
  descripcion:
    "Historia clínica y psicológica que se llena en la primera cita con un paciente adulto.",
  secciones: [
    DATOS_PACIENTE_ADULTO,
    {
      titulo: "Motivo de consulta",
      campos: [
        { tipo: "lineas", label: "¿Qué lo trae a consulta? ¿Desde cuándo?", n: 4 },
      ],
    },
    {
      titulo: "Historia personal y familiar",
      campos: [
        { tipo: "texto", label: "Con quién vive" },
        { tipo: "texto", label: "Estado civil / pareja" },
        { tipo: "texto", label: "Hijos (número y edades)" },
        { tipo: "lineas", label: "Dinámica familiar relevante", n: 3 },
      ],
    },
    {
      titulo: "Historia médica y psiquiátrica",
      campos: [
        { tipo: "texto", label: "Enfermedades importantes" },
        { tipo: "texto", label: "Hospitalizaciones / cirugías" },
        { tipo: "texto", label: "Medicamentos actuales" },
        { tipo: "texto", label: "Tratamiento psiquiátrico previo o actual" },
        { tipo: "texto", label: "Antecedentes familiares relevantes", ancho: "completo" },
      ],
    },
    {
      titulo: "Historia psicológica previa",
      campos: [
        { tipo: "texto", label: "¿Ha llevado terapia antes?" },
        { tipo: "lineas", label: "Con quién, cuándo y motivo", n: 2 },
      ],
    },
    {
      titulo: "Hábitos y consumo de sustancias",
      campos: [
        { tipo: "texto", label: "Alcohol" },
        { tipo: "texto", label: "Tabaco" },
        { tipo: "texto", label: "Otras sustancias" },
        { tipo: "texto", label: "Sueño" },
        { tipo: "texto", label: "Alimentación" },
      ],
    },
    {
      titulo: "Vida laboral / académica y red de apoyo",
      campos: [
        { tipo: "lineas", label: "Ocupación actual, satisfacción laboral, red de apoyo social", n: 3 },
      ],
    },
    {
      titulo: "Examen mental breve",
      campos: [
        { tipo: "texto", label: "Apariencia y actitud" },
        { tipo: "texto", label: "Estado de ánimo" },
        { tipo: "texto", label: "Orientación (persona/espacio/tiempo)" },
        { tipo: "texto", label: "Ideación de riesgo (sí/no)" },
      ],
    },
    {
      titulo: "Observaciones del entrevistador",
      campos: [{ tipo: "lineas", n: 4 }],
    },
  ],
};

// ── 2. Perfil sensorial ──
const SISTEMAS_SENSORIALES = [
  "Se cubre los oídos ante ruidos cotidianos",
  "Le molestan ciertas texturas de ropa o etiquetas",
  "Evita ensuciarse las manos (pintura, lodo, pegamento)",
  "Busca movimiento constante (girar, saltar, mecerse)",
  "Se marea o evita columpios y resbaladillas",
  "Choca con objetos o personas / mide mal la fuerza",
  "Reacciona de más a luces o ambientes muy iluminados",
  "Es selectivo con sabores, olores o temperatura de la comida",
  "Le incomodan los abrazos o el contacto físico inesperado",
  "Se distrae con sonidos que otros ignoran",
];

const PERFIL_SENSORIAL: Formato = {
  id: "perfil-sensorial",
  titulo: "Perfil sensorial",
  categoria: "Sensorial",
  descripcion:
    "Cuestionario de respuesta sensorial para padres o terapeutas. Marca la frecuencia observada.",
  instrucciones:
    "Marca con una X la frecuencia con que el menor presenta cada conducta.",
  secciones: [
    DATOS_PACIENTE,
    {
      titulo: "Respuestas sensoriales",
      campos: [
        {
          tipo: "escala",
          filas: SISTEMAS_SENSORIALES,
          niveles: ["Nunca", "A veces", "Frecuente", "Siempre"],
        },
      ],
    },
    {
      titulo: "Sistemas con mayor afectación",
      campos: [
        {
          tipo: "checklist",
          columnas: 3,
          opciones: [
            "Auditivo",
            "Visual",
            "Táctil",
            "Vestibular (movimiento)",
            "Propioceptivo (fuerza/postura)",
            "Gustativo / olfativo",
          ],
        },
      ],
    },
    {
      titulo: "Observaciones e interpretación",
      campos: [{ tipo: "lineas", n: 4 }],
    },
  ],
};

// ── 3. Formato general de evaluación (resultados + qué necesita) ──
const FORMATO_EVALUACION: Formato = {
  id: "evaluacion-general",
  titulo: "Evaluación — resultados y necesidades",
  categoria: "Evaluación",
  descripcion:
    "Hoja para vaciar a mano cómo salió el paciente en la evaluación y qué necesita.",
  secciones: [
    DATOS_PACIENTE,
    {
      titulo: "Instrumentos aplicados",
      campos: [
        {
          tipo: "tabla",
          columnas: ["Instrumento", "Fecha", "Resultado / puntuación", "Categoría"],
          filas: 5,
        },
      ],
    },
    {
      titulo: "¿Cómo salió? — Resultados",
      campos: [
        { tipo: "lineas", label: "Fortalezas", n: 3 },
        { tipo: "lineas", label: "Áreas de oportunidad", n: 3 },
        { tipo: "lineas", label: "Interpretación cualitativa", n: 4 },
      ],
    },
    {
      titulo: "¿Qué necesita? — Recomendaciones",
      campos: [{ tipo: "lineas", n: 5 }],
    },
  ],
};

/** Hoja de registro y calificación genérica para un instrumento. */
function hojaInstrumento(value: string, label: string): Formato {
  return {
    id: `instrumento-${value.toLowerCase()}`,
    titulo: `Hoja de registro — ${label}`,
    categoria: "Instrumento",
    descripcion: `Hoja en blanco para registrar y calificar el instrumento ${label}.`,
    secciones: [
      DATOS_PACIENTE,
      {
        titulo: "Registro de puntuaciones",
        campos: [
          {
            tipo: "tabla",
            columnas: [
              "Subprueba / Índice",
              "P. directa",
              "P. escalar",
              "Percentil",
              "Categoría",
            ],
            filas: 12,
          },
        ],
      },
      {
        titulo: "Puntuación total",
        campos: [
          { tipo: "texto", label: "CI / Puntuación total" },
          { tipo: "texto", label: "Percentil global" },
        ],
      },
      {
        titulo: "Observaciones conductuales durante la aplicación",
        campos: [{ tipo: "lineas", n: 4 }],
      },
      {
        titulo: "Interpretación y conclusiones",
        campos: [{ tipo: "lineas", n: 4 }],
      },
    ],
  };
}

/** Catálogo completo de formatos imprimibles. */
export const FORMATOS: Formato[] = [
  ENTREVISTA_INICIAL,
  ENTREVISTA_ADULTOS,
  PERFIL_SENSORIAL,
  FORMATO_EVALUACION,
  ...TIPO_PRUEBA_OPCIONES.filter((t) => t.value !== "OTRO").map((t) =>
    hojaInstrumento(t.value, t.label),
  ),
];
