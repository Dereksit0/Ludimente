"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

export interface Terapeuta {
  id: string;
  full_name: string;
  avatar_url: string | null;
  color_agenda: string;
  role: string;
  especialidad: string | null;
  cupo_maximo: number;
  pacientes_activos: number;
  citas_mes: number;
}

export const terapeutasKeys = {
  all: ["terapeutas"] as const,
  lista: () => [...terapeutasKeys.all, "lista"] as const,
};

export function useTerapeutas() {
  return useQuery({
    queryKey: terapeutasKeys.lista(),
    queryFn: async (): Promise<Terapeuta[]> => {
      const supabase = createClient();
      const { data: perfiles, error } = await supabase
        .from("profiles")
        .select(
          "id, full_name, avatar_url, color_agenda, role, especialidad, cupo_maximo, activo",
        )
        .in("role", ["psicologo", "admin"])
        .eq("activo", true)
        .order("full_name");
      if (error) throw error;

      const { data: pacientes } = await supabase
        .from("pacientes")
        .select("psicologo_asignado_id, estatus");

      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);
      const { data: citas } = await supabase
        .from("citas")
        .select("psicologo_id, fecha_inicio")
        .gte("fecha_inicio", inicioMes.toISOString());

      const activosPorPsi = new Map<string, number>();
      const inactivos = new Set(["alta", "inactivo"]);
      for (const p of pacientes ?? []) {
        if (!p.psicologo_asignado_id || inactivos.has(p.estatus)) continue;
        activosPorPsi.set(
          p.psicologo_asignado_id,
          (activosPorPsi.get(p.psicologo_asignado_id) ?? 0) + 1,
        );
      }
      const citasPorPsi = new Map<string, number>();
      for (const c of citas ?? []) {
        citasPorPsi.set(c.psicologo_id, (citasPorPsi.get(c.psicologo_id) ?? 0) + 1);
      }

      return (perfiles ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        color_agenda: p.color_agenda,
        role: p.role,
        especialidad: p.especialidad,
        cupo_maximo: p.cupo_maximo ?? 20,
        pacientes_activos: activosPorPsi.get(p.id) ?? 0,
        citas_mes: citasPorPsi.get(p.id) ?? 0,
      }));
    },
  });
}

export function useActualizarTerapeuta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      especialidad,
      cupo_maximo,
    }: {
      id: string;
      especialidad: string | null;
      cupo_maximo: number;
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ especialidad, cupo_maximo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: terapeutasKeys.lista() }),
  });
}

/** Pacientes con su terapeuta asignado (para reasignar). */
export interface PacienteAsignacion {
  id: string;
  nombre: string;
  expediente: string;
  estatus: string;
  psicologo_asignado_id: string | null;
}

export function usePacientesAsignacion() {
  return useQuery({
    queryKey: ["terapeutas", "asignaciones"],
    queryFn: async (): Promise<PacienteAsignacion[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("pacientes")
        .select(
          "id, nombre, apellido_paterno, apellido_materno, numero_expediente, estatus, psicologo_asignado_id",
        )
        .order("nombre");
      if (error) throw error;
      return (data ?? []).map((p) => ({
        id: p.id,
        nombre: `${p.nombre} ${p.apellido_paterno} ${p.apellido_materno ?? ""}`.trim(),
        expediente: p.numero_expediente,
        estatus: p.estatus,
        psicologo_asignado_id: p.psicologo_asignado_id,
      }));
    },
  });
}

export function useReasignarPaciente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      pacienteId,
      psicologoId,
    }: {
      pacienteId: string;
      psicologoId: string | null;
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("pacientes")
        .update({ psicologo_asignado_id: psicologoId })
        .eq("id", pacienteId);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["terapeutas"] });
      void qc.invalidateQueries({ queryKey: ["pacientes"] });
    },
  });
}
