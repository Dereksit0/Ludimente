import { cn } from "@/lib/utils";

/**
 * Ludi — pulpito lila con 6 brazos de colores pastel (mascota de marca).
 * SVG embebido para usar en login, estados vacíos y portal de papás.
 */
export function LudiMascota({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label="Ludi, la mascota de Ludimente"
    >
      {/* Brazos — 6 colores del brief */}
      <g strokeLinecap="round" fill="none" strokeWidth="11">
        <path d="M70 120 C50 140 40 160 52 178" stroke="#C9A8E0" />
        <path d="M85 128 C72 152 66 170 78 186" stroke="#F2B5C8" />
        <path d="M100 130 C100 158 100 172 100 190" stroke="#A8C8E8" />
        <path d="M115 128 C128 152 134 170 122 186" stroke="#F7D98B" />
        <path d="M130 120 C150 140 160 160 148 178" stroke="#A8E0C4" />
        <path d="M58 108 C36 120 28 140 40 158" stroke="#F7C9A8" />
      </g>

      {/* Cabeza */}
      <ellipse cx="100" cy="85" rx="55" ry="52" fill="#C9A8E0" />
      <ellipse cx="100" cy="80" rx="46" ry="42" fill="#EDE0F8" />

      {/* Mejillas */}
      <circle cx="74" cy="92" r="9" fill="#F2B5C8" opacity="0.7" />
      <circle cx="126" cy="92" r="9" fill="#F2B5C8" opacity="0.7" />

      {/* Ojos */}
      <circle cx="84" cy="74" r="9" fill="#4A4A5A" />
      <circle cx="116" cy="74" r="9" fill="#4A4A5A" />
      <circle cx="87" cy="71" r="3" fill="#FDFAF6" />
      <circle cx="119" cy="71" r="3" fill="#FDFAF6" />

      {/* Sonrisa */}
      <path
        d="M86 96 Q100 108 114 96"
        fill="none"
        stroke="#9B70C4"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Estrellita en la frente (magia) */}
      <path
        d="M100 40 l3 7 8 1 -6 6 2 8 -7 -4 -7 4 2 -8 -6 -6 8 -1z"
        fill="#F7D98B"
      />
    </svg>
  );
}

/** Estrella decorativa con animación de parpadeo suave. */
export function Estrella({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("animate-estrella-twinkle", className)}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2l2.4 6.5L21 9.3l-5 4.6L17.5 21 12 17.3 6.5 21 8 13.9l-5-4.6 6.6-.8z" />
    </svg>
  );
}
