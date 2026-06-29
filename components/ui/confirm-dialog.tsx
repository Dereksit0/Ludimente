"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export interface ConfirmOptions {
  titulo?: string;
  mensaje?: string;
  /** Texto del botón de confirmar (por defecto "Confirmar"). */
  confirmar?: string;
  cancelar?: string;
  /** Estilo destructivo (rojo) para acciones irreversibles. */
  peligro?: boolean;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/** Provee un diálogo de confirmación con la marca, en vez de window.confirm. */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirmar = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setOpts(options);
    });
  }, []);

  const responder = useCallback((valor: boolean) => {
    resolver.current?.(valor);
    resolver.current = null;
    setOpts(null);
  }, []);

  return (
    <ConfirmContext.Provider value={confirmar}>
      {children}
      <Modal
        abierto={opts !== null}
        onCerrar={() => responder(false)}
        titulo={opts?.titulo ?? "¿Confirmar acción?"}
        className="max-w-sm"
      >
        <div className="flex gap-3">
          {opts?.peligro && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertTriangle className="h-5 w-5" />
            </span>
          )}
          <p className="text-sm text-luda-gris">
            {opts?.mensaje ?? "¿Deseas continuar?"}
          </p>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => responder(false)}>
            {opts?.cancelar ?? "Cancelar"}
          </Button>
          <Button
            variant={opts?.peligro ? "destructive" : "default"}
            onClick={() => responder(true)}
            autoFocus
          >
            {opts?.confirmar ?? "Confirmar"}
          </Button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

/** Devuelve una función async confirmar(opts) → Promise<boolean>. */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm debe usarse dentro de <ConfirmProvider>");
  }
  return ctx;
}
