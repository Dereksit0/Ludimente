import { createClient } from "@/lib/supabase/client";

export const BUCKET_FOTOS = "pacientes-fotos";
export const BUCKET_DOCUMENTOS = "documentos";
export const BUCKET_RECURSOS = "recursos";

/** URL pública de un objeto en un bucket público (ej. biblioteca). */
export function urlPublica(bucket: string, path: string): string {
  const supabase = createClient();
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** Sube un archivo y devuelve su ruta (storage path) dentro del bucket. */
export async function subirArchivo(
  bucket: string,
  path: string,
  file: File,
): Promise<string> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}

/** Genera una URL firmada temporal (por defecto 1 hora) para un objeto privado. */
export async function urlFirmada(
  bucket: string,
  path: string,
  expiraSegundos = 3600,
): Promise<string | null> {
  if (!path) return null;
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiraSegundos);
  if (error) return null;
  return data.signedUrl;
}
