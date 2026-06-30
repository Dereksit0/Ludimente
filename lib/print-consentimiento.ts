import type { ConsentimientoListItem } from "@/hooks/use-consentimientos";
import { TIPO_CONSENTIMIENTO_LABEL } from "@/lib/catalogos";
import {
  abrirDocumentoMembretado,
  escMembrete as esc,
  type ConfigMembrete,
} from "@/lib/print-membrete";

const fecha = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("es-MX") : "";

/** Abre una ventana imprimible con el consentimiento membretado y su firma. */
export function imprimirConsentimiento(
  c: ConsentimientoListItem,
  config?: ConfigMembrete,
) {
  const firmaHtml =
    c.firmado && c.firma_data
      ? `<img src="${c.firma_data}" alt="Firma" style="max-height:90px"/>`
      : `<div style="height:90px;border-bottom:1px solid #999"></div>`;

  const body = `
  <p class="lm-doc-title">${esc(c.titulo)}</p>
  <p class="lm-doc-sub">${esc(TIPO_CONSENTIMIENTO_LABEL[c.tipo] ?? c.tipo)} · ${esc(
    c.paciente_nombre,
  )} · Expediente ${esc(c.expediente)}</p>

  <p class="lm-texto" style="white-space:pre-line;line-height:1.7;margin-top:14px">${esc(
    c.contenido ?? "",
  )}</p>

  <div class="lm-firma" style="margin-top:60px">
    ${firmaHtml}
    <div style="font-size:12px;color:#555;margin-top:6px">
      ${esc(c.firmante_nombre ?? "Nombre y firma del padre, madre o tutor")}${
        c.firmante_parentesco ? ` · ${esc(c.firmante_parentesco)}` : ""
      }
      ${c.firmado_at ? `<br>Firmado el ${esc(fecha(c.firmado_at))}` : ""}
    </div>
  </div>`;

  abrirDocumentoMembretado({
    titulo: `${c.titulo} · ${c.paciente_nombre}`,
    bodyHtml: body,
    config,
    extraCss: ".lm-firma{border-top:none;width:60%;text-align:left}",
  });
}
