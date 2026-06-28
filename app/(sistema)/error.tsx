"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function SistemaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-luda-lila/15 bg-white p-10 text-center">
      <span className="text-4xl" aria-hidden>
        🐙
      </span>
      <h2 className="font-fredoka text-xl text-luda-gris">
        No se pudo cargar esta sección
      </h2>
      <p className="max-w-md text-sm text-luda-gris-light">
        Intenta de nuevo. Si el problema continúa, avísale al administrador.
      </p>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
