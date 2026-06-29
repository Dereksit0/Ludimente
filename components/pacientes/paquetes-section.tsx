"use client";

import { useState } from "react";

import { Package, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LudaCard } from "@/components/ui/luda-card";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import type { PacienteDetalle } from "@/hooks/use-pacientes";
import {
  useAsignarPaquete,
  useCatalogoPaquetes,
  usePaquetesPaciente,
  useRegistrarAbono,
  useUsarSesion,
  type PaquetePaciente,
} from "@/hooks/use-paquetes";

const mx = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

export function PaquetesSection({ paciente }: { paciente: PacienteDetalle }) {
  const { data: catalogo = [] } = useCatalogoPaquetes();
  const { data: asignados = [] } = usePaquetesPaciente(paciente.id);
  const asignar = useAsignarPaquete(paciente.id);
  const usar = useUsarSesion(paciente.id);
  const abonar = useRegistrarAbono(paciente.id);
  const [sel, setSel] = useState("");
  const [abonando, setAbonando] = useState<PaquetePaciente | null>(null);
  const [montoAbono, setMontoAbono] = useState("");

  async function onAsignar() {
    const paquete = catalogo.find((p) => p.id === sel);
    if (!paquete) return;
    try {
      await asignar.mutateAsync(paquete);
      setSel("");
      toast.success("Paquete asignado");
    } catch {
      toast.error("No se pudo asignar el paquete");
    }
  }

  async function onUsar(pp: PaquetePaciente) {
    try {
      await usar.mutateAsync(pp);
      toast.success("Sesión descontada del paquete");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo descontar");
    }
  }

  function abrirAbono(pp: PaquetePaciente) {
    setMontoAbono(pp.saldo.toFixed(2));
    setAbonando(pp);
  }

  async function confirmarAbono(e: React.FormEvent) {
    e.preventDefault();
    if (!abonando) return;
    const monto = Number(montoAbono);
    if (!Number.isFinite(monto) || monto <= 0) {
      toast.error("Monto inválido");
      return;
    }
    if (monto > abonando.saldo) {
      toast.error(`El abono no puede superar el saldo (${mx(abonando.saldo)})`);
      return;
    }
    try {
      await abonar.mutateAsync({
        paquete_paciente_id: abonando.id,
        monto,
        metodo_pago: "efectivo",
      });
      toast.success("Abono registrado");
      setAbonando(null);
    } catch {
      toast.error("No se pudo registrar el abono");
    }
  }

  return (
    <LudaCard className="space-y-4 p-5">
      <h3 className="flex items-center gap-2 font-bold text-luda-gris">
        <Package className="h-4 w-4 text-luda-lila-dark" /> Paquetes de sesiones
      </h3>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={sel}
          onChange={(e) => setSel(e.target.value)}
          className="h-9 w-auto text-xs"
        >
          <option value="">Elegir paquete…</option>
          {catalogo.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} · {p.num_sesiones} sesiones · {mx(p.precio)}
            </option>
          ))}
        </Select>
        <Button size="sm" onClick={onAsignar} disabled={!sel || asignar.isPending}>
          <Plus className="h-4 w-4" /> Asignar
        </Button>
      </div>

      {asignados.length === 0 ? (
        <p className="text-sm text-luda-gris-light">
          Este paciente no tiene paquetes asignados.
        </p>
      ) : (
        <div className="space-y-2">
          {asignados.map((pp) => {
            const restantes = pp.sesiones_totales - pp.sesiones_usadas;
            return (
              <div
                key={pp.id}
                className="flex flex-wrap items-center gap-3 rounded-xl bg-luda-fondo p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-luda-gris">{pp.nombre}</p>
                  <p className="text-xs text-luda-gris-light">
                    {restantes} de {pp.sesiones_totales} sesiones disponibles ·
                    Abonado {mx(pp.abonado)} / {mx(Number(pp.precio_total))}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    pp.saldo <= 0
                      ? "bg-green-50 text-green-700"
                      : "bg-yellow-50 text-yellow-700"
                  }`}
                >
                  {pp.saldo <= 0 ? "Liquidado" : `Saldo ${mx(pp.saldo)}`}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={restantes <= 0 || usar.isPending}
                  onClick={() => onUsar(pp)}
                >
                  Usar sesión
                </Button>
                {pp.saldo > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => abrirAbono(pp)}
                  >
                    Abono
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {abonando && (
        <Modal
          abierto
          onCerrar={() => setAbonando(null)}
          titulo="Registrar abono"
          className="max-w-sm"
        >
          <form onSubmit={confirmarAbono} className="space-y-4">
            <p className="text-sm text-luda-gris-light">
              {abonando.nombre} · Saldo {mx(abonando.saldo)}
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="monto-abono">Monto del abono</Label>
              <Input
                id="monto-abono"
                type="number"
                min="0"
                step="0.01"
                autoFocus
                value={montoAbono}
                onChange={(e) => setMontoAbono(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAbonando(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={abonar.isPending}>
                {abonar.isPending ? "Guardando…" : "Registrar"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </LudaCard>
  );
}
