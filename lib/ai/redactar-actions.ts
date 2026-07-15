"use server";

import { redactarProfesionalmente } from "@/lib/ai/redactar-texto";
import { createClient } from "@/lib/supabase/server";

async function requiereUsuarioAutenticado() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autorizado");
}

export type ResultadoRedaccion =
  | { ok: true; texto: string }
  | { ok: false; error: string };

export async function redactarTextoAction(
  texto: string,
  contexto?: string,
): Promise<ResultadoRedaccion> {
  try {
    await requiereUsuarioAutenticado();

    if (!texto || texto.trim().length < 3) {
      return { ok: false, error: "Escribe algo primero para poder redactarlo." };
    }

    const redactado = await redactarProfesionalmente(texto, contexto);
    return { ok: true, texto: redactado };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "No se pudo redactar el texto.",
    };
  }
}
