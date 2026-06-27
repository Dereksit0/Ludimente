import { cn } from "@/lib/utils";
import {
  ESTATUS_CITA_CLASES,
  ESTATUS_CITA_LABEL,
  ESTATUS_PACIENTE_CLASES,
  ESTATUS_PACIENTE_LABEL,
} from "@/types/app.types";
import type { EstatusCita, EstatusPaciente } from "@/types/database.types";

type LudaBadgeProps =
  | { tipo: "paciente"; status: EstatusPaciente; className?: string }
  | { tipo: "cita"; status: EstatusCita; className?: string };

/** Badge de estatus con colores semánticos definidos en el brief. */
export function LudaBadge(props: LudaBadgeProps) {
  const { clase, label } =
    props.tipo === "paciente"
      ? {
          clase: ESTATUS_PACIENTE_CLASES[props.status],
          label: ESTATUS_PACIENTE_LABEL[props.status],
        }
      : {
          clase: ESTATUS_CITA_CLASES[props.status],
          label: ESTATUS_CITA_LABEL[props.status],
        };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        clase,
        props.className,
      )}
    >
      {label}
    </span>
  );
}
