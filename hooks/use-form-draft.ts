"use client";

import { useEffect, useRef } from "react";

import type { FieldValues, UseFormReset, UseFormWatch } from "react-hook-form";
import { toast } from "sonner";

/**
 * Autoguarda en localStorage el contenido de un formulario mientras está
 * abierto, y lo restaura si el usuario cierra el modal sin guardar y vuelve
 * a abrirlo. Se persiste en cada cambio (sin debounce) para no perder texto
 * sin importar por dónde se cierre el modal (overlay, X o Escape).
 */
export function useFormDraft<T extends FieldValues>({
  clave,
  activo,
  watch,
  reset,
}: {
  clave: string;
  activo: boolean;
  watch: UseFormWatch<T>;
  reset: UseFormReset<T>;
}) {
  const restaurado = useRef(false);

  useEffect(() => {
    if (!activo) {
      restaurado.current = false;
      return;
    }
    if (restaurado.current) return;
    restaurado.current = true;
    try {
      const crudo = localStorage.getItem(clave);
      if (!crudo) return;
      const borrador = JSON.parse(crudo);
      reset(borrador);
      toast.info("Recuperamos un borrador sin guardar", {
        action: {
          label: "Descartar",
          onClick: () => {
            try {
              localStorage.removeItem(clave);
            } catch {
              // localStorage no disponible, nada que hacer.
            }
          },
        },
      });
    } catch {
      // Borrador corrupto: se ignora silenciosamente.
    }
  }, [activo, clave, reset]);

  useEffect(() => {
    if (!activo) return;
    const sub = watch((valores) => {
      try {
        localStorage.setItem(clave, JSON.stringify(valores));
      } catch {
        // localStorage lleno o no disponible: se omite el autoguardado.
      }
    });
    return () => sub.unsubscribe();
  }, [activo, clave, watch]);

  return {
    limpiar: () => {
      try {
        localStorage.removeItem(clave);
      } catch {
        // localStorage no disponible, nada que hacer.
      }
    },
  };
}

/**
 * Igual que useFormDraft, pero para formularios con campos sueltos en
 * useState (sin react-hook-form). El llamador arma `valores` con el estado
 * actual y aplica el borrador restaurado con `onRestaurar`.
 */
export function useDraftState<T extends Record<string, unknown>>({
  clave,
  activo,
  valores,
  onRestaurar,
}: {
  clave: string;
  activo: boolean;
  valores: T;
  onRestaurar: (borrador: T) => void;
}) {
  const restaurado = useRef(false);
  const onRestaurarRef = useRef(onRestaurar);
  onRestaurarRef.current = onRestaurar;

  useEffect(() => {
    if (!activo) {
      restaurado.current = false;
      return;
    }
    if (restaurado.current) return;
    restaurado.current = true;
    try {
      const crudo = localStorage.getItem(clave);
      if (!crudo) return;
      const borrador = JSON.parse(crudo) as T;
      onRestaurarRef.current(borrador);
      toast.info("Recuperamos un borrador sin guardar", {
        action: {
          label: "Descartar",
          onClick: () => {
            try {
              localStorage.removeItem(clave);
            } catch {
              // localStorage no disponible, nada que hacer.
            }
          },
        },
      });
    } catch {
      // Borrador corrupto: se ignora silenciosamente.
    }
  }, [activo, clave]);

  useEffect(() => {
    if (!activo) return;
    try {
      localStorage.setItem(clave, JSON.stringify(valores));
    } catch {
      // localStorage lleno o no disponible: se omite el autoguardado.
    }
  }, [activo, clave, valores]);

  return {
    limpiar: () => {
      try {
        localStorage.removeItem(clave);
      } catch {
        // localStorage no disponible, nada que hacer.
      }
    },
  };
}
