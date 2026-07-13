"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesInsert } from "@/types/database.types";

export type Consentimiento = Tables<"consentimientos">;

export type ConsentimientoListItem = Consentimiento & {
  paciente_nombre: string;
  expediente: string;
};

export const consentimientosKeys = {
  all: ["consentimientos"] as const,
  lista: () => [...consentimientosKeys.all, "lista"] as const,
};

export function useConsentimientos() {
  return useQuery({
    queryKey: consentimientosKeys.lista(),
    queryFn: async (): Promise<ConsentimientoListItem[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("consentimientos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return [];

      const ids = [...new Set(data.map((c) => c.paciente_id))];
      const { data: pacientes } = await supabase
        .from("pacientes")
        .select("id, nombre, apellido_paterno, apellido_materno, numero_expediente")
        .in("id", ids);
      const mapa = new Map((pacientes ?? []).map((p) => [p.id, p]));

      return data.map((c) => {
        const pac = mapa.get(c.paciente_id);
        return {
          ...c,
          paciente_nombre: pac
            ? `${pac.nombre} ${pac.apellido_paterno} ${pac.apellido_materno ?? ""}`.trim()
            : "Paciente",
          expediente: pac?.numero_expediente ?? "",
        };
      });
    },
  });
}

export function useCrearConsentimiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: TablesInsert<"consentimientos">,
    ): Promise<void> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("consentimientos")
        .insert({ ...input, created_by: user?.id ?? null });
      if (error) throw error;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: consentimientosKeys.lista() }),
  });
}

export function useFirmarConsentimiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      firma_data,
      firmante_nombre,
      firmante_parentesco,
      decision,
    }: {
      id: string;
      firma_data: string;
      firmante_nombre: string;
      firmante_parentesco: string;
      decision?: "acepta" | "no_acepta" | null;
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("consentimientos")
        .update({
          firmado: true,
          firma_data,
          firmante_nombre,
          firmante_parentesco,
          firmado_at: new Date().toISOString(),
          decision: decision ?? null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: consentimientosKeys.lista() }),
  });
}

export function useEliminarConsentimiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("consentimientos")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: consentimientosKeys.lista() }),
  });
}
