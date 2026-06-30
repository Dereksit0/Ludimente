"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { RespuestasFormato } from "@/lib/print-formato";
import type { Tables } from "@/types/database.types";

export type FormatoLlenado = Tables<"formatos_llenados">;
export type FormatoLlenadoItem = FormatoLlenado & {
  paciente_nombre: string;
  expediente: string;
  respuestasMap: RespuestasFormato;
};

const KEY = ["formatos_llenados"] as const;

export function useFormatosLlenados() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<FormatoLlenadoItem[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("formatos_llenados")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const items = data ?? [];

      const pacIds = [...new Set(items.map((i) => i.paciente_id))];
      const { data: pacientes } = await supabase
        .from("pacientes")
        .select("id, nombre, apellido_paterno, numero_expediente")
        .in("id", pacIds.length ? pacIds : ["00000000-0000-0000-0000-000000000000"]);
      const pmap = new Map((pacientes ?? []).map((p) => [p.id, p]));

      return items.map((i) => {
        const pac = pmap.get(i.paciente_id);
        return {
          ...i,
          paciente_nombre: pac ? `${pac.nombre} ${pac.apellido_paterno}` : "—",
          expediente: pac?.numero_expediente ?? "",
          respuestasMap: (i.respuestas ?? {}) as RespuestasFormato,
        };
      });
    },
  });
}

export interface GuardarFormatoInput {
  id?: string;
  paciente_id: string;
  formato_id: string;
  titulo: string;
  respuestas: RespuestasFormato;
}

export function useGuardarFormatoLlenado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: GuardarFormatoInput): Promise<void> => {
      const supabase = createClient();
      const fila = {
        paciente_id: input.paciente_id,
        formato_id: input.formato_id,
        titulo: input.titulo,
        respuestas: input.respuestas as never,
      };
      const { error } = input.id
        ? await supabase.from("formatos_llenados").update(fila).eq("id", input.id)
        : await supabase.from("formatos_llenados").insert(fila);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useEliminarFormatoLlenado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("formatos_llenados")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
