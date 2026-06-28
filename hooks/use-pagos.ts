"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { PagoInput } from "@/lib/validations/pago.schema";
import type { Tables } from "@/types/database.types";

export type Pago = Tables<"pagos">;

export const pagosKeys = {
  all: ["pagos"] as const,
  paciente: (id: string) => [...pagosKeys.all, "paciente", id] as const,
};

/** Normaliza el input del formulario a columnas de la tabla. */
function aFila(input: PagoInput) {
  return {
    concepto: input.concepto,
    monto: input.monto,
    descuento: input.descuento ?? 0,
    metodo_pago: input.metodo_pago,
    estatus: input.estatus,
    fecha_pago:
      input.estatus === "pagado"
        ? input.fecha_pago
          ? new Date(input.fecha_pago).toISOString()
          : new Date().toISOString()
        : null,
    referencia: input.referencia || null,
    notas: input.notas || null,
  };
}

export function usePagosPaciente(pacienteId: string) {
  return useQuery({
    queryKey: pagosKeys.paciente(pacienteId),
    enabled: Boolean(pacienteId),
    queryFn: async (): Promise<Pago[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("pagos")
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCrearPago(pacienteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PagoInput): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("pagos")
        .insert({ ...aFila(input), paciente_id: pacienteId });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: pagosKeys.paciente(pacienteId) });
      void qc.invalidateQueries({ queryKey: ["cobranza"] });
      void qc.invalidateQueries({ queryKey: ["reportes"] });
    },
  });
}

export function useActualizarPago(pacienteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: PagoInput;
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("pagos")
        .update(aFila(input))
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: pagosKeys.paciente(pacienteId) });
      void qc.invalidateQueries({ queryKey: ["cobranza"] });
      void qc.invalidateQueries({ queryKey: ["reportes"] });
    },
  });
}

export function useEliminarPago(pacienteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase.from("pagos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: pagosKeys.paciente(pacienteId) });
      void qc.invalidateQueries({ queryKey: ["cobranza"] });
      void qc.invalidateQueries({ queryKey: ["reportes"] });
    },
  });
}
