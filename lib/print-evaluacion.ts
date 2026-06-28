import type { EvaluacionDetalle } from "@/hooks/use-evaluaciones";
import { ESTATUS_EVALUACION_LABEL, TIPO_PRUEBA_OPCIONES } from "@/lib/catalogos";

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;",
  );

const tipoLabel = (v: string) =>
  TIPO_PRUEBA_OPCIONES.find((t) => t.value === v)?.label ?? v;

/** Abre una ventana imprimible (Guardar como PDF) con el reporte. */
export function imprimirEvaluacion(
  ev: EvaluacionDetalle,
  pacienteNombre: string,
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
      </tr>`,
    )
    .join("");

  const lista = (arr: string[] | null) =>
    arr && arr.length
      ? `<ul>${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`
      : "<p>—</p>";

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Reporte de evaluación - ${esc(pacienteNombre)}</title>
<style>
  *{font-family:Arial,Helvetica,sans-serif;color:#3d3d3d}
  body{max-width:760px;margin:32px auto;padding:0 24px;line-height:1.5}
  h1{color:#9B70C4;margin:0}
  .sub{color:#888;font-size:13px;margin-top:2px}
  h2{color:#9B70C4;font-size:15px;border-bottom:2px solid #eee;padding-bottom:4px;margin-top:24px}
  table{width:100%;border-collapse:collapse;margin-top:8px;font-size:13px}
  th,td{border:1px solid #ddd;padding:6px 8px}
  th{background:#f5eefb;text-align:left}
  .meta{display:flex;flex-wrap:wrap;gap:8px 32px;font-size:13px;margin-top:12px}
  .firma{margin-top:64px;border-top:1px solid #333;width:260px;text-align:center;padding-top:6px;font-size:13px}
  @media print{body{margin:0}}
</style></head><body onload="window.print()">
  <h1>🐙 Ludimente</h1>
  <p class="sub">Reporte de evaluación psicopedagógica</p>

  <div class="meta">
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
  <table><thead><tr><th>Subprueba</th><th>P. directa</th><th>Escalar</th><th>Percentil</th></tr></thead>
  <tbody>${subFilas}</tbody></table>`
      : ""
  }

  <h2>Fortalezas</h2>${lista(ev.fortalezas)}
  <h2>Áreas de oportunidad</h2>${lista(ev.areas_oportunidad)}

  ${ev.interpretacion_cualitativa ? `<h2>Interpretación</h2><p>${esc(ev.interpretacion_cualitativa)}</p>` : ""}
  ${ev.recomendaciones ? `<h2>Recomendaciones</h2><p>${esc(ev.recomendaciones)}</p>` : ""}

  <div class="firma">Firma del profesional</div>
</body></html>`;

  const win = window.open("", "_blank", "width=820,height=900");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
