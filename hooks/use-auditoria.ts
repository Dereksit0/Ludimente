"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

export interface EventoAuditoria {
  id: string;
  tabla: string;
  registro_id: string;
  accion: string;
  usuario_id: string | null;
  usuario_nombre: string;
  created_at: string;
}

export interface FiltrosAuditoria {
  tabla?: string;
  usuarioId?: string;
}

/** Bitácora de auditoría (solo admin por RLS). Últimos 100 eventos. */
export function useAuditoria(filtros: FiltrosAuditoria = {}) {
  return useQuery({
    queryKey: ["auditoria", filtros.tabla ?? "", filtros.usuarioId ?? ""],
    queryFn: async (): Promise<EventoAuditoria[]> => {
      const supabase = createClient();
      let q = supabase
        .from("audit_log")
        .select("id, tabla, registro_id, accion, usuario_id, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (filtros.tabla) q = q.eq("tabla", filtros.tabla);
      if (filtros.usuarioId) q = q.eq("usuario_id", filtros.usuarioId);

      const { data, error } = await q;
      if (error) throw error;

      const ids = [
        ...new Set((data ?? []).map((e) => e.usuario_id).filter(Boolean)),
      ] as string[];
      const { data: perfiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", ids);
      const mapa = new Map((perfiles ?? []).map((p) => [p.id, p.full_name]));

      return (data ?? []).map((e) => ({
        ...e,
        usuario_nombre: e.usuario_id
          ? (mapa.get(e.usuario_id) ?? "Usuario")
          : "Sistema",
      }));
    },
  });
}
