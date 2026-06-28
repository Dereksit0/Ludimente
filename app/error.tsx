"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // En producción esto debería ir a un servicio de monitoreo.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-luda-fondo p-6 text-center">
      <span className="text-5xl" aria-hidden>
        🐙
      </span>
      <h1 className="font-fredoka text-2xl text-luda-gris">
        Algo salió mal
      </h1>
      <p className="max-w-md text-sm text-luda-gris-light">
        Ocurrió un error inesperado. Puedes intentar de nuevo; si persiste,
        contacta al soporte.
      </p>
      <Button onClick={reset}>Intentar de nuevo</Button>
    </div>
  );
}
