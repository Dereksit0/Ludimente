"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { EvaluacionInput } from "@/lib/validations/evaluacion.schema";
import type { Tables } from "@/types/database.types";

export type Evaluacion = Tables<"evaluaciones">;
export type Subprueba = Tables<"evaluacion_subpruebas">;
export type EvaluacionConPaciente = Evaluacion & {
  paciente_nombre: string;
  expediente: string;
};
export type EvaluacionDetalle = Evaluacion & { subpruebas: Subprueba[] };

export const evaluacionesKeys = {
  all: ["evaluaciones"] as const,
  lista: () => [...evaluacionesKeys.all, "lista"] as const,
  paciente: (id: string) => [...evaluacionesKeys.all, "paciente", id] as const,
  detalle: (id: string) => [...evaluacionesKeys.all, "detalle", id] as const,
};

function aFila(input: EvaluacionInput) {
  const limpio = (v?: string) => (v && v.trim() ? v.trim() : null);
  return {
    paciente_id: input.paciente_id,
    psicologo_id: input.psicologo_id,
    tipo_prueba: input.tipo_prueba,
    nombre_personalizado: limpio(input.nombre_personalizado),
    fecha_aplicacion: input.fecha_aplicacion,
    fecha_calificacion: limpio(input.fecha_calificacion),
    fecha_entrega: limpio(input.fecha_entrega),
    ci_total: input.ci_total ?? null,
    interpretacion_cualitativa: limpio(input.interpretacion_cualitativa),
    fortalezas: input.fortalezas.length ? input.fortalezas : null,
    areas_oportunidad: input.areas_oportunidad.length
      ? input.areas_oportunidad
      : null,
    recomendaciones: limpio(input.recomendaciones),
    estatus: input.estatus,
  };
}

async function guardarSubpruebas(
  evaluacionId: string,
  subpruebas: EvaluacionInput["subpruebas"],
) {
  const supabase = createClient();
  await supabase
    .from("evaluacion_subpruebas")
    .delete()
    .eq("evaluacion_id", evaluacionId);
  const filas = subpruebas
    .filter((s) => s.nombre_subprueba.trim())
    .map((s) => ({
      evaluacion_id: evaluacionId,
      nombre_subprueba: s.nombre_subprueba,
      puntuacion_directa: s.puntuacion_directa ?? null,
      puntuacion_escalar: s.puntuacion_escalar ?? null,
      percentil: s.percentil ?? null,
      categoria: s.categoria || null,
    }));
  if (filas.length) {
    await supabase.from("evaluacion_subpruebas").insert(filas);
  }
}

export function useEvaluaciones() {
  return useQuery({
    queryKey: evaluacionesKeys.lista(),
    queryFn: async (): Promise<EvaluacionConPaciente[]> => {
      const supabase = createClient();
      const { data: evals, error } = await supabase
        .from("evaluaciones")
        .select("*")
        .is("deleted_at", null)
        .order("fecha_aplicacion", { ascending: false });
      if (error) throw error;

      const ids = [...new Set((evals ?? []).map((e) => e.paciente_id))];
      const { data: pacientes } = await supabase
        .from("pacientes")
        .select("id, nombre, apellido_paterno, numero_expediente")
        .in("id", ids);
      const mapa = new Map((pacientes ?? []).map((p) => [p.id, p]));

      return (evals ?? []).map((e) => {
        const pac = mapa.get(e.paciente_id);
        return {
          ...e,
          paciente_nombre: pac ? `${pac.nombre} ${pac.apellido_paterno}` : "—",
          expediente: pac?.numero_expediente ?? "",
        };
      });
    },
  });
}

export function useEvaluacionesPaciente(pacienteId: string) {
  return useQuery({
    queryKey: evaluacionesKeys.paciente(pacienteId),
    enabled: Boolean(pacienteId),
    queryFn: async (): Promise<Evaluacion[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("evaluaciones")
        .select("*")
        .eq("paciente_id", pacienteId)
        .is("deleted_at", null)
        .order("fecha_aplicacion", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useEvaluacionDetalle(id: string | null) {
  return useQuery({
    queryKey: evaluacionesKeys.detalle(id ?? ""),
    enabled: Boolean(id),
    queryFn: async (): Promise<EvaluacionDetalle> => {
      const supabase = createClient();
      const { data: ev, error } = await supabase
        .from("evaluaciones")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      const { data: subpruebas } = await supabase
        .from("evaluacion_subpruebas")
        .select("*")
        .eq("evaluacion_id", id!);
      return { ...ev, subpruebas: subpruebas ?? [] };
    },
  });
}

export function useCrearEvaluacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EvaluacionInput): Promise<void> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("evaluaciones")
        .insert(aFila(input))
        .select("id")
        .single();
      if (error) throw error;
      await guardarSubpruebas(data.id, input.subpruebas);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: evaluacionesKeys.all }),
  });
}

export function useActualizarEvaluacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: EvaluacionInput;
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("evaluaciones")
        .update(aFila(input))
        .eq("id", id);
      if (error) throw error;
      await guardarSubpruebas(id, input.subpruebas);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: evaluacionesKeys.all }),
  });
}

export function useEliminarEvaluacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient();
      // Soft-delete: las evaluaciones nunca se borran físicamente.
      const { error } = await supabase
        .from("evaluaciones")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: evaluacionesKeys.all }),
  });
}
