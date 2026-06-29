"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";

export type Recurso = Tables<"recursos">;

export const recursosKeys = {
  all: ["recursos"] as const,
  lista: () => [...recursosKeys.all, "lista"] as const,
};

export function useRecursos() {
  return useQuery({
    queryKey: recursosKeys.lista(),
    queryFn: async (): Promise<Recurso[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("recursos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCrearRecurso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TablesInsert<"recursos">): Promise<void> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("recursos")
        .insert({ ...input, created_by: user?.id ?? null });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: recursosKeys.lista() }),
  });
}

export function useActualizarRecurso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      cambios,
    }: {
      id: string;
      cambios: TablesUpdate<"recursos">;
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("recursos")
        .update(cambios)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: recursosKeys.lista() }),
  });
}

export function useEliminarRecurso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase.from("recursos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: recursosKeys.lista() }),
  });
}
