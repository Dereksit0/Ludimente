import type { EvaluacionDetalle } from "@/hooks/use-evaluaciones";
import { ESTATUS_EVALUACION_LABEL, TIPO_PRUEBA_OPCIONES } from "@/lib/catalogos";
import {
  abrirDocumentoMembretado,
  escMembrete as esc,
  type ConfigMembrete,
} from "@/lib/print-membrete";

const tipoLabel = (v: string) =>
  TIPO_PRUEBA_OPCIONES.find((t) => t.value === v)?.label ?? v;

/** Abre una ventana imprimible (Guardar como PDF) con el reporte membretado. */
export function imprimirEvaluacion(
  ev: EvaluacionDetalle,
  pacienteNombre: string,
  config?: ConfigMembrete,
) {
  const fecha = (f?: string | null) =>
    f ? new Date(f).toLocaleDateString("es-MX") : "—";

  const subFilas = ev.subpruebas
    .map(
      (s) => `<tr>
        <td>${esc(s.nombre_subprueba)}</td>
        <td style="text-align:center">${esc(s.puntuacion_directa ?? "—")}</td>
        <td style="text-align:center">${esc(s.puntuacion_escalar ?? "—")}</td>
        <td style="text-align:center">${esc(s.percentil ?? "—")}</td>
        <td>${esc(s.categoria ?? "—")}</td>
      </tr>`,
    )
    .join("");

  const lista = (arr: string[] | null) =>
    arr && arr.length
      ? `<ul>${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`
      : "<p>—</p>";

  const body = `
  <p class="lm-doc-title">Reporte de evaluación psicopedagógica</p>
  <p class="lm-doc-sub">${esc(tipoLabel(ev.tipo_prueba))}${
    ev.nombre_personalizado ? ` · ${esc(ev.nombre_personalizado)}` : ""
  }</p>

  <div class="lm-meta">
    <span><strong>Paciente:</strong> ${esc(pacienteNombre)}</span>
    <span><strong>Instrumento:</strong> ${esc(tipoLabel(ev.tipo_prueba))}</span>
    <span><strong>Estatus:</strong> ${esc(ESTATUS_EVALUACION_LABEL[ev.estatus] ?? ev.estatus)}</span>
    <span><strong>Aplicación:</strong> ${fecha(ev.fecha_aplicacion)}</span>
    <span><strong>Calificación:</strong> ${fecha(ev.fecha_calificacion)}</span>
    <span><strong>Entrega:</strong> ${fecha(ev.fecha_entrega)}</span>
    ${ev.ci_total != null ? `<span><strong>CI total:</strong> ${esc(ev.ci_total)}</span>` : ""}
  </div>

  ${
    ev.subpruebas.length
      ? `<h2>Resultados por subprueba</h2>
  <table><thead><tr><th>Subprueba / Índice</th><th>P. directa</th><th>Escalar</th><th>Percentil</th><th>Categoría</th></tr></thead>
  <tbody>${subFilas}</tbody></table>`
      : ""
  }

  <h2>¿Cómo salió? — Resultados</h2>
  <p><strong>Fortalezas:</strong></p>${lista(ev.fortalezas)}
  <p><strong>Áreas de oportunidad:</strong></p>${lista(ev.areas_oportunidad)}
  ${ev.interpretacion_cualitativa ? `<p><strong>Interpretación cualitativa:</strong></p><p>${esc(ev.interpretacion_cualitativa)}</p>` : ""}

  <h2>¿Qué necesita? — Recomendaciones</h2>
  ${ev.recomendaciones ? `<p>${esc(ev.recomendaciones)}</p>` : "<p>—</p>"}

  <div class="lm-firma">Nombre y firma del profesional · Cédula profesional</div>`;

  abrirDocumentoMembretado({
    titulo: `Reporte de evaluación - ${pacienteNombre}`,
    bodyHtml: body,
    config,
  });
}
