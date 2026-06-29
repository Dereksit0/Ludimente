import type { ConsentimientoListItem } from "@/hooks/use-consentimientos";
import { TIPO_CONSENTIMIENTO_LABEL } from "@/lib/catalogos";
import type { Tables } from "@/types/database.types";

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

/** Abre una ventana imprimible con el consentimiento y su firma. */
export function imprimirConsentimiento(
  c: ConsentimientoListItem,
  config?: ConfigRecibo | null,
) {
  const firmaHtml =
    c.firmado && c.firma_data
      ? `<img src="${c.firma_data}" alt="Firma" style="max-height:90px"/>`
      : `<div style="height:90px;border-bottom:1px solid #999"></div>`;

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>${esc(c.titulo)} · ${esc(c.paciente_nombre)}</title>
<style>
  *{font-family:Arial,Helvetica,sans-serif;color:#3d3d3d}
  body{max-width:720px;margin:32px auto;padding:0 24px}
  .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #eee;padding-bottom:12px}
  h1{color:#9B70C4;margin:0;font-size:22px}
  .sub{color:#888;font-size:12px;margin:2px 0}
  h2{font-size:15px;margin:24px 0 6px}
  .meta{font-size:12px;color:#888}
  .texto{font-size:13px;line-height:1.6;white-space:pre-line;margin-top:12px}
  .firma{margin-top:60px;width:60%}
  .firma .linea{font-size:12px;color:#555;margin-top:6px}
  .pie{margin-top:48px;text-align:center;font-size:11px;color:#888}
  @media print{body{margin:0}}
</style></head><body onload="window.print()">
  <div class="top">
    <div>
      <h1>🐙 ${esc(config?.nombre_consultorio ?? "Ludimente")}</h1>
      <p class="sub">${esc(config?.slogan ?? "")}</p>
      <p class="sub">${esc(config?.direccion ?? "")}</p>
      <p class="sub">${esc(config?.telefono ?? "")} ${esc(config?.email ?? "")}</p>
    </div>
  </div>

  <h2>${esc(c.titulo)}</h2>
  <p class="meta">${esc(TIPO_CONSENTIMIENTO_LABEL[c.tipo] ?? c.tipo)} · ${esc(
    c.paciente_nombre,
  )} · ${esc(c.expediente)}</p>

  <p class="texto">${esc(c.contenido ?? "")}</p>

  <div class="firma">
    ${firmaHtml}
    <div class="linea">
      ${esc(c.firmante_nombre ?? "Nombre y firma del tutor")}${
        c.firmante_parentesco ? ` · ${esc(c.firmante_parentesco)}` : ""
      }
      ${c.firmado_at ? `<br>Firmado el ${esc(fecha(c.firmado_at))}` : ""}
    </div>
  </div>

  <div class="pie">${esc(config?.nombre_consultorio ?? "Ludimente")}</div>
</body></html>`;

  const win = window.open("", "_blank", "width=820,height=900");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
