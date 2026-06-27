import Link from "next/link";

import { LudaAvatar } from "@/components/ui/luda-avatar";
import { LudaBadge } from "@/components/ui/luda-badge";
import { LudaCard } from "@/components/ui/luda-card";
import { edadLegible } from "@/lib/fechas";
import type { PacienteListItem } from "@/hooks/use-pacientes";

export function PacienteCard({ paciente }: { paciente: PacienteListItem }) {
  const nombreCompleto = `${paciente.nombre} ${paciente.apellido_paterno} ${
    paciente.apellido_materno ?? ""
  }`.trim();

  return (
    <Link href={`/pacientes/${paciente.id}`} className="group block">
      <LudaCard className="h-full p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-luda-md">
        <div className="flex items-start gap-3">
          <LudaAvatar nombre={nombreCompleto} foto={null} size={48} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-bold text-luda-gris group-hover:text-luda-lila-dark">
              {nombreCompleto}
            </h3>
            <p className="text-xs font-semibold text-luda-gris-light">
              {paciente.numero_expediente} · {edadLegible(paciente.fecha_nacimiento)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <LudaBadge tipo="paciente" status={paciente.estatus} />
          {paciente.psicologo && (
            <span className="flex items-center gap-1.5 truncate text-xs text-luda-gris-light">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: paciente.psicologo.color_agenda }}
              />
              <span className="truncate">{paciente.psicologo.full_name}</span>
            </span>
          )}
        </div>

        {paciente.diagnostico_principal && (
          <p className="mt-3 truncate rounded-lg bg-luda-lila-light/60 px-2.5 py-1 text-xs font-semibold text-luda-lila-dark">
            {paciente.diagnostico_principal}
          </p>
        )}
      </LudaCard>
    </Link>
  );
}
