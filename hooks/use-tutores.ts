"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { TutorInput } from "@/lib/validations/paciente.schema";
import type { Tutor } from "@/types/app.types";

import { pacientesKeys, type PacienteDetalle } from "./use-pacientes";

/** Inserta un tutor en el expediente. */
export function useCrearTutor(pacienteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TutorInput): Promise<Tutor> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tutores")
        .insert({ ...input, paciente_id: pacienteId })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: pacientesKeys.detalle(pacienteId),
      });
    },
  });
}

/** Actualiza un tutor existente. */
export function useActualizarTutor(pacienteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      cambios,
    }: {
      id: string;
      cambios: Partial<TutorInput>;
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("tutores")
        .update(cambios)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: pacientesKeys.detalle(pacienteId),
      });
    },
  });
}

/** Elimina un tutor con actualización optimista del expediente. */
export function useEliminarTutor(pacienteId: string) {
  const qc = useQueryClient();
  const key = pacientesKeys.detalle(pacienteId);

  return useMutation({
    mutationFn: async (tutorId: string): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase.from("tutores").delete().eq("id", tutorId);
      if (error) throw error;
    },
    onMutate: async (tutorId): Promise<{ previo?: PacienteDetalle }> => {
      await qc.cancelQueries({ queryKey: key });
      const previo = qc.getQueryData<PacienteDetalle>(key);
      if (previo) {
        qc.setQueryData<PacienteDetalle>(key, {
          ...previo,
          tutores: previo.tutores.filter((t) => t.id !== tutorId),
        });
      }
      return { previo };
    },
    onError: (_err, _tutorId, context) => {
      if (context?.previo) qc.setQueryData(key, context.previo);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: key });
    },
  });
}
