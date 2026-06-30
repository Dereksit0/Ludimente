import type { Tables } from "@/types/database.types";

/**
 * Membrete profesional compartido para documentos imprimibles
 * (evaluaciones, consentimientos, formatos de pruebas).
 *
 * Usa el logo de Ludi (pulpito de marca) en versión limpia — sin emoji —
 * y una cabecera/pie membretados con los datos del consultorio.
 */

export type ConfigMembrete = Pick<
  Tables<"configuracion">,
  "nombre_consultorio" | "slogan" | "direccion" | "telefono" | "email"
> | null | undefined;

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;",
  );

/**
 * Logo de Ludimente — pulpito lila de marca, dibujado limpio para impresión.
 * Mismas formas que <LudiMascota/> pero como markup crudo para ventanas de print.
 */
export const LOGO_LUDI_SVG = `<svg viewBox="0 0 200 200" width="56" height="56" role="img" aria-label="Ludimente">
  <g stroke-linecap="round" fill="none" stroke-width="11">
    <path d="M70 120 C50 140 40 160 52 178" stroke="#C9A8E0"/>
    <path d="M85 128 C72 152 66 170 78 186" stroke="#F2B5C8"/>
    <path d="M100 130 C100 158 100 172 100 190" stroke="#A8C8E8"/>
    <path d="M115 128 C128 152 134 170 122 186" stroke="#F7D98B"/>
    <path d="M130 120 C150 140 160 160 148 178" stroke="#A8E0C4"/>
    <path d="M58 108 C36 120 28 140 40 158" stroke="#F7C9A8"/>
  </g>
  <ellipse cx="100" cy="85" rx="55" ry="52" fill="#C9A8E0"/>
  <ellipse cx="100" cy="80" rx="46" ry="42" fill="#EDE0F8"/>
  <circle cx="74" cy="92" r="9" fill="#F2B5C8" opacity="0.7"/>
  <circle cx="126" cy="92" r="9" fill="#F2B5C8" opacity="0.7"/>
  <circle cx="84" cy="74" r="9" fill="#4A4A5A"/>
  <circle cx="116" cy="74" r="9" fill="#4A4A5A"/>
  <circle cx="87" cy="71" r="3" fill="#FDFAF6"/>
  <circle cx="119" cy="71" r="3" fill="#FDFAF6"/>
  <path d="M86 96 Q100 108 114 96" fill="none" stroke="#9B70C4" stroke-width="4" stroke-linecap="round"/>
  <path d="M100 40 l3 7 8 1 -6 6 2 8 -7 -4 -7 4 2 -8 -6 -6 8 -1z" fill="#F7D98B"/>
</svg>`;

/** CSS base compartido para todos los documentos membretados. */
export const MEMBRETE_CSS = `
  *{box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#3d3d3d;
       max-width:760px;margin:0 auto;padding:36px 40px 60px;line-height:1.55;font-size:13px}
  .lm-header{display:flex;align-items:center;gap:16px;border-bottom:3px solid #9B70C4;padding-bottom:14px}
  .lm-header .lm-logo{flex:0 0 auto;line-height:0}
  .lm-header .lm-marca{flex:1 1 auto}
  .lm-header h1{margin:0;color:#9B70C4;font-size:24px;letter-spacing:.3px}
  .lm-header .lm-slogan{margin:1px 0 6px;color:#7a6a90;font-size:12px;font-style:italic}
  .lm-header .lm-datos{color:#888;font-size:11px;line-height:1.4}
  .lm-doc-title{margin:22px 0 2px;color:#5a4a72;font-size:17px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
  .lm-doc-sub{color:#999;font-size:12px;margin:0 0 8px}
  h2{color:#9B70C4;font-size:14px;border-bottom:1px solid #eee;padding-bottom:4px;margin:22px 0 8px}
  table{width:100%;border-collapse:collapse;margin-top:8px;font-size:12px}
  th,td{border:1px solid #ddd;padding:6px 8px;vertical-align:top}
  th{background:#f5eefb;text-align:left;color:#5a4a72}
  .lm-meta{display:flex;flex-wrap:wrap;gap:6px 28px;font-size:12px;margin:10px 0}
  .lm-firma{margin-top:56px;border-top:1px solid #333;width:280px;text-align:center;padding-top:6px;font-size:12px}
  .lm-pie{position:fixed;bottom:18px;left:0;right:0;text-align:center;font-size:10px;color:#aaa}
  ul{margin:6px 0;padding-left:20px}
  p{margin:6px 0}
  @media print{body{margin:0;padding:24px 28px 56px}.lm-pie{position:fixed}}
`;

/** Cabecera membretada con logo + datos del consultorio. */
export function membreteHeader(config?: ConfigMembrete) {
  const nombre = config?.nombre_consultorio ?? "Ludimente";
  const slogan = config?.slogan ?? "Centro de evaluación e intervención psicopedagógica";
  const contacto = [config?.direccion, config?.telefono, config?.email]
    .filter(Boolean)
    .map((x) => esc(x))
    .join(" &nbsp;·&nbsp; ");
  return `<div class="lm-header">
    <div class="lm-logo">${LOGO_LUDI_SVG}</div>
    <div class="lm-marca">
      <h1>${esc(nombre)}</h1>
      <p class="lm-slogan">${esc(slogan)}</p>
      ${contacto ? `<div class="lm-datos">${contacto}</div>` : ""}
    </div>
  </div>`;
}

/** Pie membretado fijo al final de la página. */
export function membretePie(config?: ConfigMembrete) {
  const nombre = config?.nombre_consultorio ?? "Ludimente";
  return `<div class="lm-pie">${esc(nombre)} · Documento generado el ${new Date().toLocaleDateString(
    "es-MX",
    { day: "2-digit", month: "long", year: "numeric" },
  )}</div>`;
}

/**
 * Abre una ventana imprimible con el documento ya membretado.
 * `bodyHtml` es el contenido entre la cabecera y el pie.
 */
export function abrirDocumentoMembretado(opts: {
  titulo: string;
  bodyHtml: string;
  config?: ConfigMembrete;
  extraCss?: string;
}) {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>${esc(opts.titulo)}</title>
<style>${MEMBRETE_CSS}${opts.extraCss ?? ""}</style>
</head><body onload="window.print()">
${membreteHeader(opts.config)}
${opts.bodyHtml}
${membretePie(opts.config)}
</body></html>`;

  const win = window.open("", "_blank", "width=860,height=920");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

export const escMembrete = esc;
