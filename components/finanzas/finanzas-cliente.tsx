"use client";

import { useMemo, useState } from "react";

import { format, isSameMonth, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Download,
  Pencil,
  Plus,
  Scale,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LudaCard } from "@/components/ui/luda-card";
import { LudaStat } from "@/components/ui/luda-stat";
import { Modal } from "@/components/ui/modal";
import { RedactarBoton } from "@/components/ui/redactar-boton";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDraftState } from "@/hooks/use-form-draft";
import {
  useActualizarGasto,
  useCrearGasto,
  useEliminarGasto,
  useGastos,
  useIngresosCobrados,
  usePorCobrar,
  type Gasto,
} from "@/hooks/use-finanzas";
import {
  CATEGORIA_GASTO_LABEL,
  CATEGORIA_GASTO_OPCIONES,
  METODO_PAGO_OPCIONES,
} from "@/lib/catalogos";
import { descargarCSV } from "@/lib/csv";
import { gastoSchema, primerError } from "@/lib/validations/modulos.schema";

const mx = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

const hoy = () => new Date().toISOString().slice(0, 10);

export function FinanzasCliente() {
  const { data: gastos = [], isLoading } = useGastos();
  const { data: ingresos = [] } = useIngresosCobrados();
  const { data: porCobrar = 0 } = usePorCobrar();
  const eliminar = useEliminarGasto();
  const confirmar = useConfirm();
  const [crear, setCrear] = useState(false);
  const [editar, setEditar] = useState<Gasto | null>(null);
  const [categoria, setCategoria] = useState("");

  const ahora = new Date();

  const totales = useMemo(() => {
    const ingresoMes = ingresos
      .filter((i) => isSameMonth(parseISO(i.fecha), ahora))
      .reduce((a, i) => a + i.monto, 0);
    const egresoMes = gastos
      .filter((g) => isSameMonth(parseISO(g.fecha), ahora))
      .reduce((a, g) => a + Number(g.monto), 0);
    const egresoTotal = gastos.reduce((a, g) => a + Number(g.monto), 0);
    return {
      ingresoMes,
      egresoMes,
      utilidadMes: ingresoMes - egresoMes,
      egresoTotal,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingresos, gastos]);

  /** Egresos del mes agrupados por categoría (para el desglose). */
  const porCategoria = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const g of gastos) {
      if (!isSameMonth(parseISO(g.fecha), ahora)) continue;
      mapa.set(g.categoria, (mapa.get(g.categoria) ?? 0) + Number(g.monto));
    }
    return [...mapa.entries()].sort((a, b) => b[1] - a[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gastos]);

  const visibles = useMemo(
    () => gastos.filter((g) => (categoria ? g.categoria === categoria : true)),
    [gastos, categoria],
  );

  async function borrar(id: string) {
    const ok = await confirmar({
      titulo: "Eliminar gasto",
      mensaje: "¿Eliminar este gasto registrado?",
      confirmar: "Eliminar",
      peligro: true,
    });
    if (!ok) return;
    try {
      await eliminar.mutateAsync(id);
      toast.success("Gasto eliminado");
    } catch {
      toast.error("No se pudo eliminar el gasto");
    }
  }

  function exportar() {
    descargarCSV(
      `gastos-${hoy()}.csv`,
      ["Fecha", "Categoría", "Concepto", "Proveedor", "Método", "Monto"],
      visibles.map((g) => [
        g.fecha,
        CATEGORIA_GASTO_LABEL[g.categoria] ?? g.categoria,
        g.concepto,
        g.proveedor ?? "",
        g.metodo_pago,
        Number(g.monto),
      ]),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-fredoka text-3xl text-luda-gris">Finanzas</h1>
          <p className="mt-1 text-sm text-luda-gris-light">
            Ingresos cobrados vs. egresos · {format(ahora, "MMMM yyyy", { locale: es })}
          </p>
        </div>
        <Button onClick={() => setCrear(true)}>
          <Plus /> Registrar gasto
        </Button>
      </div>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <LudaStat label="Ingresos del mes" value={mx(totales.ingresoMes)} icon={ArrowUpCircle} acento="azul" />
        <LudaStat label="Egresos del mes" value={mx(totales.egresoMes)} icon={ArrowDownCircle} acento="rosa" />
        <LudaStat
          label="Utilidad del mes"
          value={mx(totales.utilidadMes)}
          icon={Scale}
          acento={totales.utilidadMes >= 0 ? "lila" : "amarillo"}
        />
        <LudaStat label="Por cobrar" value={mx(porCobrar)} icon={Clock} acento="amarillo" />
      </section>
      <p className="-mt-2 text-xs text-luda-gris-light">
        Egresos totales registrados: {mx(totales.egresoTotal)} · El detalle de
        cobranza está en el módulo Cobranza.
      </p>

      {porCategoria.length > 0 && (
        <LudaCard className="p-5">
          <h2 className="mb-3 text-sm font-bold text-luda-gris-light">
            Egresos del mes por categoría
          </h2>
          <div className="space-y-2">
            {porCategoria.map(([cat, monto]) => {
              const pct =
                totales.egresoMes > 0 ? (monto / totales.egresoMes) * 100 : 0;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 truncate text-xs font-semibold text-luda-gris">
                    {CATEGORIA_GASTO_LABEL[cat] ?? cat}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-luda-lila-light">
                    <div
                      className="h-full rounded-full bg-luda-lila"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs font-bold text-luda-gris">
                    {mx(monto)}
                  </span>
                </div>
              );
            })}
          </div>
        </LudaCard>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="h-9 w-auto text-xs"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIA_GASTO_OPCIONES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <span className="text-sm text-luda-gris-light">
          {visibles.length} gasto(s)
        </span>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          onClick={exportar}
          disabled={visibles.length === 0}
        >
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>

      {isLoading && <p className="text-sm text-luda-gris-light">Cargando…</p>}

      <div className="space-y-2">
        {visibles.map((g) => (
          <LudaCard key={g.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-luda-gris">
                {g.concepto}{" "}
                <span className="font-normal text-luda-gris-light">
                  · {CATEGORIA_GASTO_LABEL[g.categoria] ?? g.categoria}
                </span>
              </p>
              <p className="text-xs text-luda-gris-light">
                {format(parseISO(g.fecha), "d 'de' MMM yyyy", { locale: es })}
                {g.proveedor ? ` · ${g.proveedor}` : ""} · {g.metodo_pago}
              </p>
            </div>
            <p className="text-sm font-bold text-luda-gris">{mx(Number(g.monto))}</p>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Editar gasto"
              onClick={() => setEditar(g)}
              className="h-8 w-8 text-luda-gris-light hover:bg-luda-lila-light hover:text-luda-lila-dark"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Eliminar gasto"
              onClick={() => borrar(g.id)}
              className="h-8 w-8 text-luda-gris-light hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </LudaCard>
        ))}
        {!isLoading && visibles.length === 0 && (
          <LudaCard className="p-6">
            <p className="text-sm text-luda-gris-light">No hay gastos registrados.</p>
          </LudaCard>
        )}
      </div>

      {crear && <ModalNuevoGasto onCerrar={() => setCrear(false)} />}
      {editar && (
        <ModalEditarGasto gasto={editar} onCerrar={() => setEditar(null)} />
      )}
    </div>
  );
}

function ModalEditarGasto({
  gasto,
  onCerrar,
}: {
  gasto: Gasto;
  onCerrar: () => void;
}) {
  const actualizar = useActualizarGasto();
  const [concepto, setConcepto] = useState(gasto.concepto);
  const [categoria, setCategoria] = useState(gasto.categoria);
  const [monto, setMonto] = useState(String(gasto.monto));
  const [fecha, setFecha] = useState(gasto.fecha.slice(0, 10));
  const [metodo, setMetodo] = useState(gasto.metodo_pago);
  const [proveedor, setProveedor] = useState(gasto.proveedor ?? "");
  const [notas, setNotas] = useState(gasto.notas ?? "");

  const { limpiar } = useDraftState({
    clave: `draft:gasto:${gasto.id}`,
    activo: true,
    valores: { concepto, categoria, monto, fecha, metodo, proveedor, notas },
    onRestaurar: (b) => {
      setConcepto(b.concepto);
      setCategoria(b.categoria);
      setMonto(b.monto);
      setFecha(b.fecha);
      setMetodo(b.metodo);
      setProveedor(b.proveedor);
      setNotas(b.notas);
    },
  });

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const m = Number(monto);
    const val = gastoSchema.safeParse({ concepto, monto: monto === "" ? NaN : m });
    if (!val.success) {
      toast.error(primerError(val.error));
      return;
    }
    try {
      await actualizar.mutateAsync({
        id: gasto.id,
        cambios: {
          concepto: concepto.trim(),
          categoria,
          monto: m,
          fecha,
          metodo_pago: metodo,
          proveedor: proveedor.trim() || null,
          notas: notas.trim() || null,
        },
      });
      limpiar();
      toast.success("Gasto actualizado");
      onCerrar();
    } catch {
      toast.error("No se pudo actualizar el gasto");
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Editar gasto">
      <form onSubmit={guardar} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="edit-concepto">Concepto</Label>
          <Input
            id="edit-concepto"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-categoria">Categoría</Label>
            <Select
              id="edit-categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              {CATEGORIA_GASTO_OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-monto">Monto</Label>
            <Input
              id="edit-monto"
              type="number"
              min="0"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-fecha">Fecha</Label>
            <Input
              id="edit-fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-metodo">Método de pago</Label>
            <Select
              id="edit-metodo"
              value={metodo}
              onChange={(e) => setMetodo(e.target.value)}
            >
              {METODO_PAGO_OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-proveedor">Proveedor (opcional)</Label>
          <Input
            id="edit-proveedor"
            value={proveedor}
            onChange={(e) => setProveedor(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-notas">Notas (opcional)</Label>
          <Textarea
            id="edit-notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
          <RedactarBoton valor={notas} contexto="Nota de un gasto administrativo" onRedactado={setNotas} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={actualizar.isPending}>
            {actualizar.isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ModalNuevoGasto({ onCerrar }: { onCerrar: () => void }) {
  const crear = useCrearGasto();
  const [concepto, setConcepto] = useState("");
  const [categoria, setCategoria] = useState<string>("otro");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(hoy());
  const [metodo, setMetodo] = useState("efectivo");
  const [proveedor, setProveedor] = useState("");
  const [notas, setNotas] = useState("");

  const { limpiar } = useDraftState({
    clave: "draft:gasto:nuevo",
    activo: true,
    valores: { concepto, categoria, monto, fecha, metodo, proveedor, notas },
    onRestaurar: (b) => {
      setConcepto(b.concepto);
      setCategoria(b.categoria);
      setMonto(b.monto);
      setFecha(b.fecha);
      setMetodo(b.metodo);
      setProveedor(b.proveedor);
      setNotas(b.notas);
    },
  });

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const m = Number(monto);
    const val = gastoSchema.safeParse({ concepto, monto: monto === "" ? NaN : m });
    if (!val.success) {
      toast.error(primerError(val.error));
      return;
    }
    try {
      await crear.mutateAsync({
        concepto: concepto.trim(),
        categoria,
        monto: m,
        fecha,
        metodo_pago: metodo,
        proveedor: proveedor.trim() || null,
        notas: notas.trim() || null,
      });
      limpiar();
      toast.success("Gasto registrado");
      onCerrar();
    } catch {
      toast.error("No se pudo registrar el gasto");
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Registrar gasto">
      <form onSubmit={guardar} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="concepto">Concepto</Label>
          <Input
            id="concepto"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            placeholder="Ej. Pago de renta de junio"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="categoria">Categoría</Label>
            <Select
              id="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              {CATEGORIA_GASTO_OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="monto">Monto</Label>
            <Input
              id="monto"
              type="number"
              min="0"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="fecha">Fecha</Label>
            <Input
              id="fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="metodo">Método de pago</Label>
            <Select
              id="metodo"
              value={metodo}
              onChange={(e) => setMetodo(e.target.value)}
            >
              {METODO_PAGO_OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="proveedor">Proveedor (opcional)</Label>
          <Input
            id="proveedor"
            value={proveedor}
            onChange={(e) => setProveedor(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notas">Notas (opcional)</Label>
          <Textarea
            id="notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
          <RedactarBoton valor={notas} contexto="Nota de un gasto administrativo" onRedactado={setNotas} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={crear.isPending}>
            {crear.isPending ? "Guardando…" : "Registrar gasto"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
