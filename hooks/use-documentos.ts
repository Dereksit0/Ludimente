"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { BUCKET_DOCUMENTOS, subirArchivo, urlFirmada } from "@/lib/storage";
import type { Tables, TipoDocumento } from "@/types/database.types";

export type Documento = Tables<"documentos">;

export const documentosKeys = {
  all: ["documentos"] as const,
  paciente: (id: string) => [...documentosKeys.all, "paciente", id] as const,
};

export interface NuevoDocumento {
  archivo: File;
  nombre_display: string;
  tipo: TipoDocumento;
  visible_portal_padres: boolean;
}

/** Limpia el nombre para usarlo como ruta segura en el bucket. */
function rutaSegura(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

export function useDocumentosPaciente(pacienteId: string) {
  return useQuery({
    queryKey: documentosKeys.paciente(pacienteId),
    enabled: Boolean(pacienteId),
    queryFn: async (): Promise<Documento[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("documentos")
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSubirDocumento(pacienteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: NuevoDocumento): Promise<void> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const path = `${pacienteId}/${Date.now()}-${rutaSegura(doc.archivo.name)}`;
      const storagePath = await subirArchivo(BUCKET_DOCUMENTOS, path, doc.archivo);

      const { error } = await supabase.from("documentos").insert({
        paciente_id: pacienteId,
        nombre_display: doc.nombre_display || doc.archivo.name,
        nombre_archivo: doc.archivo.name,
        tipo: doc.tipo,
        storage_path: storagePath,
        mime_type: doc.archivo.type || null,
        tamanio_bytes: doc.archivo.size,
        visible_portal_padres: doc.visible_portal_padres,
        subido_por: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: documentosKeys.paciente(pacienteId) }),
  });
}

export function useEliminarDocumento(pacienteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: Documento): Promise<void> => {
      const supabase = createClient();
      // Quitar el archivo del bucket (best-effort) y luego el registro.
      await supabase.storage.from(BUCKET_DOCUMENTOS).remove([doc.storage_path]);
      const { error } = await supabase
        .from("documentos")
        .delete()
        .eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: documentosKeys.paciente(pacienteId) }),
  });
}

/** Abre el documento en una pestaña nueva mediante URL firmada temporal. */
export async function abrirDocumento(doc: Documento): Promise<string | null> {
  return urlFirmada(BUCKET_DOCUMENTOS, doc.storage_path);
}
