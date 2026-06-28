"use client";

import { useMemo, useState } from "react";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { GitCompare } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  LudaCard,
  LudaCardContent,
  LudaCardHeader,
  LudaCardTitle,
} from "@/components/ui/luda-card";
import { Select } from "@/components/ui/select";
import {
  useEvaluacionDetalle,
  type Evaluacion,
} from "@/hooks/use-evaluaciones";
import { TIPO_PRUEBA_OPCIONES } from "@/lib/catalogos";

const tipoLabel = (v: string) =>
  TIPO_PRUEBA_OPCIONES.find((t) => t.value === v)?.label ?? v;
const fecha = (f: string) => format(new Date(f), "d MMM yyyy", { locale: es });

export function Comparativa({ evaluaciones }: { evaluaciones: Evaluacion[] }) {
  const [aId, setAId] = useState("");
  const [bId, setBId] = useState("");

  const a = evaluaciones.find((e) => e.id === aId);
  // La segunda aplicación debe ser del mismo instrumento.
  const opcionesB = a
    ? evaluaciones.filter((e) => e.tipo_prueba === a.tipo_prueba && e.id !== a.id)
    : [];

  const { data: detA } = useEvaluacionDetalle(aId || null);
  const { data: detB } = useEvaluacionDetalle(bId || null);

  const data = useMemo(() => {
    if (!detA || !detB) return [];
    const nombres = [
      ...new Set([
        ...detA.subpruebas.map((s) => s.nombre_subprueba),
        ...detB.subpruebas.map((s) => s.nombre_subprueba),
      ]),
    ];
    return nombres.map((n) => ({
      nombre: n,
      "1ª aplicación":
        detA.subpruebas.find((s) => s.nombre_subprueba === n)?.percentil ?? 0,
      "2ª aplicación":
        detB.subpruebas.find((s) => s.nombre_subprueba === n)?.percentil ?? 0,
    }));
  }, [detA, detB]);

  if (evaluaciones.length < 2) return null;

  return (
    <LudaCard>
      <LudaCardHeader>
        <LudaCardTitle className="flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-luda-lila-dark" /> Comparar avance
          (pre / post)
        </LudaCardTitle>
      </LudaCardHeader>
      <LudaCardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Select
            value={aId}
            onChange={(e) => {
              setAId(e.target.value);
              setBId("");
            }}
            className="h-9 w-auto text-xs"
          >
            <option value="">1ª aplicación…</option>
            {evaluaciones.map((e) => (
              <option key={e.id} value={e.id}>
                {tipoLabel(e.tipo_prueba)} · {fecha(e.fecha_aplicacion)}
              </option>
            ))}
          </Select>
          <Select
            value={bId}
            onChange={(e) => setBId(e.target.value)}
            disabled={!aId}
            className="h-9 w-auto text-xs"
          >
            <option value="">2ª aplicación…</option>
            {opcionesB.map((e) => (
              <option key={e.id} value={e.id}>
                {tipoLabel(e.tipo_prueba)} · {fecha(e.fecha_aplicacion)}
              </option>
            ))}
          </Select>
        </div>

        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-luda-gris-light">
            Elige dos aplicaciones del mismo instrumento para ver el avance por
            percentil.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="nombre" fontSize={11} />
              <YAxis domain={[0, 100]} fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="1ª aplicación" fill="#A8C8E8" radius={[6, 6, 0, 0]} />
              <Bar dataKey="2ª aplicación" fill="#9B70C4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </LudaCardContent>
    </LudaCard>
  );
}
