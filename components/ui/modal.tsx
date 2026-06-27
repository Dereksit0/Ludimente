"use client";

import { useEffect } from "react";

import { X } from "lucide-react";

import { cn } from "@/lib/utils";

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo?: string;
  className?: string;
  children: React.ReactNode;
}

/** Modal ligero con overlay, cierre por Escape y bloqueo de scroll. */
export function Modal({ abierto, onCerrar, titulo, className, children }: ModalProps) {
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <div
        className="absolute inset-0 bg-luda-gris/40 backdrop-blur-sm"
        onClick={onCerrar}
      />
      <div
        className={cn(
          "relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-luda-lila/15 bg-white p-6 shadow-luda-md",
          className,
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          {titulo && (
            <h2 className="font-fredoka text-xl text-luda-gris">{titulo}</h2>
          )}
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="ml-auto rounded-lg p-1.5 text-luda-gris-light hover:bg-luda-lila-light"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
