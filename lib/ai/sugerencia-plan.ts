import { generateObject } from "ai";
import { z } from "zod";

export const objetivoSugeridoSchema = z.object({
  descripcion: z.string().min(5).max(200),
  area: z.enum([
    "lenguaje",
    "aprendizaje",
    "conducta",
    "motriz",
    "socioemocional",
    "atencion",
    "autonomia",
    "otro",
  ]),
  prioridad: z.enum(["alta", "media", "baja"]),
});

export const sugerenciaPlanSchema = z.object({
  objetivos: z.array(objetivoSugeridoSchema).min(2).max(6),
  sesionesSugeridas: z.number().int().min(4).max(60),
  frecuenciaSemanal: z.string().max(60),
  duracionEstimadaMeses: z.number().min(1).max(24),
  paqueteRecomendado: z.string().max(120).nullable(),
  precioEstimado: z.number().min(0),
  justificacion: z.string().max(1200),
});

export type SugerenciaPlan = z.infer<typeof sugerenciaPlanSchema>;

export interface DatosParaSugerencia {
  nombrePaciente?: string;
  edadAnios?: number | null;
  motivoConsulta?: string | null;
  diagnosticoPrincipal?: string | null;
  diagnosticosSecundarios?: string[];
  informacionMedica?: string | null;
  entrevistaRespuestas?: string | null;
  catalogoPaquetes: { nombre: string; num_sesiones: number; precio: number }[];
  precioSesionDefault: number;
}

export async function generarSugerenciaPlan(
  datos: DatosParaSugerencia,
): Promise<SugerenciaPlan> {
  const catalogoTexto = datos.catalogoPaquetes.length
    ? datos.catalogoPaquetes
        .map((p) => `- ${p.nombre}: ${p.num_sesiones} sesiones, $${p.precio} MXN`)
        .join("\n")
    : `Sin catálogo de paquetes definido. Precio de sesión individual por defecto: $${datos.precioSesionDefault} MXN.`;

  const { object } = await generateObject({
    model: "anthropic/claude-sonnet-5",
    schema: sugerenciaPlanSchema,
    prompt: `Eres un psicólogo clínico infantil experto en diseñar planes de intervención terapéutica para un centro de terapia infantil (Ludimente, México). Con base en la información de la entrevista inicial de un paciente, propone un borrador de plan de intervención.

Datos del paciente:
- Nombre: ${datos.nombrePaciente ?? "No especificado"}
- Edad: ${datos.edadAnios != null ? `${datos.edadAnios} años` : "No especificada"}
- Motivo de consulta: ${datos.motivoConsulta || "No especificado"}
- Diagnóstico principal: ${datos.diagnosticoPrincipal || "No especificado"}
- Diagnósticos secundarios: ${datos.diagnosticosSecundarios?.join(", ") || "Ninguno"}
- Información médica relevante: ${datos.informacionMedica || "No especificada"}
${datos.entrevistaRespuestas ? `\nRespuestas de la entrevista inicial (anamnesis):\n${datos.entrevistaRespuestas}` : ""}

Catálogo de paquetes de sesiones disponibles en el centro:
${catalogoTexto}

Instrucciones:
- Propón entre 2 y 6 objetivos de intervención concretos y medibles, cada uno con su área clínica y prioridad.
- Sugiere un número total de sesiones y una frecuencia semanal razonables para un plan inicial (normalmente 3 a 6 meses de trabajo).
- Si el catálogo tiene un paquete que se ajuste bien al número de sesiones sugerido, recomiéndalo por su nombre exacto en "paqueteRecomendado" y usa su precio como "precioEstimado". Si ninguno se ajusta bien, deja "paqueteRecomendado" en null y estima "precioEstimado" multiplicando las sesiones sugeridas por el precio de sesión individual.
- La justificación debe ser breve (máximo 5-6 líneas), en español, dirigida al psicólogo que revisará la propuesta.
- Deja claro en tu razonamiento que esto es solo una propuesta orientativa que el equipo clínico debe revisar y ajustar; no sustituye el juicio profesional.`,
  });

  return object;
}
