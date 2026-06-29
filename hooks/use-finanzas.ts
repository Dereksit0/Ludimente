"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesInsert } from "@/types/database.types";

export type Gasto = Tables<"gastos">;

export const gastosKeys = {
  all: ["gastos"] as const,
  lista: () => [...gastosKeys.all, "lista"] as const,
};

export function useGastos() {
  return useQuery({
    queryKey: gastosKeys.lista(),
    queryFn: async (): Promise<Gasto[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("gastos")
        .select("*")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Ingresos cobrados (pagos pagados) para cruzar contra egresos. */
export type IngresoMes = { mes: string; total: number };

export function useIngresosCobrados() {
  return useQuery({
    queryKey: ["finanzas", "ingresos"],
    queryFn: async (): Promise<{ fecha: string; monto: number }[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("pagos")
        .select("monto_final, monto, fecha_pago, estatus")
        .eq("estatus", "pagado");
      if (error) throw error;
      return (data ?? [])
        .filter((p) => p.fecha_pago)
        .map((p) => ({
          fecha: p.fecha_pago as string,
          monto: Number(p.monto_final ?? p.monto ?? 0),
        }));
    },
  });
}

/** Total pendiente de cobro (pagos en estatus pendiente). */
export function usePorCobrar() {
  return useQuery({
    queryKey: ["finanzas", "por-cobrar"],
    queryFn: async (): Promise<number> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("pagos")
        .select("monto_final, monto")
        .eq("estatus", "pendiente");
      if (error) throw error;
      return (data ?? []).reduce(
        (s, p) => s + Number(p.monto_final ?? p.monto ?? 0),
        0,
      );
    },
  });
}

export function useCrearGasto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TablesInsert<"gastos">): Promise<void> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("gastos")
        .insert({ ...input, created_by: user?.id ?? null });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: gastosKeys.lista() }),
  });
}

export function useEliminarGasto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase.from("gastos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: gastosKeys.lista() }),
  });
}
