"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { NuevoPacienteInput } from "@/lib/validations/paciente.schema";
import type { Paciente, Perfil, Tutor } from "@/types/app.types";
import type { Json, TablesUpdate } from "@/types/database.types";

export const pacientesKeys = {
  all: ["pacientes"] as const,
  lista: () => [...pacientesKeys.all, "lista"] as const,
  detalle: (id: string) => [...pacientesKeys.all, "detalle", id] as const,
};

type PsicologoMini = Pick<
  Perfil,
  "id" | "full_name" | "avatar_url" | "color_agenda"
>;

export type PacienteListItem = Paciente & { psicologo: PsicologoMini | null };
export type PacienteDetalle = Paciente & {
  psicologo: PsicologoMini | null;
  tutores: Tutor[];
};

/** Listado de pacientes con su psicólogo asignado resuelto. */
export function usePacientes() {
  return useQuery({
    queryKey: pacientesKeys.lista(),
    queryFn: async (): Promise<PacienteListItem[]> => {
      const supabase = createClient();
      const { data: pacientes, error } = await supabase
        .from("pacientes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const { data: perfiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, color_agenda");
      const mapa = new Map((perfiles ?? []).map((p) => [p.id, p]));

      return (pacientes ?? []).map((p) => ({
        ...p,
        psicologo: p.psicologo_asignado_id
          ? (mapa.get(p.psicologo_asignado_id) ?? null)
          : null,
      }));
    },
  });
}

/** Expediente de un paciente con tutores y psicólogo. */
export function usePaciente(id: string) {
  return useQuery({
    queryKey: pacientesKeys.detalle(id),
    enabled: Boolean(id),
    queryFn: async (): Promise<PacienteDetalle> => {
      const supabase = createClient();
      const { data: paciente, error } = await supabase
        .from("pacientes")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;

      // Auditoría de acceso al expediente (fire-and-forget).
      void supabase.rpc("registrar_vista_expediente", { p_paciente_id: id });

      const { data: tutores } = await supabase
        .from("tutores")
        .select("*")
        .eq("paciente_id", id)
        .order("es_contacto_principal", { ascending: false });

      let psicologo: PsicologoMini | null = null;
      if (paciente.psicologo_asignado_id) {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, color_agenda")
          .eq("id", paciente.psicologo_asignado_id)
          .single();
        psicologo = data ?? null;
      }

      return { ...paciente, tutores: tutores ?? [], psicologo };
    },
  });
}

/** Alta de paciente + tutores (transaccional vía RPC). Devuelve el id. */
export function useCrearPaciente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NuevoPacienteInput): Promise<string> => {
      const supabase = createClient();
      const { tutores, ...paciente } = input;
      const { data, error } = await supabase.rpc("crear_paciente_con_tutores", {
        p_paciente: paciente as unknown as Json,
        p_tutores: tutores as unknown as Json,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: pacientesKeys.lista() });
    },
  });
}

/** Actualiza campos del paciente (edición in-place en el expediente). */
export function useActualizarPaciente(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cambios: TablesUpdate<"pacientes">): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("pacientes")
        .update(cambios)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: pacientesKeys.detalle(id) });
      void qc.invalidateQueries({ queryKey: pacientesKeys.lista() });
    },
  });
}
