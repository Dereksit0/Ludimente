import { TAMIZAJE_AREAS } from "@/lib/catalogos";

/** Áreas válidas para objetivos_intervencion (enum de BD). */
export type ObjetivoArea =
  | "lenguaje"
  | "aprendizaje"
  | "conducta"
  | "motriz"
  | "socioemocional"
  | "atencion"
  | "autonomia"
  | "otro";

/** Objetivos sugeridos por área del tamizaje, con su mapeo al área del plan. */
export const OBJETIVOS_SUGERIDOS: Record<
  string,
  { areaObjetivo: ObjetivoArea; objetivos: string[] }
> = {
  trazo: {
    areaObjetivo: "motriz",
    objetivos: [
      "Fortalecer el agarre de pinza y el control del trazo",
      "Trabajar direccionalidad, presión y precisión grafomotriz",
    ],
  },
  lenguaje: {
    areaObjetivo: "lenguaje",
    objetivos: [
      "Ampliar el vocabulario expresivo y comprensivo",
      "Mejorar la estructuración de frases y la narración",
    ],
  },
  lectura: {
    areaObjetivo: "aprendizaje",
    objetivos: [
      "Desarrollar la conciencia fonológica",
      "Mejorar la fluidez y la comprensión lectora",
    ],
  },
  escritura: {
    areaObjetivo: "aprendizaje",
    objetivos: [
      "Consolidar la correspondencia grafema–fonema",
      "Mejorar la ortografía y la composición escrita",
    ],
  },
  matematicas: {
    areaObjetivo: "aprendizaje",
    objetivos: [
      "Reforzar el conteo y el valor posicional",
      "Desarrollar el razonamiento y la resolución de problemas",
    ],
  },
  atencion: {
    areaObjetivo: "atencion",
    objetivos: [
      "Aumentar la atención sostenida en las tareas",
      "Aplicar estrategias de autorregulación para reducir la distractibilidad",
    ],
  },
  memoria: {
    areaObjetivo: "atencion",
    objetivos: [
      "Entrenar la memoria de trabajo",
      "Aplicar estrategias de memorización y evocación",
    ],
  },
  motricidad_fina: {
    areaObjetivo: "motriz",
    objetivos: [
      "Mejorar la coordinación óculo-manual",
      "Fortalecer las destrezas manipulativas finas",
    ],
  },
  motricidad_gruesa: {
    areaObjetivo: "motriz",
    objetivos: [
      "Mejorar el equilibrio y la coordinación corporal",
      "Desarrollar el esquema corporal y la lateralidad",
    ],
  },
  socioemocional: {
    areaObjetivo: "socioemocional",
    objetivos: [
      "Desarrollar el reconocimiento y manejo de emociones",
      "Fortalecer las habilidades sociales y de interacción",
    ],
  },
  autonomia: {
    areaObjetivo: "autonomia",
    objetivos: [
      "Promover la autonomía en las rutinas diarias",
      "Fomentar la toma de decisiones y el autocuidado",
    ],
  },
};

export interface PropuestaObjetivo {
  area: string;
  areaLabel: string;
  areaObjetivo: ObjetivoArea;
  descripcion: string;
  prioridad: "alta" | "media";
}

export interface Propuesta {
  objetivos: PropuestaObjetivo[];
  areasTrabajo: number;
  sesiones: number;
  frecuencia: number;
  semanas: number;
  duracionMin: number;
  precioBase: number;
  precioLista: number;
  totalLista: number;
  totalBase: number;
  mensualidad: number;
  moneda: string;
}

/** Margen del precio de lista sobre el precio base (lo que "aparece en el sistema"). */
export const MARKUP_PRECIO_LISTA = 0.2;

export interface OpcionesPropuesta {
  precioBase: number;
  duracionMin: number;
  moneda: string;
  markup?: number;
}

/** Genera la propuesta de intervención a partir de los resultados del tamizaje. */
export function generarPropuesta(
  areas: Record<string, string>,
  opts: OpcionesPropuesta,
): Propuesta {
  const markup = opts.markup ?? MARKUP_PRECIO_LISTA;
  const objetivos: PropuestaObjetivo[] = [];
  let noLogrado = 0;
  let enProceso = 0;

  for (const a of TAMIZAJE_AREAS) {
    const nivel = areas[a.value] ?? "no_evaluado";
    if (nivel === "logrado" || nivel === "no_evaluado") continue;

    const prioridad = nivel === "no_logrado" ? "alta" : "media";
    if (nivel === "no_logrado") noLogrado++;
    else enProceso++;

    const cat = OBJETIVOS_SUGERIDOS[a.value];
    if (!cat) continue;
    const cuantos = nivel === "no_logrado" ? cat.objetivos.length : 1;
    for (let i = 0; i < cuantos; i++) {
      objetivos.push({
        area: a.value,
        areaLabel: a.label,
        areaObjetivo: cat.areaObjetivo,
        descripcion: cat.objetivos[i]!,
        prioridad,
      });
    }
  }

  const areasTrabajo = noLogrado + enProceso;
  const frecuencia = 2; // sesiones por semana
  const sesiones = Math.min(48, Math.max(8, noLogrado * 4 + enProceso * 2));
  const semanas = Math.ceil(sesiones / frecuencia);

  const precioBase = opts.precioBase || 0;
  // Precio de lista redondeado a la decena más cercana.
  const precioLista = Math.round((precioBase * (1 + markup)) / 10) * 10;

  return {
    objetivos,
    areasTrabajo,
    sesiones,
    frecuencia,
    semanas,
    duracionMin: opts.duracionMin,
    precioBase,
    precioLista,
    totalLista: sesiones * precioLista,
    totalBase: sesiones * precioBase,
    mensualidad: frecuencia * 4 * precioLista,
    moneda: opts.moneda || "MXN",
  };
}
