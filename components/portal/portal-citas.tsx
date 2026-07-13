"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, CalendarPlus, Check, Clock, Loader2, X } from "lucide-react";

import {
  LudaCard,
  LudaCardContent,
  LudaCardHeader,
  LudaCardTitle,
} from "@/components/ui/luda-card";
import type { PortalCita, PortalSolicitud } from "@/lib/portal/data";
import { TIPO_CITA_LABEL } from "@/types/app.types";

import { confirmarCitaPortal, solicitarCitaPortal } from "../../app/portal/actions";

const ESTADO_SOLICITUD: Record<
  string,
  { label: string; clase: string; icon: typeof Clock }
> = {
  pendiente: { label: "En revisión", clase: "bg-yellow-50 text-yellow-700", icon: Clock },
  atendida: { label: "Agendada", clase: "bg-green-50 text-green-700", icon: Check },
  rechazada: { label: "No se pudo agendar", clase: "bg-red-50 text-red-600", icon: X },
};

export function PortalCitas({
  citas,
  solicitudes = [],
}: {
  citas: PortalCita[];
  solicitudes?: PortalSolicitud[];
}) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const [fecha, setFecha] = useState("");
  const [nota, setNota] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function confirmar(id: string) {
    setConfirmando(id);
    const r = await confirmarCitaPortal(id);
    setConfirmando(null);
    setAviso(r.ok ? "¡Gracias! Tu cita quedó confirmada." : (r.error ?? "Error"));
    if (r.ok) router.refresh();
  }

  async function solicitar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const r = await solicitarCitaPortal({ fechaPreferida: fecha, nota });
    setEnviando(false);
    if (r.ok) {
      setAviso("Solicitud enviada. El equipo te contactará para agendar.");
      setFecha("");
      setNota("");
    } else {
      setAviso(r.error ?? "No se pudo enviar.");
    }
  }

  return (
    <LudaCard>
      <LudaCardHeader>
        <LudaCardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-luda-lila-dark" /> Próximas citas
        </LudaCardTitle>
      </LudaCardHeader>
      <LudaCardContent className="space-y-3">
        {aviso && (
          <p className="rounded-xl bg-luda-lila-light px-4 py-2 text-sm font-semibold text-luda-lila-dark">
            {aviso}
          </p>
        )}

        {citas.length === 0 ? (
          <p className="text-sm text-luda-gris-light">
            No hay citas programadas por el momento.
          </p>
        ) : (
          citas.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-luda-fondo px-4 py-3"
            >
              <div>
                <p className="text-sm font-bold text-luda-gris">
                  {TIPO_CITA_LABEL[c.tipo] ?? "Cita"}
                </p>
                <p className="text-xs capitalize text-luda-gris-light">
                  {format(new Date(c.fecha), "EEEE d 'de' MMMM · h:mm a", { locale: es })}
                </p>
              </div>
              {c.estatus === "confirmada" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                  <Check className="h-3.5 w-3.5" /> Confirmada
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => confirmar(c.id)}
                  disabled={confirmando === c.id}
                  className="inline-flex items-center gap-1 rounded-lg bg-luda-lila px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-luda-lila-dark disabled:opacity-50"
                >
                  {confirmando === c.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Confirmar
                </button>
              )}
            </div>
          ))
        )}

        {/* Solicitudes recientes y su estatus */}
        {solicitudes.filter((s) => s.estatus === "pendiente").length > 0 && (
          <div className="space-y-1.5">
            {solicitudes
              .filter((s) => s.estatus === "pendiente")
              .map((s, i) => {
                const info = ESTADO_SOLICITUD[s.estatus] ?? ESTADO_SOLICITUD.pendiente;
                const Icon = info.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-xl bg-luda-fondo px-4 py-2.5"
                  >
                    <p className="min-w-0 text-xs text-luda-gris-light">
                      Solicitaste una cita
                      {s.fechaPreferida
                        ? ` para el ${format(new Date(s.fechaPreferida), "d 'de' MMM", { locale: es })}`
                        : ""}
                    </p>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${info.clase}`}
                    >
                      <Icon className="h-3.5 w-3.5" /> {info.label}
                    </span>
                  </div>
                );
              })}
          </div>
        )}

        {/* Solicitar nueva cita */}
        <form
          onSubmit={solicitar}
          className="mt-2 space-y-2 rounded-xl border border-dashed border-luda-lila/40 p-4"
        >
          <p className="flex items-center gap-1.5 text-sm font-bold text-luda-gris">
            <CalendarPlus className="h-4 w-4 text-luda-lila-dark" /> Solicitar una cita
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="rounded-xl border border-luda-lila/30 px-3 py-2 text-sm outline-none focus:border-luda-lila"
            />
            <input
              type="text"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Horario o motivo (opcional)"
              className="flex-1 rounded-xl border border-luda-lila/30 px-3 py-2 text-sm outline-none focus:border-luda-lila"
            />
            <button
              type="submit"
              disabled={enviando}
              className="inline-flex items-center gap-1 rounded-xl bg-luda-lila px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-luda-lila-dark disabled:opacity-50"
            >
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Solicitar"}
            </button>
          </div>
        </form>
      </LudaCardContent>
    </LudaCard>
  );
}
