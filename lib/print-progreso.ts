import type { ObjetivoSnapshot, ReporteListItem } from "@/hooks/use-reportes-progreso";
import { AREA_OBJETIVO_LABEL, ESTATUS_OBJETIVO_LABEL } from "@/types/app.types";
import type { AreaObjetivo, EstatusObjetivo, Tables } from "@/types/database.types";

type ConfigRecibo = Pick<
  Tables<"configuracion">,
  "nombre_consultorio" | "slogan" | "direccion" | "telefono" | "email"
>;

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;",
  );

const fecha = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("es-MX") : "";

/** Abre una ventana imprimible (Guardar como PDF) con el reporte de progreso. */
export function imprimirReporteProgreso(
  reporte: ReporteListItem,
  config?: ConfigRecibo | null,
) {
  const objetivos =
    (reporte.objetivos_snapshot as unknown as ObjetivoSnapshot[]) ?? [];

  const filasObjetivos = objetivos
    .map(
      (o) => `<tr>
        <td>${esc(o.descripcion)}</td>
        <td>${esc(AREA_OBJETIVO_LABEL[o.area as AreaObjetivo] ?? o.area)}</td>
        <td class="right">${esc(o.progreso)}%</td>
        <td>${esc(ESTATUS_OBJETIVO_LABEL[o.estatus as EstatusObjetivo] ?? o.estatus)}</td>
      </tr>`,
    )
    .join("");

  const periodo =
    reporte.periodo_inicio || reporte.periodo_fin
      ? `${fecha(reporte.periodo_inicio)} — ${fecha(reporte.periodo_fin)}`
      : "";

  const bloque = (titulo: string, texto?: string | null) =>
    texto && texto.trim()
      ? `<h2>${esc(titulo)}</h2><p class="texto">${esc(texto)}</p>`
      : "";

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Reporte de progreso · ${esc(reporte.paciente_nombre)}</title>
<style>
  *{font-family:Arial,Helvetica,sans-serif;color:#3d3d3d}
  body{max-width:720px;margin:32px auto;padding:0 24px}
  .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #eee;padding-bottom:12px}
  h1{color:#9B70C4;margin:0;font-size:22px}
  .sub{color:#888;font-size:12px;margin:2px 0}
  .doc{text-align:right;font-size:12px}
  .doc b{display:block;font-size:15px;color:#3d3d3d}
  h2{font-size:13px;color:#9B70C4;border-bottom:1px solid #eee;padding-bottom:4px;margin:22px 0 8px}
  .texto{font-size:13px;line-height:1.5;white-space:pre-line}
  table{width:100%;border-collapse:collapse;font-size:12px;margin-top:6px}
  th{text-align:left;color:#888;border-bottom:1px solid #eee;padding:6px 4px}
  td{padding:6px 4px;border-bottom:1px solid #f3f3f3;vertical-align:top}
  .right{text-align:right}
  .pie{margin-top:42px;text-align:center;font-size:11px;color:#888}
  @media print{body{margin:0}}
</style></head><body onload="window.print()">
  <div class="top">
    <div>
      <h1>🐙 ${esc(config?.nombre_consultorio ?? "Ludimente")}</h1>
      <p class="sub">${esc(config?.slogan ?? "")}</p>
      <p class="sub">${esc(config?.direccion ?? "")}</p>
      <p class="sub">${esc(config?.telefono ?? "")} ${esc(config?.email ?? "")}</p>
    </div>
    <div class="doc">
      Reporte de progreso<b>${esc(reporte.titulo)}</b>
      <span class="sub">${esc(fecha(reporte.created_at))}</span>
    </div>
  </div>

  <h2>Paciente</h2>
  <p class="texto">${esc(reporte.paciente_nombre)} · ${esc(reporte.expediente)}${
    periodo ? `<br>Periodo: ${esc(periodo)}` : ""
  }</p>

  ${bloque("Resumen del periodo", reporte.resumen)}
  ${bloque("Logros destacados", reporte.logros)}

  ${
    objetivos.length
      ? `<h2>Avance de objetivos</h2>
         <table>
           <tr><th>Objetivo</th><th>Área</th><th class="right">Avance</th><th>Estado</th></tr>
           ${filasObjetivos}
         </table>`
      : ""
  }

  ${bloque("Recomendaciones para casa", reporte.recomendaciones)}

  <div class="pie">Documento informativo para la familia · ${esc(
    config?.nombre_consultorio ?? "Ludimente",
  )}</div>
</body></html>`;

  const win = window.open("", "_blank", "width=820,height=900");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
