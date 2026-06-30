import type { CampoFormato, Formato } from "@/lib/formatos/plantillas-formato";
import {
  abrirDocumentoMembretado,
  escMembrete as esc,
  type ConfigMembrete,
} from "@/lib/print-membrete";

/** Respuestas guardadas: clave "seccion.campo" → valor según el tipo de campo. */
export type RespuestasFormato = Record<string, unknown>;

const lineaEnBlanco = `<div style="border-bottom:1px solid #bbb;height:20px;margin:6px 0"></div>`;

function valorTexto(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function campoHtml(
  c: CampoFormato,
  key: string,
  respuestas?: RespuestasFormato,
): string {
  const lleno = respuestas !== undefined;
  const val = respuestas?.[key];

  switch (c.tipo) {
    case "texto":
      return `<div class="fmt-texto${c.ancho === "completo" ? " fmt-full" : ""}">
        <span class="fmt-label">${esc(c.label)}:</span>
        ${
          lleno
            ? `<span class="fmt-fill">${esc(valorTexto(val)) || "&nbsp;"}</span>`
            : `<span class="fmt-blank"></span>`
        }
      </div>`;

    case "lineas": {
      const texto = valorTexto(val);
      const cuerpo = lleno
        ? texto.trim()
          ? texto
              .split("\n")
              .map((l) => `<div class="fmt-fill-line">${esc(l) || "&nbsp;"}</div>`)
              .join("")
          : `<div class="fmt-fill-line">&nbsp;</div>`
        : Array.from({ length: c.n }).map(() => lineaEnBlanco).join("");
      return `<div class="fmt-full">
        ${c.label ? `<p class="fmt-label-block">${esc(c.label)}</p>` : ""}
        ${cuerpo}
      </div>`;
    }

    case "checklist": {
      const cols = c.columnas ?? 2;
      const sel = Array.isArray(val) ? (val as string[]) : [];
      return `<div class="fmt-full"><div class="fmt-check" style="grid-template-columns:repeat(${cols},1fr)">
        ${c.opciones
          .map((o) => {
            const marca = lleno
              ? sel.includes(o)
                ? "☑"
                : "☐"
              : `<span class="fmt-box"></span>`;
            return `<label class="fmt-check-item">${marca} ${esc(o)}</label>`;
          })
          .join("")}
      </div></div>`;
    }

    case "escala": {
      const elegido = (val ?? {}) as Record<string, number>;
      const head = c.niveles
        .map((n) => `<th style="text-align:center;width:60px">${esc(n)}</th>`)
        .join("");
      const filas = c.filas
        .map((f, fi) => {
          const sel = lleno ? elegido[String(fi)] : undefined;
          const celdas = c.niveles
            .map(
              (_, ni) =>
                `<td style="text-align:center">${
                  lleno && sel === ni ? "☑" : "☐"
                }</td>`,
            )
            .join("");
          return `<tr><td>${esc(f)}</td>${celdas}</tr>`;
        })
        .join("");
      return `<div class="fmt-full"><table><thead><tr><th>Conducta observada</th>${head}</tr></thead><tbody>${filas}</tbody></table></div>`;
    }

    case "tabla": {
      const datos = Array.isArray(val) ? (val as string[][]) : [];
      const head = c.columnas.map((col) => `<th>${esc(col)}</th>`).join("");
      const filas = Array.from({ length: c.filas })
        .map((_, ri) => {
          const fila = datos[ri] ?? [];
          return `<tr>${c.columnas
            .map(
              (_, ci) =>
                `<td style="height:24px">${lleno ? esc(fila[ci] ?? "") : ""}</td>`,
            )
            .join("")}</tr>`;
        })
        .join("");
      return `<div class="fmt-full"><table><thead><tr>${head}</tr></thead><tbody>${filas}</tbody></table></div>`;
    }

    case "parrafo":
      return `<div class="fmt-full"><p>${esc(c.texto)}</p></div>`;
  }
}

/**
 * Abre una ventana imprimible con un formato.
 * Si `respuestas` es undefined → formato en blanco.
 * Si trae datos → formato ya lleno.
 */
export function imprimirFormato(
  formato: Formato,
  config?: ConfigMembrete,
  respuestas?: RespuestasFormato,
  pacienteNombre?: string,
) {
  const secciones = formato.secciones
    .map(
      (s, si) => `<h2>${esc(s.titulo)}</h2>
      <div class="fmt-grid">${s.campos
        .map((c, ci) => campoHtml(c, `${si}.${ci}`, respuestas))
        .join("")}</div>`,
    )
    .join("");

  const body = `
  <p class="lm-doc-title">${esc(formato.titulo)}</p>
  ${pacienteNombre ? `<p class="lm-doc-sub">Paciente: ${esc(pacienteNombre)}</p>` : ""}
  ${formato.instrucciones ? `<p class="lm-doc-sub">${esc(formato.instrucciones)}</p>` : ""}
  ${secciones}`;

  const extraCss = `
    .fmt-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin-top:6px}
    .fmt-full{grid-column:1 / -1}
    .fmt-texto{display:flex;align-items:baseline;gap:6px;font-size:12px;padding:3px 0}
    .fmt-label{color:#5a4a72;font-weight:600;white-space:nowrap}
    .fmt-blank{flex:1;border-bottom:1px solid #bbb;height:16px}
    .fmt-fill{flex:1;border-bottom:1px solid #bbb;min-height:16px;color:#222}
    .fmt-fill-line{border-bottom:1px solid #eee;min-height:18px;padding:2px 0;color:#222}
    .fmt-label-block{color:#5a4a72;font-weight:600;font-size:12px;margin:6px 0 2px}
    .fmt-check{display:grid;gap:6px 16px;font-size:12px;margin-top:4px}
    .fmt-check-item{display:flex;align-items:center;gap:6px}
    .fmt-box{display:inline-block;width:13px;height:13px;border:1.5px solid #9B70C4;border-radius:3px}
    h2{page-break-after:avoid}
    table{page-break-inside:auto}
    tr{page-break-inside:avoid}
  `;

  abrirDocumentoMembretado({
    titulo: pacienteNombre
      ? `${formato.titulo} - ${pacienteNombre}`
      : formato.titulo,
    bodyHtml: body,
    config,
    extraCss,
  });
}
