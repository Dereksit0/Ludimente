"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { BUCKET_RECURSOS, borrarArchivo, pathDeUrlPublica } from "@/lib/storage";
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
      urlAnterior,
    }: {
      id: string;
      cambios: TablesUpdate<"recursos">;
      /** URL del archivo anterior, si se está reemplazando (para borrarlo del bucket). */
      urlAnterior?: string | null;
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("recursos")
        .update(cambios)
        .eq("id", id);
      if (error) throw error;

      if (urlAnterior && cambios.url && urlAnterior !== cambios.url) {
        const pathViejo = pathDeUrlPublica(BUCKET_RECURSOS, urlAnterior);
        if (pathViejo) await borrarArchivo(BUCKET_RECURSOS, pathViejo);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: recursosKeys.lista() }),
  });
}

export function useEliminarRecurso() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (recurso: { id: string; url: string | null }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("recursos")
        .delete()
        .eq("id", recurso.id);
      if (error) throw error;

      const path = pathDeUrlPublica(BUCKET_RECURSOS, recurso.url);
      if (path) await borrarArchivo(BUCKET_RECURSOS, path);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: recursosKeys.lista() }),
  });
}
