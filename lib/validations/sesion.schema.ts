import { z } from "zod";

export const sesionSchema = z.object({
  psicologo_id: z.string().uuid({ message: "Selecciona un terapeuta" }),
  cita_id: z.string().optional(),
  fecha_sesion: z.string().min(1, "Selecciona la fecha"),
  area_trabajo: z
    .enum([
      "lectura",
      "escritura",
      "matematicas",
      "atencion",
      "memoria",
      "lenguaje",
      "socio_emocional",
      "motor",
      "otro",
    ])
    .optional(),
  objetivos_sesion: z.string().min(1, "Describe los objetivos"),
  desarrollo_sesion: z.string().min(1, "Describe el desarrollo de la sesión"),
  observaciones_conducta: z.string().optional(),
  logros_sesion: z.string().optional(),
  dificultades_encontradas: z.string().optional(),
  humor_paciente: z
    .enum(["muy_bien", "bien", "regular", "mal", "muy_mal"])
    .optional(),
  nivel_participacion: z.coerce.number().int().min(1).max(5).optional(),
  plan_siguiente_sesion: z.string().optional(),
  recomendaciones_casa: z.string().optional(),
  borrador: z.boolean().default(false),
});

export type SesionInput = z.infer<typeof sesionSchema>;
