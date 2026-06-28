"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesUpdate } from "@/types/database.types";

export type Configuracion = Tables<"configuracion">;

const KEY = ["configuracion"] as const;

export function useConfiguracion() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Configuracion | null> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("configuracion")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useGuardarConfiguracion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      cambios,
    }: {
      id: string;
      cambios: TablesUpdate<"configuracion">;
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("configuracion")
        .update(cambios)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
