"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { SesionInput } from "@/lib/validations/sesion.schema";
import type { Tables } from "@/types/database.types";

export type Sesion = Tables<"sesiones">;

export const sesionesKeys = {
  all: ["sesiones"] as const,
  paciente: (id: string) => [...sesionesKeys.all, "paciente", id] as const,
};

function aFila(input: SesionInput) {
  const limpio = (v?: string) => (v && v.trim() ? v.trim() : null);
  return {
    psicologo_id: input.psicologo_id,
    cita_id: input.cita_id || null,
    fecha_sesion: input.fecha_sesion,
    area_trabajo: input.area_trabajo ?? null,
    objetivos_sesion: input.objetivos_sesion,
    desarrollo_sesion: input.desarrollo_sesion,
    observaciones_conducta: limpio(input.observaciones_conducta),
    logros_sesion: limpio(input.logros_sesion),
    dificultades_encontradas: limpio(input.dificultades_encontradas),
    humor_paciente: input.humor_paciente ?? null,
    nivel_participacion: input.nivel_participacion ?? null,
    plan_siguiente_sesion: limpio(input.plan_siguiente_sesion),
    recomendaciones_casa: limpio(input.recomendaciones_casa),
    borrador: input.borrador,
    finalizada_at: input.borrador ? null : new Date().toISOString(),
  };
}

export function useSesionesPaciente(pacienteId: string) {
  return useQuery({
    queryKey: sesionesKeys.paciente(pacienteId),
    enabled: Boolean(pacienteId),
    queryFn: async (): Promise<Sesion[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("sesiones")
        .select("*")
        .eq("paciente_id", pacienteId)
        .is("deleted_at", null)
        .order("fecha_sesion", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCrearSesion(pacienteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SesionInput): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("sesiones")
        .insert({ ...aFila(input), paciente_id: pacienteId });
      if (error) throw error;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: sesionesKeys.paciente(pacienteId) }),
  });
}

export function useActualizarSesion(pacienteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: SesionInput;
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("sesiones")
        .update(aFila(input))
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: sesionesKeys.paciente(pacienteId) }),
  });
}

export function useEliminarSesion(pacienteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient();
      // Soft-delete: las notas clínicas nunca se borran físicamente.
      const { error } = await supabase
        .from("sesiones")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: sesionesKeys.paciente(pacienteId) }),
  });
}
