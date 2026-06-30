"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";

export type Planeacion = Tables<"planeaciones">;
export type PlaneacionItem = Planeacion & {
  paciente_nombre: string;
  expediente: string;
  terapeuta_nombre: string | null;
};

const KEY = ["planeaciones"] as const;

export function usePlaneaciones() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<PlaneacionItem[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("planeaciones")
        .select("*")
        .eq("activo", true)
        .order("dia_semana", { ascending: true })
        .order("horario", { ascending: true });
      if (error) throw error;
      const planes = data ?? [];

      const pacIds = [...new Set(planes.map((p) => p.paciente_id))];
      const terapIds = [
        ...new Set(planes.map((p) => p.terapeuta_id).filter(Boolean)),
      ] as string[];

      const { data: pacientes } = await supabase
        .from("pacientes")
        .select("id, nombre, apellido_paterno, numero_expediente")
        .in("id", pacIds.length ? pacIds : ["00000000-0000-0000-0000-000000000000"]);
      const { data: perfiles } = terapIds.length
        ? await supabase.from("profiles").select("id, full_name").in("id", terapIds)
        : { data: [] };

      const pmap = new Map((pacientes ?? []).map((p) => [p.id, p]));
      const tmap = new Map((perfiles ?? []).map((p) => [p.id, p]));

      return planes.map((p) => {
        const pac = pmap.get(p.paciente_id);
        return {
          ...p,
          paciente_nombre: pac
            ? `${pac.nombre} ${pac.apellido_paterno}`
            : "—",
          expediente: pac?.numero_expediente ?? "",
          terapeuta_nombre: p.terapeuta_id
            ? (tmap.get(p.terapeuta_id)?.full_name ?? null)
            : null,
        };
      });
    },
  });
}

export function useCrearPlaneacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TablesInsert<"planeaciones">): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase.from("planeaciones").insert(input);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useActualizarPlaneacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      cambios,
    }: {
      id: string;
      cambios: TablesUpdate<"planeaciones">;
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("planeaciones")
        .update(cambios)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useEliminarPlaneacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase.from("planeaciones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
