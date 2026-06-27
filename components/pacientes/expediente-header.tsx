"use client";

import { useEffect, useState } from "react";

import { CalendarPlus, FilePlus2, MoreHorizontal, NotebookPen } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { LudaAvatar } from "@/components/ui/luda-avatar";
import { LudaBadge } from "@/components/ui/luda-badge";
import { edadLegible } from "@/lib/fechas";
import { BUCKET_FOTOS, urlFirmada } from "@/lib/storage";
import type { PacienteDetalle } from "@/hooks/use-pacientes";

export function ExpedienteHeader({ paciente }: { paciente: PacienteDetalle }) {
  const nombreCompleto = `${paciente.nombre} ${paciente.apellido_paterno} ${
    paciente.apellido_materno ?? ""
  }`.trim();

  // Foto en bucket privado → resolver URL firmada para mostrarla.
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  useEffect(() => {
    let activo = true;
    if (paciente.foto_url) {
      urlFirmada(BUCKET_FOTOS, paciente.foto_url).then((u) => {
        if (activo) setFotoUrl(u);
      });
    }
    return () => {
      activo = false;
    };
  }, [paciente.foto_url]);

  const proximamente = (q: string) => () =>
    toast.info(`${q} estará disponible en una próxima fase. 🐙`);

  return (
    <div className="sticky top-16 z-10 -mx-4 border-b border-luda-lila/15 bg-luda-blanco/90 px-4 py-4 backdrop-blur md:-mx-8 md:px-8">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4">
        <LudaAvatar nombre={nombreCompleto} foto={fotoUrl} size={64} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-luda-gris-light">
              {paciente.numero_expediente}
            </span>
            <LudaBadge tipo="paciente" status={paciente.estatus} />
          </div>
          <h1 className="mt-0.5 truncate font-fredoka text-2xl text-luda-gris">
            {nombreCompleto}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-luda-gris-light">
            <span>{edadLegible(paciente.fecha_nacimiento)}</span>
            {paciente.psicologo && (
              <span className="flex items-center gap-1.5">
                <LudaAvatar
                  nombre={paciente.psicologo.full_name}
                  foto={null}
                  size={18}
                />
                {paciente.psicologo.full_name}
              </span>
            )}
            {paciente.diagnostico_principal && (
              <span className="rounded-full bg-luda-lila-light px-2 py-0.5 font-semibold text-luda-lila-dark">
                {paciente.diagnostico_principal}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={proximamente("Agendar cita")}>
            <CalendarPlus /> <span className="hidden sm:inline">Nueva cita</span>
          </Button>
          <Button size="sm" variant="outline" onClick={proximamente("Las notas de sesión")}>
            <NotebookPen /> <span className="hidden sm:inline">Nueva nota</span>
          </Button>
          <Button size="sm" variant="outline" onClick={proximamente("La carga de documentos")}>
            <FilePlus2 /> <span className="hidden sm:inline">Subir doc</span>
          </Button>
          <Button size="icon" variant="ghost" onClick={proximamente("Más acciones")}>
            <MoreHorizontal />
          </Button>
        </div>
      </div>
    </div>
  );
}
