"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Bell, CheckCheck } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import {
  useMarcarNotificacion,
  useMarcarTodasNotificaciones,
  useNotificaciones,
  type Notificacion,
} from "@/hooks/use-notificaciones";

export function Campana() {
  const router = useRouter();
  const { data: notifs = [] } = useNotificaciones();
  const marcar = useMarcarNotificacion();
  const marcarTodas = useMarcarTodasNotificaciones();
  const [abierto, setAbierto] = useState(false);

  const noLeidas = notifs.filter((n) => !n.leida).length;

  function abrir(n: Notificacion) {
    if (!n.leida) marcar.mutate(n.id);
    if (n.enlace) {
      setAbierto(false);
      router.push(n.enlace);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Notificaciones"
        className="relative rounded-xl border border-luda-lila/30 bg-white p-2 text-luda-gris-light transition-colors hover:border-luda-lila"
      >
        <Bell className="h-4 w-4" />
        {noLeidas > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {noLeidas}
          </span>
        )}
      </button>

      <Modal abierto={abierto} onCerrar={() => setAbierto(false)} titulo="Notificaciones">
        {noLeidas > 0 && (
          <button
            type="button"
            onClick={() => marcarTodas.mutate()}
            className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-luda-lila-dark hover:underline"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Marcar todas como leídas
          </button>
        )}
        {notifs.length === 0 ? (
          <p className="py-8 text-center text-sm text-luda-gris-light">
            No tienes notificaciones.
          </p>
        ) : (
          <div className="space-y-1">
            {notifs.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => abrir(n)}
                className={`block w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-luda-fondo ${
                  n.leida ? "opacity-60" : "bg-luda-lila-light/40"
                }`}
              >
                <p className="flex items-center gap-2 text-sm font-bold text-luda-gris">
                  {!n.leida && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-luda-lila-dark" />
                  )}
                  {n.titulo}
                </p>
                {n.mensaje && (
                  <p className="text-xs text-luda-gris-light">{n.mensaje}</p>
                )}
                <p className="mt-0.5 text-[10px] text-luda-gris-light">
                  {formatDistanceToNow(new Date(n.created_at), {
                    locale: es,
                    addSuffix: true,
                  })}
                </p>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
