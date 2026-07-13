"use client";

import { useMemo, useState } from "react";

import { differenceInCalendarDays, format, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Receipt,
  RotateCcw,
  Search,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LudaCard } from "@/components/ui/luda-card";
import { LudaStat } from "@/components/ui/luda-stat";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useConfiguracion } from "@/hooks/use-configuracion";
import { useCobranza, useMarcarPago, type PagoCobranza } from "@/hooks/use-cobranza";
import { ESTATUS_PAGO_OPCIONES, METODO_PAGO_OPCIONES } from "@/lib/catalogos";
import { descargarCSV } from "@/lib/csv";
import {
  DIAS_LIMITE_PAGO,
  INTERES_MORATORIO_PCT,
  infoLimitePago,
} from "@/lib/pagos-limite";
import { imprimirRecibo } from "@/lib/print-recibo";
import { ESTATUS_PAGO_CLASES, ESTATUS_PAGO_LABEL } from "@/types/app.types";
import type { EstatusPago, MetodoPago } from "@/types/database.types";

const mx = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

/** Días que lleva pendiente un pago desde su creación. */
function diasPendiente(p: PagoCobranza): number {
  return differenceInCalendarDays(new Date(), new Date(p.created_at));
}

export function CobranzaCliente() {
  const { data: pagos = [], isLoading } = useCobranza();
  const { data: config } = useConfiguracion();
  const marcar = useMarcarPago();
  const confirmar = useConfirm();
  const [filtro, setFiltro] = useState<EstatusPago | "">("");
  const [busqueda, setBusqueda] = useState("");
  const [marcarPara, setMarcarPara] = useState<PagoCobranza | null>(null);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return pagos
      .filter((p) => (filtro ? p.estatus === filtro : true))
      .filter((p) =>
        q
          ? p.paciente_nombre.toLowerCase().includes(q) ||
            p.expediente.toLowerCase().includes(q) ||
            p.concepto.toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => {
        // Pendientes primero, y dentro de ellos los más vencidos arriba.
        const ap = a.estatus === "pendiente" ? 0 : 1;
        const bp = b.estatus === "pendiente" ? 0 : 1;
        if (ap !== bp) return ap - bp;
        if (ap === 0) return diasPendiente(b) - diasPendiente(a);
        return +new Date(b.created_at) - +new Date(a.created_at);
      });
  }, [pagos, filtro, busqueda]);

  const totales = useMemo(() => {
    const ahora = new Date();
    let ingresosMes = 0;
    let pendiente = 0;
    let totalPagado = 0;
    let vencido = 0;
    for (const p of pagos) {
      const monto = Number(p.monto_final ?? 0);
      if (p.estatus === "pagado") {
        totalPagado += monto;
        if (p.fecha_pago && isSameMonth(new Date(p.fecha_pago), ahora))
          ingresosMes += monto;
      }
      if (p.estatus === "pendiente") {
        pendiente += monto;
        if (infoLimitePago(p.created_at).vencido) vencido += monto;
      }
    }
    return { ingresosMes, pendiente, totalPagado, vencido };
  }, [pagos]);

  async function cambiarEstatus(id: string, estatus: EstatusPago, titulo: string) {
    const ok = await confirmar({
      titulo,
      mensaje: `¿Confirmas este cambio de estatus del pago?`,
      confirmar: "Confirmar",
      peligro: estatus === "cancelado" || estatus === "reembolsado",
    });
    if (!ok) return;
    await marcar.mutateAsync({ id, estatus });
    toast.success("Pago actualizado");
  }

  function exportar() {
    descargarCSV(
      `cobranza-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Paciente", "Expediente", "Concepto", "Monto", "Estatus", "Fecha"],
      visibles.map((p) => [
        p.paciente_nombre,
        p.expediente,
        p.concepto,
        Number(p.monto_final ?? 0),
        ESTATUS_PAGO_LABEL[p.estatus],
        (p.fecha_pago ?? p.created_at).slice(0, 10),
      ]),
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-fredoka text-3xl text-luda-gris">Cobranza</h1>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <LudaStat label="Ingresos del mes" value={mx(totales.ingresosMes)} icon={Wallet} acento="lila" />
        <LudaStat label="Por cobrar" value={mx(totales.pendiente)} icon={Clock} acento="rosa" />
        <LudaStat label={`Vencido (límite ${DIAS_LIMITE_PAGO} días)`} value={mx(totales.vencido)} icon={AlertTriangle} acento="amarillo" />
        <LudaStat label="Total cobrado" value={mx(totales.totalPagado)} icon={CheckCircle2} acento="azul" />
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-luda-gris-light" />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar paciente, expediente o concepto…"
            className="h-9 pl-9 text-xs"
          />
        </div>
        <Select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as EstatusPago | "")}
          className="h-9 w-auto text-xs"
        >
          <option value="">Todos los estatus</option>
          {ESTATUS_PAGO_OPCIONES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <span className="text-sm text-luda-gris-light">
          {visibles.length} pago(s)
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
        {visibles.map((p) => {
          const info =
            p.estatus === "pendiente" ? infoLimitePago(p.created_at) : null;
          const vencido = info?.vencido ?? false;
          return (
            <LudaCard
              key={p.id}
              className={`flex flex-wrap items-center gap-3 p-4 ${
                vencido
                  ? "border-l-4 border-l-red-400"
                  : info?.porVencer
                    ? "border-l-4 border-l-yellow-400"
                    : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-luda-gris">
                  {p.paciente_nombre}{" "}
                  <span className="font-normal text-luda-gris-light">
                    · {p.expediente}
                  </span>
                </p>
                <p className="text-xs text-luda-gris-light">
                  {p.concepto} ·{" "}
                  {p.fecha_pago
                    ? format(new Date(p.fecha_pago), "d 'de' MMM yyyy", { locale: es })
                    : format(new Date(p.created_at), "d 'de' MMM yyyy", { locale: es })}
                  {info && (
                    <span
                      className={
                        vencido
                          ? "font-semibold text-red-600"
                          : info.porVencer
                            ? "font-semibold text-yellow-600"
                            : ""
                      }
                    >
                      {" "}· Límite {format(info.limite, "d MMM", { locale: es })} ·{" "}
                      {vencido
                        ? `vencido hace ${Math.abs(info.diasRestantes)} día(s) · +${INTERES_MORATORIO_PCT}% interés`
                        : info.diasRestantes === 0
                          ? "vence hoy"
                          : `quedan ${info.diasRestantes} día(s)`}
                    </span>
                  )}
                </p>
              </div>
              <p className="text-sm font-bold text-luda-gris">
                {mx(Number(p.monto_final ?? 0))}
              </p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  ESTATUS_PAGO_CLASES[p.estatus]
                }`}
              >
                {ESTATUS_PAGO_LABEL[p.estatus]}
              </span>
              {p.estatus === "pendiente" && (
                <Button size="sm" variant="outline" onClick={() => setMarcarPara(p)}>
                  <CheckCircle2 className="h-4 w-4" /> Marcar pagado
                </Button>
              )}
              {p.estatus === "pagado" && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => imprimirRecibo(p, p.paciente_nombre, config)}
                  >
                    <Receipt className="h-4 w-4" /> Recibo
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-luda-gris-light hover:text-red-500"
                    onClick={() =>
                      cambiarEstatus(p.id, "reembolsado", "Marcar como reembolsado")
                    }
                  >
                    <RotateCcw className="h-4 w-4" /> Reembolsar
                  </Button>
                </>
              )}
              {(p.estatus === "pendiente" || p.estatus === "pagado") && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-luda-gris-light hover:text-red-500"
                  onClick={() => cambiarEstatus(p.id, "cancelado", "Cancelar pago")}
                >
                  <XCircle className="h-4 w-4" /> Cancelar
                </Button>
              )}
            </LudaCard>
          );
        })}
        {!isLoading && visibles.length === 0 && (
          <LudaCard className="p-6">
            <p className="text-sm text-luda-gris-light">No hay pagos.</p>
          </LudaCard>
        )}
      </div>

      {marcarPara && (
        <ModalMarcarPagado
          pago={marcarPara}
          marcando={marcar.isPending}
          onCerrar={() => setMarcarPara(null)}
          onConfirmar={async (metodoPago) => {
            await marcar.mutateAsync({
              id: marcarPara.id,
              estatus: "pagado",
              metodoPago,
            });
            toast.success("Pago marcado como pagado");
            setMarcarPara(null);
          }}
        />
      )}
    </div>
  );
}

function ModalMarcarPagado({
  pago,
  marcando,
  onCerrar,
  onConfirmar,
}: {
  pago: PagoCobranza;
  marcando: boolean;
  onCerrar: () => void;
  onConfirmar: (metodoPago: MetodoPago) => Promise<void>;
}) {
  const [metodo, setMetodo] = useState<MetodoPago>(pago.metodo_pago as MetodoPago);

  return (
    <Modal abierto onCerrar={onCerrar} titulo="Marcar pago como pagado">
      <div className="space-y-4">
        <p className="text-sm text-luda-gris-light">
          {pago.paciente_nombre} · {pago.concepto} ·{" "}
          {mx(Number(pago.monto_final ?? 0))}
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="metodo-real">¿Con qué método se cobró?</Label>
          <Select
            id="metodo-real"
            value={metodo}
            onChange={(e) => setMetodo(e.target.value as MetodoPago)}
          >
            {METODO_PAGO_OPCIONES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={marcando}
            onClick={() => onConfirmar(metodo)}
          >
            {marcando ? "Guardando…" : "Confirmar pago"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
