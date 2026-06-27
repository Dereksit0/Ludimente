"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { Perfil } from "@/types/app.types";

export type PsicologoOpcion = Pick<
  Perfil,
  "id" | "full_name" | "avatar_url" | "color_agenda"
>;

/** Psicólogos (y admins) activos para asignación de pacientes. */
export function usePsicologos() {
  return useQuery({
    queryKey: ["perfiles", "psicologos"],
    queryFn: async (): Promise<PsicologoOpcion[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, color_agenda")
        .in("role", ["psicologo", "admin"])
        .eq("activo", true)
        .order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });
}
