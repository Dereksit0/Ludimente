"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";

export type Tamizaje = Tables<"tamizajes">;
export type TamizajeItem = Tamizaje & {
  paciente_nombre: string;
  expediente: string;
  evaluador_nombre: string | null;
  areasMap: Record<string, string>;
};

const KEY = ["tamizajes"] as const;

export function useTamizajes() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<TamizajeItem[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tamizajes")
        .select("*")
        .order("fecha", { ascending: false });
      if (error) throw error;
      const tams = data ?? [];

      const pacIds = [...new Set(tams.map((t) => t.paciente_id))];
      const evalIds = [
        ...new Set(tams.map((t) => t.evaluador_id).filter(Boolean)),
      ] as string[];

      const { data: pacientes } = await supabase
        .from("pacientes")
        .select("id, nombre, apellido_paterno, numero_expediente")
        .in("id", pacIds.length ? pacIds : ["00000000-0000-0000-0000-000000000000"]);
      const { data: perfiles } = evalIds.length
        ? await supabase.from("profiles").select("id, full_name").in("id", evalIds)
        : { data: [] };

      const pmap = new Map((pacientes ?? []).map((p) => [p.id, p]));
      const emap = new Map((perfiles ?? []).map((p) => [p.id, p]));

      return tams.map((t) => {
        const pac = pmap.get(t.paciente_id);
        return {
          ...t,
          paciente_nombre: pac ? `${pac.nombre} ${pac.apellido_paterno}` : "—",
          expediente: pac?.numero_expediente ?? "",
          evaluador_nombre: t.evaluador_id
            ? (emap.get(t.evaluador_id)?.full_name ?? null)
            : null,
          areasMap: (t.areas ?? {}) as Record<string, string>,
        };
      });
    },
  });
}

/** Historial de tamizajes de un paciente (más reciente primero). */
export function useTamizajesPaciente(pacienteId: string) {
  return useQuery({
    queryKey: ["tamizajes", "paciente", pacienteId],
    enabled: Boolean(pacienteId),
    queryFn: async (): Promise<Tamizaje[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tamizajes")
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("fecha", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCrearTamizaje() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TablesInsert<"tamizajes">): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase.from("tamizajes").insert(input);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useActualizarTamizaje() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      cambios,
    }: {
      id: string;
      cambios: TablesUpdate<"tamizajes">;
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase.from("tamizajes").update(cambios).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useEliminarTamizaje() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase.from("tamizajes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
