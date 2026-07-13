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

/** Extrae el storage path de una URL pública generada por `urlPublica`, o null si no aplica. */
export function pathDeUrlPublica(bucket: string, url: string | null): string | null {
  if (!url) return null;
  const marcador = `/object/public/${bucket}/`;
  const i = url.indexOf(marcador);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marcador.length));
}

/** Borra un objeto del bucket (ignora errores: el archivo puede ya no existir). */
export async function borrarArchivo(bucket: string, path: string): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from(bucket).remove([path]);
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
