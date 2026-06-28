import { z } from "zod";

const numeroOpcional = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().optional(),
);

export const subpruebaSchema = z.object({
  nombre_subprueba: z.string().min(1, "Nombre requerido"),
  puntuacion_directa: numeroOpcional,
  puntuacion_escalar: numeroOpcional,
  percentil: numeroOpcional,
  categoria: z.string().optional(),
});

export const evaluacionSchema = z.object({
  paciente_id: z.string().uuid({ message: "Selecciona un paciente" }),
  psicologo_id: z.string().uuid({ message: "Selecciona un terapeuta" }),
  tipo_prueba: z.enum([
    "WISC-V",
    "WPPSI-IV",
    "BENDER-II",
    "PROLEC-R",
    "PROESC",
    "TALE",
    "ENFEN",
    "CONNERS-3",
    "BASC-3",
    "VINELAND-3",
    "BAYLEY-4",
    "BEERY-VMI",
    "STROOP",
    "TOUR",
    "OTRO",
  ]),
  nombre_personalizado: z.string().optional(),
  fecha_aplicacion: z.string().min(1, "Selecciona la fecha"),
  fecha_calificacion: z.string().optional(),
  fecha_entrega: z.string().optional(),
  ci_total: numeroOpcional,
  interpretacion_cualitativa: z.string().optional(),
  fortalezas: z.array(z.string()).default([]),
  areas_oportunidad: z.array(z.string()).default([]),
  recomendaciones: z.string().optional(),
  estatus: z.enum([
    "pendiente",
    "en_proceso",
    "calificada",
    "entregada",
    "archivada",
  ]),
  subpruebas: z.array(subpruebaSchema).default([]),
});

export type EvaluacionInput = z.infer<typeof evaluacionSchema>;
export type SubpruebaInput = z.infer<typeof subpruebaSchema>;
