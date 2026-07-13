"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { Json, Tables } from "@/types/database.types";

export type ReporteProgreso = Tables<"reportes_progreso">;

/** Forma de cada objetivo dentro de objetivos_snapshot (jsonb). */
export interface ObjetivoSnapshot {
  descripcion: string;
  area: string;
  progreso: number;
  estatus: string;
}

export type ReporteListItem = ReporteProgreso & {
  paciente_nombre: string;
  expediente: string;
};

export const reportesProgresoKeys = {
  all: ["reportes-progreso"] as const,
  lista: () => [...reportesProgresoKeys.all, "lista"] as const,
  detalle: (id: string) => [...reportesProgresoKeys.all, "detalle", id] as const,
};

export function useReportesProgreso() {
  return useQuery({
    queryKey: reportesProgresoKeys.lista(),
    queryFn: async (): Promise<ReporteListItem[]> => {
      const supabase = createClient();
      const { data: reportes, error } = await supabase
        .from("reportes_progreso")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!reportes || reportes.length === 0) return [];

      const ids = [...new Set(reportes.map((r) => r.paciente_id))];
      const { data: pacientes } = await supabase
        .from("pacientes")
        .select("id, nombre, apellido_paterno, apellido_materno, numero_expediente")
        .in("id", ids);
      const mapa = new Map((pacientes ?? []).map((p) => [p.id, p]));

      return reportes.map((r) => {
        const pac = mapa.get(r.paciente_id);
        return {
          ...r,
          paciente_nombre: pac
            ? `${pac.nombre} ${pac.apellido_paterno} ${pac.apellido_materno ?? ""}`.trim()
            : "Paciente",
          expediente: pac?.numero_expediente ?? "",
        };
      });
    },
  });
}

export function useReporteProgreso(id: string) {
  return useQuery({
    queryKey: reportesProgresoKeys.detalle(id),
    enabled: Boolean(id),
    queryFn: async (): Promise<ReporteListItem> => {
      const supabase = createClient();
      const { data: r, error } = await supabase
        .from("reportes_progreso")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;

      const { data: pac } = await supabase
        .from("pacientes")
        .select("nombre, apellido_paterno, apellido_materno, numero_expediente")
        .eq("id", r.paciente_id)
        .single();

      return {
        ...r,
        paciente_nombre: pac
          ? `${pac.nombre} ${pac.apellido_paterno} ${pac.apellido_materno ?? ""}`.trim()
          : "Paciente",
        expediente: pac?.numero_expediente ?? "",
      };
    },
  });
}

export interface CrearReporteInput {
  paciente_id: string;
  plan_id?: string | null;
  titulo: string;
  periodo_inicio?: string | null;
  periodo_fin?: string | null;
  resumen?: string | null;
  logros?: string | null;
  recomendaciones?: string | null;
}

export function useCrearReporte() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CrearReporteInput): Promise<string> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Snapshot de objetivos del plan (si se eligió uno).
      let snapshot: ObjetivoSnapshot[] = [];
      let psicologoId: string | null = user?.id ?? null;
      if (input.plan_id) {
        const { data: objetivos } = await supabase
          .from("objetivos_intervencion")
          .select("descripcion, area, progreso, estatus")
          .eq("plan_id", input.plan_id)
          .order("orden", { ascending: true });
        snapshot = (objetivos ?? []) as ObjetivoSnapshot[];
        const { data: plan } = await supabase
          .from("planes_intervencion")
          .select("psicologo_id")
          .eq("id", input.plan_id)
          .single();
        if (plan?.psicologo_id) psicologoId = plan.psicologo_id;
      }

      const { data, error } = await supabase
        .from("reportes_progreso")
        .insert({
          paciente_id: input.paciente_id,
          plan_id: input.plan_id || null,
          psicologo_id: psicologoId,
          titulo: input.titulo,
          periodo_inicio: input.periodo_inicio || null,
          periodo_fin: input.periodo_fin || null,
          resumen: input.resumen || null,
          logros: input.logros || null,
          recomendaciones: input.recomendaciones || null,
          objetivos_snapshot: snapshot as unknown as Json,
          created_by: user?.id ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: reportesProgresoKeys.lista() }),
  });
}

export interface EditarReporteInput {
  titulo: string;
  periodo_inicio?: string | null;
  periodo_fin?: string | null;
  resumen?: string | null;
  logros?: string | null;
  recomendaciones?: string | null;
}

export function useActualizarReporte(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EditarReporteInput): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("reportes_progreso")
        .update({
          titulo: input.titulo,
          periodo_inicio: input.periodo_inicio || null,
          periodo_fin: input.periodo_fin || null,
          resumen: input.resumen || null,
          logros: input.logros || null,
          recomendaciones: input.recomendaciones || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: reportesProgresoKeys.lista() });
      void qc.invalidateQueries({ queryKey: reportesProgresoKeys.detalle(id) });
    },
  });
}

export function useToggleCompartirReporte() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      compartido,
    }: {
      id: string;
      compartido: boolean;
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("reportes_progreso")
        .update({ compartido })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: reportesProgresoKeys.lista() });
      void qc.invalidateQueries({
        queryKey: reportesProgresoKeys.detalle(v.id),
      });
    },
  });
}

export function useEliminarReporte() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("reportes_progreso")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: reportesProgresoKeys.lista() }),
  });
}
