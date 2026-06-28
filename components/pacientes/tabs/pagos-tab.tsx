"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, Plus, Receipt, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Campo } from "@/components/pacientes/form-nuevo-paciente/campo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LudaCard } from "@/components/ui/luda-card";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useCrearPago,
  useEliminarPago,
  usePagosPaciente,
  type Pago,
} from "@/hooks/use-pagos";
import { PaquetesSection } from "@/components/pacientes/paquetes-section";
import { useConfiguracion } from "@/hooks/use-configuracion";
import type { PacienteDetalle } from "@/hooks/use-pacientes";
import {
  CONCEPTOS_PAGO,
  ESTATUS_PAGO_OPCIONES,
  METODO_PAGO_OPCIONES,
} from "@/lib/catalogos";
import { imprimirRecibo } from "@/lib/print-recibo";
import { pagoSchema, type PagoInput } from "@/lib/validations/pago.schema";
import { ESTATUS_PAGO_CLASES, ESTATUS_PAGO_LABEL } from "@/types/app.types";

const mx = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

function PagoForm({
  guardando,
  onGuardar,
}: {
  guardando: boolean;
  onGuardar: (v: PagoInput) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PagoInput>({
    resolver: zodResolver(pagoSchema),
    defaultValues: {
      concepto: "",
      monto: 0,
      descuento: 0,
      metodo_pago: "efectivo",
      estatus: "pagado",
      fecha_pago: new Date().toISOString().slice(0, 10),
    },
  });

  return (
    <form onSubmit={handleSubmit(onGuardar)} className="space-y-4">
      <Campo label="Concepto" requerido error={errors.concepto?.message}>
        <Input list="conceptos-pago" {...register("concepto")} />
        <datalist id="conceptos-pago">
          {CONCEPTOS_PAGO.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Campo>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Monto" requerido error={errors.monto?.message}>
          <Input type="number" step="0.01" {...register("monto")} />
        </Campo>
        <Campo label="Descuento" error={errors.descuento?.message}>
          <Input type="number" step="0.01" {...register("descuento")} />
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Método" error={errors.metodo_pago?.message}>
          <Select {...register("metodo_pago")}>
            {METODO_PAGO_OPCIONES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </Campo>
        <Campo label="Estatus" error={errors.estatus?.message}>
          <Select {...register("estatus")}>
            {ESTATUS_PAGO_OPCIONES.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </Select>
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Campo label="Fecha de pago">
          <Input type="date" {...register("fecha_pago")} />
        </Campo>
        <Campo label="Referencia">
          <Input {...register("referencia")} />
        </Campo>
      </div>

      <Campo label="Notas">
        <Textarea {...register("notas")} />
      </Campo>

      <Button type="submit" className="w-full" disabled={guardando}>
        {guardando ? (
          <>
            <Loader2 className="animate-spin" /> Guardando…
          </>
        ) : (
          "Registrar pago"
        )}
      </Button>
    </form>
  );
}

export function PagosTab({ paciente }: { paciente: PacienteDetalle }) {
  const { data: pagos = [], isLoading } = usePagosPaciente(paciente.id);
  const { data: config } = useConfiguracion();
  const crear = useCrearPago(paciente.id);
  const eliminar = useEliminarPago(paciente.id);
  const [abierto, setAbierto] = useState(false);
  const nombrePaciente = `${paciente.nombre} ${paciente.apellido_paterno}`;

  const totalPagado = pagos
    .filter((p) => p.estatus === "pagado")
    .reduce((s, p) => s + Number(p.monto_final ?? 0), 0);
  const totalPendiente = pagos
    .filter((p) => p.estatus === "pendiente")
    .reduce((s, p) => s + Number(p.monto_final ?? 0), 0);

  async function guardar(v: PagoInput) {
    try {
      await crear.mutateAsync(v);
      toast.success("Pago registrado");
      setAbierto(false);
    } catch {
      toast.error("No se pudo registrar el pago");
    }
  }

  async function borrar(p: Pago) {
    if (!window.confirm("¿Eliminar este pago?")) return;
    await eliminar.mutateAsync(p.id);
    toast.success("Pago eliminado");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-3">
          <div className="rounded-xl bg-green-50 px-4 py-2">
            <p className="text-xs font-semibold text-green-700">Pagado</p>
            <p className="font-bold text-green-700">{mx(totalPagado)}</p>
          </div>
          <div className="rounded-xl bg-yellow-50 px-4 py-2">
            <p className="text-xs font-semibold text-yellow-700">Pendiente</p>
            <p className="font-bold text-yellow-700">{mx(totalPendiente)}</p>
          </div>
        </div>
        <Button size="sm" className="ml-auto" onClick={() => setAbierto(true)}>
          <Plus className="h-4 w-4" /> Nuevo pago
        </Button>
      </div>

      <PaquetesSection paciente={paciente} />

      {isLoading && (
        <p className="text-sm text-luda-gris-light">Cargando pagos…</p>
      )}
      {!isLoading && pagos.length === 0 && (
        <LudaCard className="p-6">
          <p className="text-sm text-luda-gris-light">
            Este paciente no tiene pagos registrados.
          </p>
        </LudaCard>
      )}

      <div className="space-y-2">
        {pagos.map((p) => (
          <LudaCard key={p.id} className="flex items-center gap-3 p-4">
            <div className="flex-1">
              <p className="text-sm font-bold text-luda-gris">{p.concepto}</p>
              <p className="text-xs text-luda-gris-light">
                {p.fecha_pago
                  ? format(new Date(p.fecha_pago), "d 'de' MMM yyyy", {
                      locale: es,
                    })
                  : "Sin fecha"}{" "}
                · {p.metodo_pago.replace("_", " ")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-luda-gris">
                {mx(Number(p.monto_final ?? 0))}
              </p>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                  ESTATUS_PAGO_CLASES[p.estatus]
                }`}
              >
                {ESTATUS_PAGO_LABEL[p.estatus]}
              </span>
            </div>
            {p.estatus === "pagado" && (
              <button
                type="button"
                onClick={() => imprimirRecibo(p, nombrePaciente, config)}
                aria-label="Imprimir recibo"
                className="rounded-lg p-2 text-luda-gris-light hover:bg-luda-lila-light hover:text-luda-lila-dark"
              >
                <Receipt className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => borrar(p)}
              aria-label="Eliminar pago"
              className="rounded-lg p-2 text-luda-gris-light hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </LudaCard>
        ))}
      </div>

      <Modal abierto={abierto} onCerrar={() => setAbierto(false)} titulo="Nuevo pago">
        <PagoForm guardando={crear.isPending} onGuardar={guardar} />
      </Modal>
    </div>
  );
}
