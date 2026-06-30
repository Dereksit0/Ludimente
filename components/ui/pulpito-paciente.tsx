import { cn } from "@/lib/utils";

type Sexo = "masculino" | "femenino" | "otro" | null | undefined;

/**
 * Pulpito del paciente según su sexo:
 *  - niño  → tonos azules + gorra
 *  - niña  → tonos rosas + moño
 *  - otro / sin especificar → lila neutro (mascota base)
 * Sustituye a la foto del paciente.
 */
export function PulpitoPaciente({
  sexo,
  size = 48,
  className,
}: {
  sexo?: Sexo;
  size?: number;
  className?: string;
}) {
  const nina = sexo === "femenino";
  const nino = sexo === "masculino";

  const cabeza = nina ? "#F2B5C8" : nino ? "#A8C8E8" : "#C9A8E0";
  const cara = nina ? "#FCE3EC" : nino ? "#E1EFFB" : "#EDE0F8";
  const acento = nina ? "#E88BA8" : nino ? "#7FB0E0" : "#C9A8E0";

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label={
        nina ? "Pulpito niña" : nino ? "Pulpito niño" : "Pulpito paciente"
      }
      className={cn("shrink-0", className)}
    >
      {/* Brazos */}
      <g strokeLinecap="round" fill="none" strokeWidth="11">
        <path d="M70 120 C50 140 40 160 52 178" stroke={acento} opacity="0.85" />
        <path d="M85 128 C72 152 66 170 78 186" stroke={cabeza} />
        <path d="M100 130 C100 158 100 172 100 190" stroke={acento} opacity="0.85" />
        <path d="M115 128 C128 152 134 170 122 186" stroke={cabeza} />
        <path d="M130 120 C150 140 160 160 148 178" stroke={acento} opacity="0.85" />
        <path d="M58 108 C36 120 28 140 40 158" stroke={cabeza} />
      </g>

      {/* Cabeza */}
      <ellipse cx="100" cy="85" rx="55" ry="52" fill={cabeza} />
      <ellipse cx="100" cy="80" rx="46" ry="42" fill={cara} />

      {/* Mejillas */}
      <circle cx="74" cy="92" r="9" fill={acento} opacity="0.55" />
      <circle cx="126" cy="92" r="9" fill={acento} opacity="0.55" />

      {/* Ojos */}
      <circle cx="84" cy="74" r="9" fill="#4A4A5A" />
      <circle cx="116" cy="74" r="9" fill="#4A4A5A" />
      <circle cx="87" cy="71" r="3" fill="#FDFAF6" />
      <circle cx="119" cy="71" r="3" fill="#FDFAF6" />

      {/* Sonrisa */}
      <path
        d="M86 96 Q100 108 114 96"
        fill="none"
        stroke={acento}
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Niña → moño */}
      {nina && (
        <g>
          <path d="M100 40 L82 28 L86 50 Z" fill="#E88BA8" />
          <path d="M100 40 L118 28 L114 50 Z" fill="#E88BA8" />
          <circle cx="100" cy="42" r="6" fill="#D46E92" />
        </g>
      )}

      {/* Niño → gorra */}
      {nino && (
        <g>
          <path
            d="M62 52 Q100 22 138 52 Q120 44 100 44 Q80 44 62 52 Z"
            fill="#5C93D6"
          />
          <path d="M58 52 Q100 60 142 52 L142 56 Q100 64 58 56 Z" fill="#4A7FBF" />
          <circle cx="100" cy="30" r="5" fill="#A8C8E8" />
        </g>
      )}

      {/* Otro → estrellita */}
      {!nina && !nino && (
        <path
          d="M100 40 l3 7 8 1 -6 6 2 8 -7 -4 -7 4 2 -8 -6 -6 8 -1z"
          fill="#F7D98B"
        />
      )}
    </svg>
  );
}
