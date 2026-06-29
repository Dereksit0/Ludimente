import { z } from "zod";

/** Esquemas de validación de los módulos nuevos (planes, finanzas, etc.). */

export const planSchema = z
  .object({
    paciente_id: z.string().uuid("Selecciona un paciente"),
    titulo: z.string().trim().min(1, "Escribe un título para el plan"),
    fecha_inicio: z.string().min(1, "Indica la fecha de inicio"),
    fecha_fin_estimada: z.string().nullable().optional(),
  })
  .refine(
    (d) => !d.fecha_fin_estimada || d.fecha_fin_estimada >= d.fecha_inicio,
    { message: "El fin estimado no puede ser anterior al inicio", path: ["fecha_fin_estimada"] },
  );

export const objetivoSchema = z.object({
  descripcion: z.string().trim().min(1, "Describe el objetivo"),
});

export const gastoSchema = z.object({
  concepto: z.string().trim().min(1, "Escribe el concepto"),
  monto: z.number({ invalid_type_error: "Monto inválido" }).min(0, "El monto no puede ser negativo"),
});

export const reporteSchema = z
  .object({
    paciente_id: z.string().uuid("Selecciona un paciente"),
    titulo: z.string().trim().min(1, "Escribe un título"),
    periodo_inicio: z.string().nullable().optional(),
    periodo_fin: z.string().nullable().optional(),
  })
  .refine(
    (d) => !d.periodo_inicio || !d.periodo_fin || d.periodo_fin >= d.periodo_inicio,
    { message: "El fin del periodo no puede ser anterior al inicio", path: ["periodo_fin"] },
  );

export const consentimientoSchema = z.object({
  paciente_id: z.string().uuid("Selecciona un paciente"),
  titulo: z.string().trim().min(1, "Escribe un título"),
});

export const itemInventarioSchema = z.object({
  nombre: z.string().trim().min(1, "Escribe el nombre del artículo"),
  cantidad: z.number({ invalid_type_error: "Cantidad inválida" }).min(0, "Cantidad inválida"),
});

export const recursoSchema = z
  .object({
    titulo: z.string().trim().min(1, "Escribe un título"),
    edad_min: z.number().nullable().optional(),
    edad_max: z.number().nullable().optional(),
  })
  .refine(
    (d) => d.edad_min == null || d.edad_max == null || d.edad_max >= d.edad_min,
    { message: "La edad máxima debe ser mayor o igual a la mínima", path: ["edad_max"] },
  );

/** Primer mensaje de error legible de un ZodError. */
export function primerError(e: z.ZodError): string {
  return e.issues[0]?.message ?? "Revisa los datos del formulario";
}
