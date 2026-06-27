import { z } from "zod";

export const loginSchema = z.object({
  usuario: z
    .string()
    .min(1, "El ID de usuario es obligatorio")
    .max(50, "El ID es demasiado largo")
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      "El ID solo puede contener letras, números, punto, guion y guion bajo",
    ),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export type LoginInput = z.infer<typeof loginSchema>;
