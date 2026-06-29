"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";

export type ItemInventario = Tables<"inventario_items">;

export const inventarioKeys = {
  all: ["inventario"] as const,
  lista: () => [...inventarioKeys.all, "lista"] as const,
};

export function useInventario() {
  return useQuery({
    queryKey: inventarioKeys.lista(),
    queryFn: async (): Promise<ItemInventario[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("inventario_items")
        .select("*")
        .order("nombre");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCrearItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: TablesInsert<"inventario_items">,
    ): Promise<void> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("inventario_items")
        .insert({ ...input, created_by: user?.id ?? null });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: inventarioKeys.lista() }),
  });
}

export function useActualizarItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      cambios,
    }: {
      id: string;
      cambios: TablesUpdate<"inventario_items">;
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("inventario_items")
        .update(cambios)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: inventarioKeys.lista() }),
  });
}

export function useEliminarItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("inventario_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: inventarioKeys.lista() }),
  });
}
