import { z } from "zod";

export const citaSchema = z.object({
  paciente_id: z.string().uuid({ message: "Selecciona un paciente" }),
  psicologo_id: z.string().uuid({ message: "Selecciona un terapeuta" }),
  fecha: z.string().min(1, "Selecciona la fecha"),
  hora: z.string().min(1, "Selecciona la hora"),
  duracion_min: z.coerce.number().int().min(15).max(240),
  tipo: z.enum([
    "evaluacion_inicial",
    "sesion_intervencion",
    "devolucion_resultados",
    "seguimiento",
    "entrevista_padres",
    "taller",
    "otro",
  ]),
  modalidad: z.enum(["presencial", "videollamada"]),
  notas_previas: z.string().optional(),
});

export type CitaInput = z.infer<typeof citaSchema>;
