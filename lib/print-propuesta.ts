import type { Propuesta } from "@/lib/propuesta";
import {
  abrirDocumentoMembretado,
  escMembrete as esc,
  type ConfigMembrete,
} from "@/lib/print-membrete";

function money(n: number, moneda: string) {
  return `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })} ${moneda}`;
}

/**
 * Imprime la propuesta de intervención para entregar a los papás.
 * Muestra el PRECIO DE LISTA (el que "aparece en el sistema").
 */
export function imprimirPropuesta(
  p: Propuesta,
  pacienteNombre: string,
  config?: ConfigMembrete,
) {
  const objetivosHtml = (prioridad: "alta" | "media") => {
    const items = p.objetivos.filter((o) => o.prioridad === prioridad);
    if (items.length === 0) return "";
    return `<p><strong>${prioridad === "alta" ? "Prioridad alta" : "Prioridad media"}:</strong></p>
      <ul>${items
        .map((o) => `<li>${esc(o.descripcion)} <em>(${esc(o.areaLabel)})</em></li>`)
        .join("")}</ul>`;
  };

  const body = `
  <p class="lm-doc-title">Propuesta de intervención</p>
  <p class="lm-doc-sub">Plan sugerido a partir de la evaluación inicial</p>

  <div class="lm-meta">
    <span><strong>Paciente:</strong> ${esc(pacienteNombre)}</span>
    <span><strong>Fecha:</strong> ${new Date().toLocaleDateString("es-MX")}</span>
  </div>

  <h2>Plan de intervención sugerido</h2>
  ${
    p.objetivos.length
      ? objetivosHtml("alta") + objetivosHtml("media")
      : "<p>El paciente muestra un desempeño adecuado en las áreas evaluadas; se sugiere seguimiento.</p>"
  }

  <h2>Plan de sesiones</h2>
  <ul>
    <li><strong>${p.sesiones} sesiones</strong> de ${p.duracionMin} minutos.</li>
    <li>Frecuencia recomendada: <strong>${p.frecuencia} por semana</strong> (aprox. ${p.semanas} semanas).</li>
    <li>Áreas a trabajar: ${p.areasTrabajo}.</li>
  </ul>

  <h2>Inversión</h2>
  <table style="max-width:420px">
    <tbody>
      <tr><th>Precio por sesión</th><td style="text-align:right">${money(p.precioLista, p.moneda)}</td></tr>
      <tr><th>Mensualidad estimada (${p.frecuencia}/sem)</th><td style="text-align:right">${money(p.mensualidad, p.moneda)}</td></tr>
      <tr><th>Total del programa (${p.sesiones} sesiones)</th><td style="text-align:right"><strong>${money(p.totalLista, p.moneda)}</strong></td></tr>
    </tbody>
  </table>
  <p style="font-size:11px;color:#888">Los montos son una estimación del programa completo y pueden ajustarse según la evolución del paciente.</p>

  <div class="lm-firma">Nombre y firma del profesional</div>`;

  abrirDocumentoMembretado({
    titulo: `Propuesta de intervención - ${pacienteNombre}`,
    bodyHtml: body,
    config,
  });
}
