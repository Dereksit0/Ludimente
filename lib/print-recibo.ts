import type { Tables } from "@/types/database.types";
import { METODO_PAGO_OPCIONES } from "@/lib/catalogos";

type Pago = Tables<"pagos">;
type ConfigRecibo = Pick<
  Tables<"configuracion">,
  "nombre_consultorio" | "slogan" | "direccion" | "telefono" | "email"
>;

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;",
  );

const mx = (n: number) =>
  `$${Number(n).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

const metodoLabel = (v: string) =>
  METODO_PAGO_OPCIONES.find((m) => m.value === v)?.label ?? v;

/** Abre una ventana imprimible (Guardar como PDF) con el recibo de pago. */
export function imprimirRecibo(
  pago: Pago,
  pacienteNombre: string,
  config?: ConfigRecibo | null,
) {
  const folio = `REC-${pago.id.slice(0, 8).toUpperCase()}`;
  const fecha = pago.fecha_pago
    ? new Date(pago.fecha_pago).toLocaleDateString("es-MX")
    : new Date(pago.created_at).toLocaleDateString("es-MX");

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Recibo ${esc(folio)}</title>
<style>
  *{font-family:Arial,Helvetica,sans-serif;color:#3d3d3d}
  body{max-width:620px;margin:32px auto;padding:0 24px}
  .top{display:flex;justify-content:space-between;align-items:flex-start}
  h1{color:#9B70C4;margin:0;font-size:22px}
  .sub{color:#888;font-size:12px}
  .folio{text-align:right;font-size:12px}
  .folio b{display:block;font-size:16px;color:#3d3d3d}
  h2{font-size:13px;color:#9B70C4;border-bottom:2px solid #eee;padding-bottom:4px;margin:24px 0 8px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  td{padding:6px 0}
  .tot{border-top:2px solid #eee;font-weight:bold;font-size:16px}
  .right{text-align:right}
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
    <div class="folio">
      Recibo de pago<b>${esc(folio)}</b>
      <span class="sub">${esc(fecha)}</span>
    </div>
  </div>

  <h2>Recibí de</h2>
  <p>${esc(pacienteNombre)}</p>

  <h2>Concepto</h2>
  <table>
    <tr><td>${esc(pago.concepto)}</td><td class="right">${mx(pago.monto)}</td></tr>
    ${
      Number(pago.descuento) > 0
        ? `<tr><td>Descuento</td><td class="right">- ${mx(pago.descuento)}</td></tr>`
        : ""
    }
    <tr class="tot"><td>Total</td><td class="right">${mx(pago.monto_final ?? 0)}</td></tr>
  </table>

  <h2>Forma de pago</h2>
  <p>${esc(metodoLabel(pago.metodo_pago))}${
    pago.referencia ? ` · Ref. ${esc(pago.referencia)}` : ""
  }</p>

  <div class="pie">Gracias por su confianza · ${esc(config?.nombre_consultorio ?? "Ludimente")}</div>
</body></html>`;

  const win = window.open("", "_blank", "width=720,height=820");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
