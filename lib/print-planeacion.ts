import type { PlaneacionItem } from "@/hooks/use-planeacion";
import { DIA_SEMANA_LABEL } from "@/lib/catalogos";
import {
  abrirDocumentoMembretado,
  escMembrete as esc,
  type ConfigMembrete,
} from "@/lib/print-membrete";

/** Convierte texto multilínea en una lista con viñetas (o un guion si está vacío). */
function bullets(texto: string | null): string {
  const items = (texto ?? "")
    .split("\n")
    .map((l) => l.replace(/^[-•·\s]+/, "").trim())
    .filter(Boolean);
  if (items.length === 0) return "—";
  return `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
}

const celda = (t: string | null) => esc(t ?? "—") || "—";

/** Imprime la planeación semanal con el formato de tabla (membretado). */
export function imprimirPlaneacion(
  planes: PlaneacionItem[],
  config?: ConfigMembrete,
  dias?: number[],
) {
  const diasOrden =
    dias && dias.length
      ? dias
      : [...new Set(planes.map((p) => p.dia_semana))].sort((a, b) => a - b);

  const secciones = diasOrden
    .map((dia) => {
      const filas = planes
        .filter((p) => p.dia_semana === dia)
        .map(
          (p) => `<tr>
            <td class="hora">${celda(p.horario)}</td>
            <td class="pac">${esc(p.paciente_nombre)}${
              p.terapeuta_nombre
                ? `<br><span class="ter">${esc(p.terapeuta_nombre)}</span>`
                : ""
            }</td>
            <td>${bullets(p.objetivos)}</td>
            <td>${celda(p.inicio)}</td>
            <td>${bullets(p.desarrollo)}</td>
            <td>${celda(p.cierre)}</td>
            <td>${bullets(p.materiales)}</td>
          </tr>`,
        )
        .join("");
      if (!filas) return "";
      return `<h2>${esc(DIA_SEMANA_LABEL[dia] ?? "Día")}</h2>
      <table class="plan"><thead><tr>
        <th>Horario</th><th>Paciente</th><th>Objetivos</th>
        <th>Inicio</th><th>Desarrollo</th><th>Cierre</th><th>Materiales</th>
      </tr></thead><tbody>${filas}</tbody></table>`;
    })
    .join("");

  const body = `
  <p class="lm-doc-title">Planeación semanal de terapias</p>
  <p class="lm-doc-sub">Plan de cada paciente para que cualquier terapeuta pueda dar continuidad.</p>
  ${secciones || "<p>No hay planeaciones registradas.</p>"}`;

  const extraCss = `
    @page{size:landscape}
    body{max-width:none}
    table.plan{font-size:11px;table-layout:fixed}
    table.plan th{background:#F8C6D5;color:#7a3b52;text-align:center;font-size:11px}
    table.plan td{vertical-align:top}
    table.plan .hora{text-align:center;font-weight:700;white-space:nowrap;width:64px}
    table.plan .pac{font-weight:700;width:96px}
    table.plan .pac .ter{font-weight:400;font-size:10px;color:#888}
    table.plan ul{margin:0;padding-left:16px}
    table.plan tr{page-break-inside:avoid}
    h2{color:#b85c7a;border-bottom-color:#F8C6D5}
  `;

  abrirDocumentoMembretado({
    titulo: "Planeación semanal de terapias",
    bodyHtml: body,
    config,
    extraCss,
  });
}
