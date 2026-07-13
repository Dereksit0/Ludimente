import { z } from "zod";

export const citaSchema = z.object({
  paciente_id: z.string().uuid({ message: "Selecciona un paciente" }),
  psicologo_id: z.string().uuid({ message: "Selecciona un terapeuta" }),
  fecha: z.string().min(1, "Selecciona la fecha"),
  hora: z.string().min(1, "Selecciona la hora"),
  duracion_min: z.coerce.number().int().min(15).max(360),
  tipo: z.enum([
    "evaluacion_inicial",
    "entrevista_adultos",
    "sesion_intervencion",
    "terapia_lenguaje",
    "terapia_ocupacional",
    "terapia_conductual",
    "terapia_psicologica_adultos",
    "terapia_familiar",
    "valoracion_neuropsicologica",
    "devolucion_resultados",
    "seguimiento",
    "entrevista_padres",
    "asesoria_escolar",
    "taller",
    "urgencia",
    "otro",
  ]),
  modalidad: z.enum(["presencial", "videollamada"]),
  notas_previas: z.string().optional(),
});

export type CitaInput = z.infer<typeof citaSchema>;
