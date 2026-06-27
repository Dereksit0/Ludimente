import Image from "next/image";

import { cn } from "@/lib/utils";

interface LudaAvatarProps {
  nombre: string;
  foto?: string | null;
  className?: string;
  size?: number;
}

/** Iniciales a partir del nombre completo (máx. 2 letras). */
function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Avatar circular con foto o fallback de iniciales en lila. */
export function LudaAvatar({
  nombre,
  foto,
  className,
  size = 40,
}: LudaAvatarProps) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-luda-lila-light font-bold text-luda-lila-dark",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {foto ? (
        <Image src={foto} alt={nombre} fill className="object-cover" sizes={`${size}px`} />
      ) : (
        <span>{iniciales(nombre)}</span>
      )}
    </div>
  );
}
