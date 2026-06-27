import { LudiMascota } from "@/components/ui/ludi-mascota";

interface ProximamenteProps {
  titulo: string;
  fase: string;
  descripcion?: string;
}

/** Estado "próximamente" de marca para módulos aún no implementados. */
export function Proximamente({ titulo, fase, descripcion }: ProximamenteProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="w-32 opacity-90">
        <LudiMascota />
      </div>
      <h2 className="mt-6 font-fredoka text-2xl text-luda-gris">{titulo}</h2>
      <p className="mt-2 max-w-md text-sm text-luda-gris-light">
        {descripcion ??
          "Este módulo de Ludi está en construcción. ¡Pronto estará listo para jugar! 🐙⭐"}
      </p>
      <span className="mt-4 rounded-full bg-luda-lila-light px-3 py-1 text-xs font-bold text-luda-lila-dark">
        {fase}
      </span>
    </div>
  );
}
