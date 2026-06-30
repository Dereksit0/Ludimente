import { addDays, differenceInCalendarDays } from "date-fns";

/**
 * Reglas de límite de pago e interés moratorio.
 *
 * El límite de cada cargo se calcula como su fecha de generación + un plazo
 * de crédito por defecto. Esto da a todos los pagos una "fecha límite" sin
 * requerir un cambio de esquema en la base de datos.
 */

/** Plazo de crédito por defecto (días desde que se genera el cargo). */
export const DIAS_LIMITE_PAGO = 15;

/** Interés moratorio informativo aplicado tras la fecha límite. */
export const INTERES_MORATORIO_PCT = 5;

export interface InfoLimitePago {
  /** Fecha límite de pago. */
  limite: Date;
  /** Días que faltan (>0) o que lleva vencido (<0) respecto al límite. */
  diasRestantes: number;
  vencido: boolean;
  /** Faltan 3 días o menos para el límite. */
  porVencer: boolean;
}

/** Calcula la fecha límite y el estado a partir de la fecha de creación del cargo. */
export function infoLimitePago(creadoISO: string): InfoLimitePago {
  const limite = addDays(new Date(creadoISO), DIAS_LIMITE_PAGO);
  const diasRestantes = differenceInCalendarDays(limite, new Date());
  return {
    limite,
    diasRestantes,
    vencido: diasRestantes < 0,
    porVencer: diasRestantes >= 0 && diasRestantes <= 3,
  };
}

/** Mensaje de recordatorio para mostrar a los papás. */
export function mensajeRecordatorioPago(info: InfoLimitePago): string {
  const interes = `se aplican intereses moratorios del ${INTERES_MORATORIO_PCT}% mensual`;
  if (info.vencido) {
    return `Pago vencido hace ${Math.abs(
      info.diasRestantes,
    )} día(s). A partir de la fecha límite ${interes}.`;
  }
  if (info.diasRestantes === 0) {
    return `Hoy es la fecha límite de pago. Después de hoy ${interes}.`;
  }
  return `Quedan ${info.diasRestantes} día(s) para tu pago. Recuerda que si pasa de la fecha límite ${interes}.`;
}
