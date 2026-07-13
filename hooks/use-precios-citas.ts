"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { Tables, TipoCita } from "@/types/database.types";

export type PrecioCita = Tables<"precios_citas">;

const KEY = ["precios_citas"] as const;

export function usePreciosCitas() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<PrecioCita[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("precios_citas")
        .select("*")
        .order("tipo");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Guarda el precio de un tipo de cita (upsert por `tipo`). */
export function useGuardarPrecioCita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tipo,
      precio,
    }: {
      tipo: TipoCita;
      precio: number;
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("precios_citas")
        .upsert({ tipo, precio }, { onConflict: "tipo" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
