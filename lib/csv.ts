/** Genera y descarga un archivo CSV (UTF-8 con BOM para Excel). */
export function descargarCSV(
  nombreArchivo: string,
  encabezados: string[],
  filas: (string | number | null | undefined)[][],
) {
  const escapar = (v: string | number | null | undefined) => {
    const s = String(v ?? "");
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const contenido = [
    encabezados.map(escapar).join(","),
    ...filas.map((f) => f.map(escapar).join(",")),
  ].join("\r\n");

  // BOM para que Excel reconozca acentos.
  const blob = new Blob(["﻿" + contenido], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  URL.revokeObjectURL(url);
}
