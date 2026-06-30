import type { TamizajeItem } from "@/hooks/use-tamizaje";
import {
  NIVEL_TAMIZAJE_LABEL,
  TAMIZAJE_AREAS,
} from "@/lib/catalogos";
import {
  abrirDocumentoMembretado,
  escMembrete as esc,
  type ConfigMembrete,
} from "@/lib/print-membrete";

const COLOR: Record<string, string> = {
  logrado: "#dcfce7",
  en_proceso: "#fef9c3",
  no_logrado: "#fee2e2",
  no_evaluado: "#f3f4f6",
};

/** Imprime el tamizaje individual de un paciente, membretado. */
export function imprimirTamizaje(t: TamizajeItem, config?: ConfigMembrete) {
  const filas = TAMIZAJE_AREAS.map((a) => {
    const nivel = t.areasMap[a.value] ?? "no_evaluado";
    return `<tr>
      <td>${esc(a.label)}</td>
      <td style="text-align:center;background:${COLOR[nivel] ?? "#fff"}">
        ${esc(NIVEL_TAMIZAJE_LABEL[nivel] ?? "—")}
      </td>
    </tr>`;
  }).join("");

  const fecha = t.fecha ? new Date(t.fecha).toLocaleDateString("es-MX") : "—";

  const body = `
  <p class="lm-doc-title">Tamizaje psicopedagógico inicial</p>
  <p class="lm-doc-sub">Nivel de desempeño por área básica</p>

  <div class="lm-meta">
    <span><strong>Paciente:</strong> ${esc(t.paciente_nombre)}</span>
    <span><strong>Expediente:</strong> ${esc(t.expediente)}</span>
    <span><strong>Fecha:</strong> ${esc(fecha)}</span>
    ${t.evaluador_nombre ? `<span><strong>Evaluador(a):</strong> ${esc(t.evaluador_nombre)}</span>` : ""}
  </div>

  <table style="max-width:480px">
    <thead><tr><th>Área</th><th style="text-align:center">Nivel</th></tr></thead>
    <tbody>${filas}</tbody>
  </table>

  ${
    t.observaciones
      ? `<h2>Observaciones</h2><p>${esc(t.observaciones)}</p>`
      : ""
  }

  <div class="lm-firma">Nombre y firma del profesional</div>`;

  abrirDocumentoMembretado({
    titulo: `Tamizaje - ${t.paciente_nombre}`,
    bodyHtml: body,
    config,
  });
}
