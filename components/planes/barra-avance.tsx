import { cn } from "@/lib/utils";

/** Barra de progreso 0-100 con color según el avance. */
export function BarraAvance({
  valor,
  className,
}: {
  valor: number;
  className?: string;
}) {
  const v = Math.max(0, Math.min(100, Math.round(valor)));
  const color =
    v >= 100
      ? "bg-green-500"
      : v >= 50
        ? "bg-luda-lila"
        : v > 0
          ? "bg-luda-amarillo"
          : "bg-luda-gris-light/40";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-luda-lila-light">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${v}%` }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-xs font-bold text-luda-gris">
        {v}%
      </span>
    </div>
  );
}
