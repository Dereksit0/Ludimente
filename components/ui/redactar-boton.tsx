"use client";

import { useState } from "react";

import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { redactarTextoAction } from "@/lib/ai/redactar-actions";

/** Botón que reescribe el texto de un campo de forma profesional usando IA. */
export function RedactarBoton({
  valor,
  contexto,
  onRedactado,
}: {
  valor: string;
  contexto?: string;
  onRedactado: (texto: string) => void;
}) {
  const [cargando, setCargando] = useState(false);

  async function redactar() {
    if (!valor || valor.trim().length < 3) {
      toast.error("Escribe algo primero para poder redactarlo.");
      return;
    }
    setCargando(true);
    const res = await redactarTextoAction(valor, contexto);
    setCargando(false);
    if (res.ok) {
      onRedactado(res.texto);
      toast.success("Texto redactado");
    } else {
      toast.error(res.error);
    }
  }

  return (
    <button
      type="button"
      onClick={redactar}
      disabled={cargando}
      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-luda-lila-dark hover:underline disabled:cursor-not-allowed disabled:opacity-50"
    >
      {cargando ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Sparkles className="h-3 w-3" />
      )}
      Redactar profesionalmente
    </button>
  );
}
