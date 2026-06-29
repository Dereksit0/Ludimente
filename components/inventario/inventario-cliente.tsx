"use client";

import { useMemo, useState } from "react";

import { differenceInCalendarDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, Boxes, PackageX, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LudaCard } from "@/components/ui/luda-card";
import { LudaStat } from "@/components/ui/luda-stat";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useActualizarItem,
  useCrearItem,
  useEliminarItem,
  useInventario,
  type ItemInventario,
} from "@/hooks/use-inventario";
import {
  CATEGORIA_INVENTARIO_LABEL,
  CATEGORIA_INVENTARIO_OPCIONES,
  ESTADO_INVENTARIO_CLASES,
  ESTADO_INVENTARIO_LABEL,
  ESTADO_INVENTARIO_OPCIONES,
} from "@/lib/catalogos";
import { itemInventarioSchema, primerError } from "@/lib/validations/modulos.schema";

export function InventarioCliente() {
  const { data: items = [], isLoading } = useInventario();
  const eliminar = useEliminarItem();
  const confirmar = useConfirm();
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [estado, setEstado] = useState("");
  const [editar, setEditar] = useState<ItemInventario | null>(null);
  const [crear, setCrear] = useState(false);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return items
      .filter((i) => (categoria ? i.categoria === categoria : true))
      .filter((i) => (estado ? i.estado === estado : true))
      .filter((i) =>
        q
          ? i.nombre.toLowerCase().includes(q) ||
            (i.ubicacion ?? "").toLowerCase().includes(q)
          : true,
      );
  }, [items, busqueda, categoria, estado]);

  const stats = useMemo(() => {
    const total = items.reduce((a, i) => a + i.cantidad, 0);
    const prestados = items.filter((i) => i.estado === "prestado").length;
    const agotados = items.filter(
      (i) => i.estado === "agotado" || i.cantidad === 0,
    ).length;
    return { tipos: items.length, total, prestados, agotados };
  }, [items]);

  const DIAS_PRESTAMO = 14;
  const alertas = useMemo(() => {
    const stockBajo = items.filter(
      (i) => i.estado !== "agotado" && i.cantidad <= 1,
    );
    const prestamosVencidos = items.filter(
      (i) =>
        i.estado === "prestado" &&
        i.fecha_prestamo &&
        differenceInCalendarDays(new Date(), new Date(i.fecha_prestamo)) >=
          DIAS_PRESTAMO,
    );
    return { stockBajo, prestamosVencidos };
  }, [items]);

  async function borrar(id: string) {
    const ok = await confirmar({
      titulo: "Eliminar artículo",
      mensaje: "¿Eliminar este artículo del inventario?",
      confirmar: "Eliminar",
      peligro: true,
    });
    if (!ok) return;
    await eliminar.mutateAsync(id);
    toast.success("Artículo eliminado");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-fredoka text-3xl text-luda-gris">Inventario</h1>
          <p className="mt-1 text-sm text-luda-gris-light">
            Materiales, pruebas y recursos del consultorio.
          </p>
        </div>
        <Button onClick={() => setCrear(true)}>
          <Plus /> Nuevo artículo
        </Button>
      </div>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <LudaStat label="Tipos de artículo" value={stats.tipos} icon={Boxes} acento="lila" />
        <LudaStat label="Unidades totales" value={stats.total} icon={Boxes} acento="azul" />
        <LudaStat label="Prestados" value={stats.prestados} icon={Boxes} acento="amarillo" />
        <LudaStat label="Agotados" value={stats.agotados} icon={PackageX} acento="rosa" />
      </section>

      {(alertas.stockBajo.length > 0 || alertas.prestamosVencidos.length > 0) && (
        <div className="space-y-2 rounded-2xl border border-yellow-300 bg-yellow-50/60 p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-yellow-700">
            <AlertTriangle className="h-4 w-4" /> Atención
          </p>
          {alertas.stockBajo.length > 0 && (
            <p className="text-xs text-luda-gris">
              <b>Stock bajo:</b>{" "}
              {alertas.stockBajo.map((i) => i.nombre).join(", ")}
            </p>
          )}
          {alertas.prestamosVencidos.length > 0 && (
            <p className="text-xs text-luda-gris">
              <b>Préstamos vencidos (+{DIAS_PRESTAMO} días):</b>{" "}
              {alertas.prestamosVencidos
                .map(
                  (i) =>
                    `${i.nombre}${i.prestado_a ? ` (${i.prestado_a}` : ""}${
                      i.fecha_prestamo
                        ? `, ${format(new Date(i.fecha_prestamo), "d MMM", { locale: es })})`
                        : i.prestado_a
                          ? ")"
                          : ""
                    }`,
                )
                .join(", ")}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-luda-gris-light" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar artículo o ubicación…"
            className="h-9 pl-9 text-xs"
          />
        </div>
        <Select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="h-9 w-auto text-xs"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIA_INVENTARIO_OPCIONES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="h-9 w-auto text-xs"
        >
          <option value="">Todos los estados</option>
          {ESTADO_INVENTARIO_OPCIONES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      {isLoading && <p className="text-sm text-luda-gris-light">Cargando…</p>}

      {!isLoading && visibles.length === 0 && (
        <LudaCard className="p-8 text-center">
          <Boxes className="mx-auto h-10 w-10 text-luda-lila" />
          <p className="mt-3 font-semibold text-luda-gris">Sin artículos</p>
          <p className="mt-1 text-sm text-luda-gris-light">
            Registra el primer material o test del consultorio.
          </p>
        </LudaCard>
      )}

      <div className="space-y-2">
        {visibles.map((i) => (
          <LudaCard
            key={i.id}
            className="flex flex-wrap items-center gap-3 p-4"
          >
            <button
              type="button"
              onClick={() => setEditar(i)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="truncate text-sm font-bold text-luda-gris">
                {i.nombre}{" "}
                <span className="font-normal text-luda-gris-light">
                  · {CATEGORIA_INVENTARIO_LABEL[i.categoria] ?? i.categoria}
                </span>
              </p>
              <p className="text-xs text-luda-gris-light">
                Cant.: {i.cantidad}
                {i.ubicacion ? ` · ${i.ubicacion}` : ""}
                {i.estado === "prestado" && i.prestado_a
                  ? ` · Prestado a ${i.prestado_a}`
                  : ""}
              </p>
            </button>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                ESTADO_INVENTARIO_CLASES[i.estado] ?? ""
              }`}
            >
              {ESTADO_INVENTARIO_LABEL[i.estado] ?? i.estado}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Eliminar"
              onClick={() => borrar(i.id)}
              className="h-9 w-9 text-luda-gris-light hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </LudaCard>
        ))}
      </div>

      {(crear || editar) && (
        <ModalItem item={editar} onCerrar={() => { setCrear(false); setEditar(null); }} />
      )}
    </div>
  );
}

function ModalItem({
  item,
  onCerrar,
}: {
  item: ItemInventario | null;
  onCerrar: () => void;
}) {
  const crear = useCrearItem();
  const actualizar = useActualizarItem();
  const editando = Boolean(item);

  const [nombre, setNombre] = useState(item?.nombre ?? "");
  const [categoria, setCategoria] = useState(item?.categoria ?? "material");
  const [cantidad, setCantidad] = useState(String(item?.cantidad ?? 1));
  const [ubicacion, setUbicacion] = useState(item?.ubicacion ?? "");
  const [estado, setEstado] = useState(item?.estado ?? "disponible");
  const [prestadoA, setPrestadoA] = useState(item?.prestado_a ?? "");
  const [fechaPrestamo, setFechaPrestamo] = useState(item?.fecha_prestamo ?? "");
  const [notas, setNotas] = useState(item?.notas ?? "");

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const val = itemInventarioSchema.safeParse({
      nombre,
      cantidad: cantidad === "" ? NaN : Number(cantidad),
    });
    if (!val.success) {
      toast.error(primerError(val.error));
      return;
    }
    const datos = {
      nombre: nombre.trim(),
      categoria,
      cantidad: Number(cantidad) || 0,
      ubicacion: ubicacion.trim() || null,
      estado,
      prestado_a: estado === "prestado" ? prestadoA.trim() || null : null,
      fecha_prestamo: estado === "prestado" ? fechaPrestamo || null : null,
      notas: notas.trim() || null,
    };
    try {
      if (item) {
        await actualizar.mutateAsync({ id: item.id, cambios: datos });
        toast.success("Artículo actualizado");
      } else {
        await crear.mutateAsync(datos);
        toast.success("Artículo agregado");
      }
      onCerrar();
    } catch {
      toast.error("No se pudo guardar");
    }
  }

  const pendiente = crear.isPending || actualizar.isPending;

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={editando ? "Editar artículo" : "Nuevo artículo"}
    >
      <form onSubmit={guardar} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. WISC-V (caja completa)"
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
              {CATEGORIA_INVENTARIO_OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cantidad">Cantidad</Label>
            <Input
              id="cantidad"
              type="number"
              min="0"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ubicacion">Ubicación</Label>
            <Input
              id="ubicacion"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              placeholder="Ej. Estante A2"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="estado">Estado</Label>
            <Select
              id="estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              {ESTADO_INVENTARIO_OPCIONES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {estado === "prestado" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="prestadoA">Prestado a</Label>
              <Input
                id="prestadoA"
                value={prestadoA}
                onChange={(e) => setPrestadoA(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fechaPrestamo">Fecha de préstamo</Label>
              <Input
                id="fechaPrestamo"
                type="date"
                value={fechaPrestamo}
                onChange={(e) => setFechaPrestamo(e.target.value)}
              />
            </div>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="notas">Notas (opcional)</Label>
          <Textarea
            id="notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pendiente}>
            {pendiente ? "Guardando…" : editando ? "Guardar" : "Agregar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
