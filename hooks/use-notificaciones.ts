"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database.types";

export type Notificacion = Tables<"notificaciones">;

const KEY = ["notificaciones"] as const;

export function useNotificaciones() {
  return useQuery({
    queryKey: KEY,
    refetchInterval: 60_000,
    queryFn: async (): Promise<Notificacion[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("notificaciones")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMarcarNotificacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("notificaciones")
        .update({ leida: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useMarcarTodasNotificaciones() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("notificaciones")
        .update({ leida: true })
        .eq("leida", false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
