import type { SubpruebaInput } from "@/lib/validations/evaluacion.schema";

/** Clasifica un percentil en una categoría cualitativa estándar. */
export function categoriaPercentil(p: number): string {
  if (p < 5) return "muy bajo";
  if (p < 25) return "bajo";
  if (p < 75) return "promedio";
  if (p < 95) return "alto";
  return "muy alto";
}

/** Clasifica una puntuación escalar (media 10, DE 3). */
function categoriaEscalar(e: number): string {
  if (e <= 4) return "muy bajo";
  if (e <= 6) return "bajo";
  if (e <= 12) return "promedio";
  if (e <= 15) return "alto";
  return "muy alto";
}

function categoriaCI(ci: number): string {
  if (ci < 70) return "muy bajo";
  if (ci < 85) return "bajo";
  if (ci < 115) return "promedio";
  if (ci < 130) return "alto";
  return "muy alto";
}

/**
 * Genera un texto sugerido de interpretación a partir de los puntajes.
 * El terapeuta puede editarlo antes de guardar.
 */
export function sugerirInterpretacion(
  subpruebas: SubpruebaInput[],
  ciTotal?: number,
): string {
  const partes: string[] = [];

  if (typeof ciTotal === "number" && !Number.isNaN(ciTotal)) {
    partes.push(
      `El CI total obtenido es ${ciTotal}, ubicándose en un rango ${categoriaCI(ciTotal)} respecto a su grupo de edad.`,
    );
  }

  const clasificadas = subpruebas
    .map((s) => {
      let cat: string | null = null;
      if (typeof s.percentil === "number") cat = categoriaPercentil(s.percentil);
      else if (typeof s.puntuacion_escalar === "number")
        cat = categoriaEscalar(s.puntuacion_escalar);
      return cat ? { nombre: s.nombre_subprueba, cat } : null;
    })
    .filter((x): x is { nombre: string; cat: string } => x !== null);

  const fortalezas = clasificadas.filter((c) => c.cat === "alto" || c.cat === "muy alto");
  const debilidades = clasificadas.filter((c) => c.cat === "bajo" || c.cat === "muy bajo");

  if (fortalezas.length) {
    partes.push(
      `Destaca con desempeño por encima del promedio en: ${fortalezas
        .map((f) => f.nombre)
        .join(", ")}.`,
    );
  }
  if (debilidades.length) {
    partes.push(
      `Se observan áreas de oportunidad (desempeño por debajo del promedio) en: ${debilidades
        .map((d) => d.nombre)
        .join(", ")}.`,
    );
  }
  if (!fortalezas.length && !debilidades.length && clasificadas.length) {
    partes.push("El desempeño general se ubica dentro del rango promedio esperado.");
  }
  if (!partes.length) {
    return "Captura los percentiles o puntuaciones escalares para generar una interpretación sugerida.";
  }

  return partes.join(" ");
}
