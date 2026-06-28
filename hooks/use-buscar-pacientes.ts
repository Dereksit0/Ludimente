"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { EstatusPaciente } from "@/types/database.types";

export interface ResultadoPaciente {
  id: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  numero_expediente: string;
  estatus: EstatusPaciente;
}

/** Busca pacientes por nombre, apellidos o número de expediente (respeta RLS). */
export function useBuscarPacientes(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ["buscar-pacientes", q],
    enabled: q.length >= 2,
    queryFn: async (): Promise<ResultadoPaciente[]> => {
      const supabase = createClient();
      const patron = `%${q}%`;
      const { data, error } = await supabase
        .from("pacientes")
        .select(
          "id, nombre, apellido_paterno, apellido_materno, numero_expediente, estatus",
        )
        .or(
          `nombre.ilike.${patron},apellido_paterno.ilike.${patron},apellido_materno.ilike.${patron},numero_expediente.ilike.${patron}`,
        )
        .order("nombre")
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });
}
