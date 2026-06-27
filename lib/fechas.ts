import {
  differenceInMonths,
  differenceInYears,
  format,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";

/** Convierte una fecha (Date | ISO string) a Date de forma segura. */
function aDate(fecha: Date | string): Date {
  return typeof fecha === "string" ? parseISO(fecha) : fecha;
}

/** Edad en años cumplidos a partir de la fecha de nacimiento. */
export function calcularEdad(fechaNacimiento: Date | string): number {
  return differenceInYears(new Date(), aDate(fechaNacimiento));
}

/** Edad legible: "7 años" o "8 meses" para menores de un año. */
export function edadLegible(fechaNacimiento: Date | string): string {
  const nacimiento = aDate(fechaNacimiento);
  const anios = differenceInYears(new Date(), nacimiento);
  if (anios >= 1) return `${anios} ${anios === 1 ? "año" : "años"}`;
  const meses = differenceInMonths(new Date(), nacimiento);
  return `${meses} ${meses === 1 ? "mes" : "meses"}`;
}

/** Formatea una fecha en español: "12 de marzo de 2026". */
export function fechaLarga(fecha: Date | string): string {
  return format(aDate(fecha), "d 'de' MMMM 'de' yyyy", { locale: es });
}

/** Formatea una fecha corta: "12 mar 2026". */
export function fechaCorta(fecha: Date | string): string {
  return format(aDate(fecha), "d MMM yyyy", { locale: es });
}

/** Formatea fecha y hora: "12 mar 2026, 3:45 p. m." */
export function fechaHora(fecha: Date | string): string {
  return format(aDate(fecha), "d MMM yyyy, h:mm a", { locale: es });
}
