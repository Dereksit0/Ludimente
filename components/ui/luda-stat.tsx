import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { LudaCard } from "@/components/ui/luda-card";

interface LudaStatProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** Variación porcentual opcional (ej. ingresos vs mes anterior). */
  cambio?: { valor: number; texto?: string };
  acento?: "lila" | "rosa" | "azul" | "amarillo";
  className?: string;
}

const ACENTOS = {
  lila: "bg-luda-lila-light text-luda-lila-dark",
  rosa: "bg-luda-rosa-light text-luda-rosa",
  azul: "bg-luda-azul-light text-luda-azul",
  amarillo: "bg-luda-amarillo-light text-yellow-600",
} as const;

/** Card de métrica del dashboard. */
export function LudaStat({
  label,
  value,
  icon: Icon,
  cambio,
  acento = "lila",
  className,
}: LudaStatProps) {
  const positivo = (cambio?.valor ?? 0) >= 0;
  return (
    <LudaCard className={cn("p-5", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-luda-gris-light">{label}</p>
          <p className="mt-1 text-3xl font-bold text-luda-gris">{value}</p>
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", ACENTOS[acento])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {cambio && (
        <p
          className={cn(
            "mt-3 text-xs font-semibold",
            positivo ? "text-green-600" : "text-red-500",
          )}
        >
          {positivo ? "▲" : "▼"} {Math.abs(cambio.valor)}%{" "}
          <span className="font-normal text-luda-gris-light">
            {cambio.texto ?? "vs mes anterior"}
          </span>
        </p>
      )}
    </LudaCard>
  );
}
