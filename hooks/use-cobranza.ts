"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { EstatusPago, Tables } from "@/types/database.types";

export type PagoCobranza = Tables<"pagos"> & {
  paciente_nombre: string;
  expediente: string;
};

const KEY = ["cobranza"] as const;

export function useCobranza() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<PagoCobranza[]> => {
      const supabase = createClient();
      const { data: pagos, error } = await supabase
        .from("pagos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const ids = [...new Set((pagos ?? []).map((p) => p.paciente_id))];
      const { data: pacientes } = await supabase
        .from("pacientes")
        .select("id, nombre, apellido_paterno, numero_expediente")
        .in("id", ids);
      const mapa = new Map((pacientes ?? []).map((p) => [p.id, p]));

      return (pagos ?? []).map((p) => {
        const pac = mapa.get(p.paciente_id);
        return {
          ...p,
          paciente_nombre: pac
            ? `${pac.nombre} ${pac.apellido_paterno}`
            : "—",
          expediente: pac?.numero_expediente ?? "",
        };
      });
    },
  });
}

export function useMarcarPago() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      estatus,
    }: {
      id: string;
      estatus: EstatusPago;
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("pagos")
        .update({
          estatus,
          fecha_pago: estatus === "pagado" ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: KEY });
      void qc.invalidateQueries({ queryKey: ["pagos"] });
      void qc.invalidateQueries({ queryKey: ["reportes"] });
    },
  });
}
