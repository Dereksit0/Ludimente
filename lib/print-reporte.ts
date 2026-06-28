import type { ReportesData } from "@/hooks/use-reportes";

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;",
  );
const mx = (n: number) =>
  `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

interface OpcionesReporte {
  desde: string;
  hasta: string;
  terapeuta: string;
  esAdmin: boolean;
}

/** Abre una ventana imprimible (Guardar como PDF) con el reporte. */
export function imprimirReporte(data: ReportesData, op: OpcionesReporte) {
  const tabla = (titulo: string, filas: { nombre: string; total: number }[], money = false) =>
    filas.length
      ? `<h2>${esc(titulo)}</h2><table>${filas
          .map(
            (f) =>
              `<tr><td>${esc(f.nombre)}</td><td class="right">${
                money ? mx(f.total) : f.total
              }</td></tr>`,
          )
          .join("")}</table>`
      : "";

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Reporte Ludimente</title>
<style>
  *{font-family:Arial,Helvetica,sans-serif;color:#3d3d3d}
  body{max-width:720px;margin:32px auto;padding:0 24px}
  h1{color:#9B70C4;margin:0;font-size:22px}
  .sub{color:#888;font-size:12px;margin-top:2px}
  h2{font-size:14px;color:#9B70C4;border-bottom:2px solid #eee;padding-bottom:4px;margin:22px 0 6px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  td{padding:5px 0;border-bottom:1px solid #f0f0f0}
  .right{text-align:right}
  .stats{display:flex;flex-wrap:wrap;gap:16px;margin-top:12px}
  .stat{flex:1;min-width:120px;border:1px solid #eee;border-radius:10px;padding:10px}
  .stat b{display:block;font-size:20px}
  @media print{body{margin:0}}
</style></head><body onload="window.print()">
  <h1>🐙 Ludimente — Reporte</h1>
  <p class="sub">Periodo: ${esc(op.desde || "últimos 6 meses")} a ${esc(op.hasta || "hoy")} · Terapeuta: ${esc(op.terapeuta)}</p>

  <div class="stats">
    <div class="stat">Pacientes<b>${data.totales.pacientes}</b></div>
    <div class="stat">Citas en periodo<b>${data.totales.citasRango}</b></div>
    <div class="stat">Asistencia<b>${data.totales.tasaAsistencia}%</b></div>
    <div class="stat">Ocupación<b>${data.totales.ocupacionPct}%</b></div>
    ${op.esAdmin ? `<div class="stat">Ingresos<b>${mx(data.totales.ingresosRango)}</b></div>` : ""}
  </div>

  ${tabla("Pacientes por estatus", data.pacientesPorEstatus)}
  ${tabla("Citas por estatus", data.citasPorEstatus)}
  ${tabla("Ausentismo por paciente", data.ausentismoPorPaciente)}
  ${tabla("Pacientes por terapeuta", data.pacientesPorTerapeuta)}
  ${tabla("Diagnósticos más frecuentes", data.diagnosticosTop)}
  ${
    op.esAdmin
      ? tabla(
          "Ingresos por mes",
          data.ingresosPorMes.map((m) => ({ nombre: m.mes, total: m.total })),
          true,
        )
      : ""
  }
</body></html>`;

  const win = window.open("", "_blank", "width=820,height=900");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
