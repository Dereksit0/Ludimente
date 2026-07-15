"use client";

import { Input } from "@/components/ui/input";
import { RedactarBoton } from "@/components/ui/redactar-boton";
import { Textarea } from "@/components/ui/textarea";
import type { Formato } from "@/lib/formatos/plantillas-formato";
import type { RespuestasFormato } from "@/lib/print-formato";

/** Llena un formato en pantalla; los valores se guardan por clave "seccion.campo". */
export function FormatoFiller({
  formato,
  valores,
  onChange,
}: {
  formato: Formato;
  valores: RespuestasFormato;
  onChange: (key: string, valor: unknown) => void;
}) {
  return (
    <div className="space-y-5">
      {formato.secciones.map((s, si) => (
        <div key={si} className="space-y-2">
          <h3 className="border-b border-luda-lila/15 pb-1 text-sm font-bold text-luda-lila-dark">
            {s.titulo}
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {s.campos.map((c, ci) => {
              const key = `${si}.${ci}`;
              const val = valores[key];

              if (c.tipo === "texto") {
                return (
                  <div
                    key={ci}
                    className={`space-y-1 ${c.ancho === "completo" ? "sm:col-span-2" : ""}`}
                  >
                    <label className="text-xs font-semibold text-luda-gris-light">
                      {c.label}
                    </label>
                    <Input
                      value={typeof val === "string" ? val : ""}
                      onChange={(e) => onChange(key, e.target.value)}
                    />
                  </div>
                );
              }

              if (c.tipo === "lineas") {
                return (
                  <div key={ci} className="space-y-1 sm:col-span-2">
                    {c.label && (
                      <label className="text-xs font-semibold text-luda-gris-light">
                        {c.label}
                      </label>
                    )}
                    <Textarea
                      value={typeof val === "string" ? val : ""}
                      onChange={(e) => onChange(key, e.target.value)}
                      className="min-h-[70px]"
                    />
                    <RedactarBoton
                      valor={typeof val === "string" ? val : ""}
                      contexto={`Formato clínico "${c.label ?? ""}"`}
                      onRedactado={(t) => onChange(key, t)}
                    />
                  </div>
                );
              }

              if (c.tipo === "checklist") {
                const sel = Array.isArray(val) ? (val as string[]) : [];
                return (
                  <div key={ci} className="space-y-1.5 sm:col-span-2">
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {c.opciones.map((o) => (
                        <label
                          key={o}
                          className="flex items-center gap-2 text-sm text-luda-gris"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-luda-lila"
                            checked={sel.includes(o)}
                            onChange={(e) =>
                              onChange(
                                key,
                                e.target.checked
                                  ? [...sel, o]
                                  : sel.filter((x) => x !== o),
                              )
                            }
                          />
                          {o}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              }

              if (c.tipo === "escala") {
                const elegido = (val ?? {}) as Record<string, number>;
                return (
                  <div key={ci} className="space-y-1.5 sm:col-span-2">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-luda-gris-light">
                            <th className="p-1 text-left">Conducta</th>
                            {c.niveles.map((n) => (
                              <th key={n} className="p-1 text-center">
                                {n}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {c.filas.map((f, fi) => (
                            <tr key={fi} className="border-t border-luda-lila/10">
                              <td className="p-1 text-luda-gris">{f}</td>
                              {c.niveles.map((_, ni) => (
                                <td key={ni} className="p-1 text-center">
                                  <input
                                    type="radio"
                                    className="accent-luda-lila"
                                    name={`${key}-${fi}`}
                                    checked={elegido[String(fi)] === ni}
                                    onChange={() =>
                                      onChange(key, {
                                        ...elegido,
                                        [String(fi)]: ni,
                                      })
                                    }
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              if (c.tipo === "tabla") {
                const datos = Array.isArray(val) ? (val as string[][]) : [];
                return (
                  <div key={ci} className="space-y-1.5 sm:col-span-2">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-luda-gris-light">
                            {c.columnas.map((col) => (
                              <th key={col} className="p-1 text-left">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: c.filas }).map((_, ri) => (
                            <tr key={ri}>
                              {c.columnas.map((_, coli) => (
                                <td key={coli} className="p-0.5">
                                  <Input
                                    className="h-8 text-xs"
                                    value={datos[ri]?.[coli] ?? ""}
                                    onChange={(e) => {
                                      const next = datos.map((row) => [...row]);
                                      while (next.length <= ri) next.push([]);
                                      next[ri]![coli] = e.target.value;
                                      onChange(key, next);
                                    }}
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              // parrafo
              return (
                <p key={ci} className="text-sm text-luda-gris-light sm:col-span-2">
                  {c.texto}
                </p>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
