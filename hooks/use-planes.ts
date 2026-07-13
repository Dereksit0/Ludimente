"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";

export type Plan = Tables<"planes_intervencion">;
export type Objetivo = Tables<"objetivos_intervencion">;
export type Seguimiento = Tables<"objetivo_seguimientos">;

/** Plan en el listado, con datos del paciente y avance calculado. */
export type PlanListItem = Plan & {
  paciente_nombre: string;
  expediente: string;
  psicologo_nombre: string | null;
  total_objetivos: number;
  avance: number;
};

/** Objetivo con su historial de seguimientos. */
export type ObjetivoConSeguimientos = Objetivo & {
  seguimientos: Seguimiento[];
};

export type PlanDetalle = Plan & {
  paciente_nombre: string;
  expediente: string;
  psicologo_nombre: string | null;
  objetivos: ObjetivoConSeguimientos[];
};

export const planesKeys = {
  all: ["planes"] as const,
  lista: () => [...planesKeys.all, "lista"] as const,
  detalle: (id: string) => [...planesKeys.all, "detalle", id] as const,
  paciente: (id: string) => [...planesKeys.all, "paciente", id] as const,
};

function promedioAvance(objetivos: Pick<Objetivo, "progreso">[]): number {
  if (objetivos.length === 0) return 0;
  const suma = objetivos.reduce((acc, o) => acc + (o.progreso ?? 0), 0);
  return Math.round(suma / objetivos.length);
}

/** Listado de planes con paciente, psicólogo y % de avance. */
export function usePlanes() {
  return useQuery({
    queryKey: planesKeys.lista(),
    queryFn: async (): Promise<PlanListItem[]> => {
      const supabase = createClient();
      const { data: planes, error } = await supabase
        .from("planes_intervencion")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!planes || planes.length === 0) return [];

      const pacienteIds = [...new Set(planes.map((p) => p.paciente_id))];
      const psicologoIds = [
        ...new Set(planes.map((p) => p.psicologo_id).filter(Boolean)),
      ] as string[];
      const planIds = planes.map((p) => p.id);

      const [{ data: pacientes }, { data: perfiles }, { data: objetivos }] =
        await Promise.all([
          supabase
            .from("pacientes")
            .select("id, nombre, apellido_paterno, apellido_materno, numero_expediente")
            .in("id", pacienteIds),
          psicologoIds.length
            ? supabase.from("profiles").select("id, full_name").in("id", psicologoIds)
            : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
          supabase
            .from("objetivos_intervencion")
            .select("plan_id, progreso")
            .in("plan_id", planIds),
        ]);

      const mapaPac = new Map((pacientes ?? []).map((p) => [p.id, p]));
      const mapaPsi = new Map((perfiles ?? []).map((p) => [p.id, p.full_name]));
      const objsPorPlan = new Map<string, { progreso: number }[]>();
      for (const o of objetivos ?? []) {
        const arr = objsPorPlan.get(o.plan_id) ?? [];
        arr.push({ progreso: o.progreso });
        objsPorPlan.set(o.plan_id, arr);
      }

      return planes.map((plan) => {
        const pac = mapaPac.get(plan.paciente_id);
        const objs = objsPorPlan.get(plan.id) ?? [];
        const nombre = pac
          ? `${pac.nombre} ${pac.apellido_paterno} ${pac.apellido_materno ?? ""}`.trim()
          : "Paciente";
        return {
          ...plan,
          paciente_nombre: nombre,
          expediente: pac?.numero_expediente ?? "",
          psicologo_nombre: plan.psicologo_id
            ? (mapaPsi.get(plan.psicologo_id) ?? null)
            : null,
          total_objetivos: objs.length,
          avance: promedioAvance(objs),
        };
      });
    },
  });
}

/** Detalle de un plan con objetivos y seguimientos. */
export function usePlan(id: string) {
  return useQuery({
    queryKey: planesKeys.detalle(id),
    enabled: Boolean(id),
    queryFn: async (): Promise<PlanDetalle> => {
      const supabase = createClient();
      const { data: plan, error } = await supabase
        .from("planes_intervencion")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;

      const { data: pac } = await supabase
        .from("pacientes")
        .select("nombre, apellido_paterno, apellido_materno, numero_expediente")
        .eq("id", plan.paciente_id)
        .single();

      let psicologo_nombre: string | null = null;
      if (plan.psicologo_id) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", plan.psicologo_id)
          .single();
        psicologo_nombre = data?.full_name ?? null;
      }

      const { data: objetivos } = await supabase
        .from("objetivos_intervencion")
        .select("*")
        .eq("plan_id", id)
        .order("orden", { ascending: true })
        .order("created_at", { ascending: true });

      const objIds = (objetivos ?? []).map((o) => o.id);
      const { data: seguimientos } = objIds.length
        ? await supabase
            .from("objetivo_seguimientos")
            .select("*")
            .in("objetivo_id", objIds)
            .order("fecha", { ascending: true })
        : { data: [] as Seguimiento[] };

      const segPorObj = new Map<string, Seguimiento[]>();
      for (const s of seguimientos ?? []) {
        const arr = segPorObj.get(s.objetivo_id) ?? [];
        arr.push(s);
        segPorObj.set(s.objetivo_id, arr);
      }

      return {
        ...plan,
        paciente_nombre: pac
          ? `${pac.nombre} ${pac.apellido_paterno} ${pac.apellido_materno ?? ""}`.trim()
          : "Paciente",
        expediente: pac?.numero_expediente ?? "",
        psicologo_nombre,
        objetivos: (objetivos ?? []).map((o) => ({
          ...o,
          seguimientos: segPorObj.get(o.id) ?? [],
        })),
      };
    },
  });
}

export function useCrearPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: TablesInsert<"planes_intervencion">,
    ): Promise<string> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("planes_intervencion")
        .insert({ ...input, created_by: user?.id ?? null })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: planesKeys.lista() }),
  });
}

export function useActualizarPlan(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      cambios: TablesUpdate<"planes_intervencion">,
    ): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("planes_intervencion")
        .update(cambios)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: planesKeys.detalle(id) });
      void qc.invalidateQueries({ queryKey: planesKeys.lista() });
    },
  });
}

export function useEliminarPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("planes_intervencion")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: planesKeys.lista() }),
  });
}

export function useCrearObjetivo(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Omit<TablesInsert<"objetivos_intervencion">, "plan_id">,
    ): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("objetivos_intervencion")
        .insert({ ...input, plan_id: planId });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: planesKeys.detalle(planId) });
      void qc.invalidateQueries({ queryKey: planesKeys.lista() });
    },
  });
}

export function useActualizarObjetivo(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      cambios,
    }: {
      id: string;
      cambios: TablesUpdate<"objetivos_intervencion">;
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("objetivos_intervencion")
        .update(cambios)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: planesKeys.detalle(planId) });
      void qc.invalidateQueries({ queryKey: planesKeys.lista() });
    },
  });
}

export function useEliminarObjetivo(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("objetivos_intervencion")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: planesKeys.detalle(planId) });
      void qc.invalidateQueries({ queryKey: planesKeys.lista() });
    },
  });
}

/** Elimina un avance registrado por error (no toca el % actual del objetivo). */
export function useEliminarSeguimiento(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from("objetivo_seguimientos")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: planesKeys.detalle(planId) });
    },
  });
}

/** Registra un avance y sincroniza el % del objetivo. */
export function useRegistrarSeguimiento(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      objetivoId,
      progreso,
      nota,
    }: {
      objetivoId: string;
      progreso: number;
      nota?: string;
    }): Promise<void> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase.from("objetivo_seguimientos").insert({
        objetivo_id: objetivoId,
        progreso,
        nota: nota?.trim() || null,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
      // El % del objetivo refleja el último avance. Un avance de 0% no debe
      // reabrir un objetivo que el terapeuta ya cerró a mano (p. ej. como
      // "no logrado"): solo movemos el estatus cuando hay progreso real.
      const cambios: { progreso: number; estatus?: "logrado" | "en_progreso" } = {
        progreso,
      };
      if (progreso >= 100) cambios.estatus = "logrado";
      else if (progreso > 0) cambios.estatus = "en_progreso";
      const { error: e2 } = await supabase
        .from("objetivos_intervencion")
        .update(cambios)
        .eq("id", objetivoId);
      if (e2) throw e2;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: planesKeys.detalle(planId) });
      void qc.invalidateQueries({ queryKey: planesKeys.lista() });
    },
  });
}
