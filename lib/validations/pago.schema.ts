import { z } from "zod";

export const pagoSchema = z.object({
  concepto: z.string().min(1, "Escribe el concepto"),
  monto: z.coerce.number().positive("El monto debe ser mayor a 0"),
  descuento: z.coerce.number().min(0).default(0),
  metodo_pago: z.enum([
    "efectivo",
    "transferencia",
    "tarjeta_debito",
    "tarjeta_credito",
    "otro",
  ]),
  estatus: z.enum(["pendiente", "pagado", "cancelado", "reembolsado"]),
  fecha_pago: z.string().optional(),
  referencia: z.string().optional(),
  notas: z.string().optional(),
}).refine((d) => d.descuento <= d.monto, {
  message: "El descuento no puede ser mayor al monto",
  path: ["descuento"],
});

export type PagoInput = z.infer<typeof pagoSchema>;
