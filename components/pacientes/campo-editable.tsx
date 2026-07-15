"use client";

import { useState } from "react";

import { Check, Loader2, Pencil, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { RedactarBoton } from "@/components/ui/redactar-boton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface CampoEditableProps {
  label: string;
  valor: string | null;
  onGuardar: (nuevo: string) => Promise<void>;
  tipo?: "text" | "textarea" | "date";
  placeholder?: string;
  className?: string;
  /** Cuando es true, se muestra el valor sin la opción de editar (sin permiso). */
  soloLectura?: boolean;
}

/** Campo con edición in-place: click en el lápiz → editar → guardar. */
export function CampoEditable({
  label,
  valor,
  onGuardar,
  tipo = "text",
  placeholder = "Sin información",
  className,
  soloLectura = false,
}: CampoEditableProps) {
  const [editando, setEditando] = useState(false);
  const [local, setLocal] = useState(valor ?? "");
  const [guardando, setGuardando] = useState(false);

  if (soloLectura) {
    return (
      <div className={cn(className)}>
        <p className="text-xs font-semibold uppercase tracking-wide text-luda-gris-light">
          {label}
        </p>
        <p
          className={cn(
            "mt-0.5 whitespace-pre-wrap text-sm",
            valor ? "text-luda-gris" : "italic text-luda-gris-light",
          )}
        >
          {valor || placeholder}
        </p>
      </div>
    );
  }

  async function guardar() {
    setGuardando(true);
    try {
      await onGuardar(local.trim());
      setEditando(false);
    } finally {
      setGuardando(false);
    }
  }

  function cancelar() {
    setLocal(valor ?? "");
    setEditando(false);
  }

  return (
    <div className={cn("group", className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-luda-gris-light">
        {label}
      </p>

      {editando ? (
        <div className="mt-1 space-y-2">
          {tipo === "textarea" ? (
            <>
              <Textarea value={local} onChange={(e) => setLocal(e.target.value)} autoFocus />
              <RedactarBoton valor={local} contexto={label} onRedactado={setLocal} />
            </>
          ) : (
            <Input
              type={tipo}
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              autoFocus
            />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="inline-flex items-center gap-1 rounded-lg bg-luda-lila px-2.5 py-1 text-xs font-semibold text-white hover:bg-luda-lila-dark disabled:opacity-50"
            >
              {guardando ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Guardar
            </button>
            <button
              type="button"
              onClick={cancelar}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-luda-gris-light hover:bg-luda-lila-light"
            >
              <X className="h-3.5 w-3.5" /> Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="mt-0.5 flex w-full items-start justify-between gap-2 rounded-lg py-0.5 text-left"
        >
          <span
            className={cn(
              "whitespace-pre-wrap text-sm",
              valor ? "text-luda-gris" : "italic text-luda-gris-light",
            )}
          >
            {valor || placeholder}
          </span>
          <Pencil className="mt-0.5 h-3.5 w-3.5 shrink-0 text-luda-gris-light opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      )}
    </div>
  );
}
