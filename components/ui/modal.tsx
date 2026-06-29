"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
  const panelRef = useRef<HTMLDivElement>(null);
  // El modal se monta vía portal en <body> para escapar de contenedores con
  // backdrop-filter (header/bottom-nav), que rompen el position: fixed.
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    if (!abierto) return;
    const panel = panelRef.current;
    const previo = document.activeElement as HTMLElement | null;

    const enfocables = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

    // Enfocar el primer elemento del modal al abrir.
    enfocables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCerrar();
        return;
      }
      if (e.key === "Tab") {
        const els = enfocables();
        if (els.length === 0) return;
        const primero = els[0];
        const ultimo = els[els.length - 1];
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primero.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previo?.focus?.();
    };
  }, [abierto, onCerrar]);

  if (!abierto || !montado) return null;

  return createPortal(
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
        ref={panelRef}
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
    </div>,
    document.body,
  );
}
