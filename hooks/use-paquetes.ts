"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database.types";

export type Paquete = Tables<"paquetes">;
export type PaquetePaciente = Tables<"paquetes_paciente"> & {
  abonado: number;
  saldo: number;
};

export const paquetesKeys = {
  catalogo: ["paquetes", "catalogo"] as const,
  paciente: (id: string) => ["paquetes", "paciente", id] as const,
};

// ── Catálogo ──
export function useCatalogoPaquetes(soloActivos = true) {
  return useQuery({
    queryKey: [...paquetesKeys.catalogo, soloActivos],
    queryFn: async (): Promise<Paquete[]> => {
      const supabase = createClient();
      let q = supabase.from("paquetes").select("*").order("nombre");
      if (soloActivos) q = q.eq("activo", true);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCrearPaquete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      nombre: string;
      num_sesiones: number;
      precio: number;
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase.from("paquetes").insert(input);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["paquetes"] }),
  });
}

export function useEliminarPaquete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient();
      // Baja lógica para no afectar asignaciones históricas.
      const { error } = await supabase
        .from("paquetes")
        .update({ activo: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["paquetes"] }),
  });
}

// ── Paquetes asignados a un paciente ──
export function usePaquetesPaciente(pacienteId: string) {
  return useQuery({
    queryKey: paquetesKeys.paciente(pacienteId),
    enabled: Boolean(pacienteId),
    queryFn: async (): Promise<PaquetePaciente[]> => {
      const supabase = createClient();
      const { data: asignados, error } = await supabase
        .from("paquetes_paciente")
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const ids = (asignados ?? []).map((a) => a.id);
      const { data: abonos } = ids.length
        ? await supabase
            .from("abonos")
            .select("paquete_paciente_id, monto")
            .in("paquete_paciente_id", ids)
        : { data: [] as { paquete_paciente_id: string; monto: number }[] };

      const abonadoPor = new Map<string, number>();
      for (const ab of abonos ?? []) {
        abonadoPor.set(
          ab.paquete_paciente_id,
          (abonadoPor.get(ab.paquete_paciente_id) ?? 0) + Number(ab.monto),
        );
      }

      return (asignados ?? []).map((a) => {
        const abonado = abonadoPor.get(a.id) ?? 0;
        return {
          ...a,
          abonado,
          saldo: Number(a.precio_total) - abonado,
        };
      });
    },
  });
}

export function useAsignarPaquete(pacienteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (paquete: Paquete): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase.from("paquetes_paciente").insert({
        paciente_id: pacienteId,
        paquete_id: paquete.id,
        nombre: paquete.nombre,
        sesiones_totales: paquete.num_sesiones,
        precio_total: paquete.precio,
      });
      if (error) throw error;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: paquetesKeys.paciente(pacienteId) }),
  });
}

export function useUsarSesion(pacienteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pp: PaquetePaciente): Promise<void> => {
      if (pp.sesiones_usadas >= pp.sesiones_totales) {
        throw new Error("El paquete ya no tiene sesiones disponibles.");
      }
      const supabase = createClient();
      const { error } = await supabase
        .from("paquetes_paciente")
        .update({ sesiones_usadas: pp.sesiones_usadas + 1 })
        .eq("id", pp.id);
      if (error) throw error;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: paquetesKeys.paciente(pacienteId) }),
  });
}

export function useRegistrarAbono(pacienteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      paquete_paciente_id: string;
      monto: number;
      metodo_pago: string;
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase.from("abonos").insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: paquetesKeys.paciente(pacienteId) });
      void qc.invalidateQueries({ queryKey: ["cobranza"] });
    },
  });
}
