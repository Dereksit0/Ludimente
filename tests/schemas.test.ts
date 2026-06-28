import { describe, expect, it } from "vitest";

import { citaSchema } from "../lib/validations/cita.schema";
import { pagoSchema } from "../lib/validations/pago.schema";
import { evaluacionSchema } from "../lib/validations/evaluacion.schema";

const UUID = "11111111-1111-1111-1111-111111111111";

describe("pagoSchema", () => {
  const base = {
    concepto: "Sesión",
    monto: 500,
    descuento: 0,
    metodo_pago: "efectivo",
    estatus: "pagado",
  };

  it("acepta un pago válido", () => {
    expect(pagoSchema.safeParse(base).success).toBe(true);
  });

  it("rechaza descuento mayor al monto (#9)", () => {
    const r = pagoSchema.safeParse({ ...base, monto: 100, descuento: 200 });
    expect(r.success).toBe(false);
  });

  it("rechaza monto no positivo", () => {
    expect(pagoSchema.safeParse({ ...base, monto: 0 }).success).toBe(false);
  });
});

describe("citaSchema", () => {
  const base = {
    paciente_id: UUID,
    psicologo_id: UUID,
    fecha: "2026-07-01",
    hora: "10:00",
    duracion_min: 50,
    tipo: "sesion_intervencion",
    modalidad: "presencial",
  };

  it("acepta una cita válida", () => {
    expect(citaSchema.safeParse(base).success).toBe(true);
  });

  it("rechaza tipo inválido", () => {
    expect(citaSchema.safeParse({ ...base, tipo: "xxx" }).success).toBe(false);
  });

  it("rechaza paciente no-uuid", () => {
    expect(citaSchema.safeParse({ ...base, paciente_id: "abc" }).success).toBe(
      false,
    );
  });
});

describe("evaluacionSchema", () => {
  const base = {
    paciente_id: UUID,
    psicologo_id: UUID,
    tipo_prueba: "WISC-V",
    fecha_aplicacion: "2026-06-01",
    estatus: "en_proceso",
    fortalezas: [],
    areas_oportunidad: [],
    subpruebas: [],
  };

  it("acepta una evaluación válida", () => {
    expect(evaluacionSchema.safeParse(base).success).toBe(true);
  });

  it("convierte ci_total vacío en undefined (no 0)", () => {
    const r = evaluacionSchema.safeParse({ ...base, ci_total: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.ci_total).toBeUndefined();
  });
});
