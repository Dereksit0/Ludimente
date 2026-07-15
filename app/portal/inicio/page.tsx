import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  BookOpen,
  CreditCard,
  FileSignature,
  FileText,
  LineChart,
  LogOut,
  Package,
  Sparkles,
  Target,
} from "lucide-react";

import {
  LudaCard,
  LudaCardContent,
  LudaCardHeader,
  LudaCardTitle,
} from "@/components/ui/luda-card";
import { Estrella } from "@/components/ui/ludi-mascota";
import {
  obtenerAvances,
  obtenerConsentimientos,
  obtenerDocumentos,
  obtenerPagos,
  obtenerPaqueteActivo,
  obtenerPlanActivo,
  obtenerProximasCitas,
  obtenerRecursosParaFamilia,
  obtenerReportesProgreso,
  obtenerSolicitudesCita,
} from "@/lib/portal/data";
import { leerSesionPortal } from "@/lib/portal/session";
import { infoLimitePago, mensajeRecordatorioPago } from "@/lib/pagos-limite";
import { PortalCitas } from "@/components/portal/portal-citas";
import {
  AREA_OBJETIVO_LABEL,
  ESTATUS_PAGO_CLASES,
  ESTATUS_PAGO_LABEL,
  ESTATUS_PLAN_LABEL,
  PRIORIDAD_OBJETIVO_LABEL,
} from "@/types/app.types";
import type {
  AreaObjetivo,
  EstatusPago,
  EstatusPlan,
  PrioridadObjetivo,
} from "@/types/database.types";

import { portalLogoutAction } from "../actions";

export const metadata: Metadata = { title: "Mi portal · Ludimente" };

const AREA_LABEL: Record<string, string> = {
  lectura: "Lectura",
  escritura: "Escritura",
  matematicas: "Matemáticas",
  atencion: "Atención",
  memoria: "Memoria",
  lenguaje: "Lenguaje",
  socio_emocional: "Socioemocional",
  motor: "Motor",
  otro: "Otro",
};

function fechaCorta(iso: string) {
  return format(new Date(iso), "d 'de' MMMM yyyy", { locale: es });
}

export default async function PortalInicioPage() {
  const sesion = leerSesionPortal();
  if (!sesion) redirect("/portal");

  const [
    avances,
    citas,
    documentos,
    pagos,
    reportes,
    consentimientos,
    plan,
    solicitudes,
    recursos,
    paquete,
  ] = await Promise.all([
    obtenerAvances(sesion.pid),
    obtenerProximasCitas(sesion.pid),
    obtenerDocumentos(sesion.pid),
    obtenerPagos(sesion.pid),
    obtenerReportesProgreso(sesion.pid),
    obtenerConsentimientos(sesion.pid),
    obtenerPlanActivo(sesion.pid),
    obtenerSolicitudesCita(sesion.pid),
    obtenerRecursosParaFamilia(sesion.pid),
    obtenerPaqueteActivo(sesion.pid),
  ]);

  return (
    <main className="min-h-screen bg-luda-fondo">
      {/* Encabezado */}
      <header className="border-b border-luda-lila/15 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <p className="flex items-center gap-1 font-fredoka text-xl text-luda-lila-dark">
              <span aria-hidden>🐙</span> Ludimente
              <Estrella className="h-3.5 w-3.5 text-luda-amarillo" />
            </p>
            <p className="text-xs font-semibold text-luda-gris-light">
              Hola, {sesion.tut.split(" ")[0]} · Portal de {sesion.pac}
            </p>
          </div>
          <form action={portalLogoutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-luda-gris-light transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <LogOut className="h-4 w-4" /> Salir
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        {/* Próximas citas (confirmar / solicitar) */}
        <PortalCitas citas={citas} solicitudes={solicitudes} />

        {/* Paquete de sesiones */}
        <LudaCard>
          <LudaCardHeader>
            <LudaCardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-luda-lila-dark" /> Paquete de
              sesiones
            </LudaCardTitle>
          </LudaCardHeader>
          <LudaCardContent>
            {paquete ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-luda-gris">
                    {paquete.nombre}
                  </p>
                  <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                    Activo
                  </span>
                </div>
                <p className="text-sm text-luda-gris-light">
                  {paquete.sesionesRestantes} de {paquete.sesionesTotales}{" "}
                  sesiones disponibles
                </p>
                <div className="h-1.5 overflow-hidden rounded-full bg-luda-lila-light">
                  <div
                    className="h-full rounded-full bg-luda-lila"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (paquete.sesionesUsadas / paquete.sesionesTotales) *
                            100,
                        ),
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-luda-gris-light">
                No tienes un paquete de sesiones activo en este momento.
                Contáctanos si quieres contratar uno.
              </p>
            )}
          </LudaCardContent>
        </LudaCard>

        {/* Plan de intervención */}
        {plan && (
          <LudaCard>
            <LudaCardHeader>
              <LudaCardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-luda-lila-dark" /> Plan de
                  intervención
                </span>
                <span className="rounded-full bg-luda-lila-light px-2.5 py-0.5 text-xs font-semibold text-luda-lila-dark">
                  {ESTATUS_PLAN_LABEL[plan.estatus as EstatusPlan] ?? plan.estatus}
                </span>
              </LudaCardTitle>
            </LudaCardHeader>
            <LudaCardContent className="space-y-3">
              <p className="text-sm font-bold text-luda-gris">{plan.titulo}</p>
              {plan.descripcion && (
                <p className="text-sm text-luda-gris">{plan.descripcion}</p>
              )}
              {plan.objetivos.length === 0 ? (
                <p className="text-sm text-luda-gris-light">
                  Este plan todavía no tiene objetivos registrados.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {plan.objetivos.map((o, i) => (
                    <div key={i} className="rounded-xl border border-luda-lila/15 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-luda-gris">
                          {o.descripcion}
                        </p>
                        <span className="shrink-0 text-xs font-semibold text-luda-gris-light">
                          {o.progreso}%
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full border border-luda-lila/20 bg-luda-lila-light/60 px-2 py-0.5 text-[11px] font-semibold text-luda-lila-dark">
                          {AREA_OBJETIVO_LABEL[o.area as AreaObjetivo] ?? o.area}
                        </span>
                        <span className="rounded-full border border-luda-lila/20 px-2 py-0.5 text-[11px] font-semibold text-luda-gris-light">
                          Prioridad{" "}
                          {(
                            PRIORIDAD_OBJETIVO_LABEL[o.prioridad as PrioridadObjetivo] ??
                            o.prioridad
                          ).toLowerCase()}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-luda-lila-light">
                        <div
                          className="h-full rounded-full bg-luda-lila"
                          style={{ width: `${o.progreso}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </LudaCardContent>
          </LudaCard>
        )}

        {/* Avances */}
        <LudaCard>
          <LudaCardHeader>
            <LudaCardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-luda-lila-dark" /> Avances de las
              sesiones
            </LudaCardTitle>
          </LudaCardHeader>
          <LudaCardContent className="space-y-3">
            {avances.length === 0 ? (
              <p className="text-sm text-luda-gris-light">
                Aún no hay avances publicados.
              </p>
            ) : (
              avances.map((a, i) => (
                <div key={i} className="rounded-xl border border-luda-lila/15 p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-bold text-luda-lila-dark">
                      {a.area ? (AREA_LABEL[a.area] ?? a.area) : "Sesión"}
                    </span>
                    <span className="text-xs text-luda-gris-light">
                      {fechaCorta(a.fecha)}
                    </span>
                  </div>
                  {a.logros && (
                    <p className="text-sm text-luda-gris">
                      <span className="font-semibold">Logros: </span>
                      {a.logros}
                    </p>
                  )}
                  {a.recomendaciones && (
                    <p className="mt-1 text-sm text-luda-gris">
                      <span className="font-semibold">Para casa: </span>
                      {a.recomendaciones}
                    </p>
                  )}
                </div>
              ))
            )}
          </LudaCardContent>
        </LudaCard>

        {/* Reportes de progreso compartidos */}
        <LudaCard>
          <LudaCardHeader>
            <LudaCardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-luda-lila-dark" /> Reportes de
              progreso
            </LudaCardTitle>
          </LudaCardHeader>
          <LudaCardContent className="space-y-3">
            {reportes.length === 0 ? (
              <p className="text-sm text-luda-gris-light">
                Aún no hay reportes compartidos contigo.
              </p>
            ) : (
              reportes.map((r) => (
                <div key={r.id} className="rounded-xl border border-luda-lila/15 p-4">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-luda-lila-dark">
                      {r.titulo}
                    </span>
                    <span className="shrink-0 text-xs text-luda-gris-light">
                      {fechaCorta(r.fecha)}
                    </span>
                  </div>
                  {r.resumen && (
                    <p className="text-sm text-luda-gris">{r.resumen}</p>
                  )}
                  {r.logros && (
                    <p className="mt-1 text-sm text-luda-gris">
                      <span className="font-semibold">Logros: </span>
                      {r.logros}
                    </p>
                  )}
                  {r.objetivos.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {r.objetivos.map((o, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between text-xs text-luda-gris">
                            <span className="min-w-0 truncate pr-2">
                              {o.descripcion}
                            </span>
                            <span className="shrink-0 font-semibold">
                              {o.progreso}%
                            </span>
                          </div>
                          <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-luda-lila-light">
                            <div
                              className="h-full rounded-full bg-luda-lila"
                              style={{ width: `${o.progreso}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {r.recomendaciones && (
                    <p className="mt-2 text-sm text-luda-gris">
                      <span className="font-semibold">Para casa: </span>
                      {r.recomendaciones}
                    </p>
                  )}
                </div>
              ))
            )}
          </LudaCardContent>
        </LudaCard>

        {/* Consentimientos */}
        <LudaCard>
          <LudaCardHeader>
            <LudaCardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-luda-lila-dark" />{" "}
              Consentimientos
            </LudaCardTitle>
          </LudaCardHeader>
          <LudaCardContent className="space-y-2">
            {consentimientos.length === 0 ? (
              <p className="text-sm text-luda-gris-light">
                No hay consentimientos registrados.
              </p>
            ) : (
              consentimientos.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-xl bg-luda-fondo px-4 py-3"
                >
                  <p className="min-w-0 truncate text-sm font-semibold text-luda-gris">
                    {c.titulo}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      c.firmado
                        ? "bg-green-50 text-green-700"
                        : "bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    {c.firmado ? "Firmado" : "Pendiente de firma"}
                  </span>
                </div>
              ))
            )}
          </LudaCardContent>
        </LudaCard>

        {/* Recursos para casa */}
        {recursos.length > 0 && (
          <LudaCard>
            <LudaCardHeader>
              <LudaCardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-luda-lila-dark" /> Recursos
                para casa
              </LudaCardTitle>
            </LudaCardHeader>
            <LudaCardContent className="space-y-2">
              {recursos.map((r, i) =>
                r.url ? (
                  <a
                    key={i}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl bg-luda-fondo px-4 py-3 transition-colors hover:bg-luda-lila-light"
                  >
                    <p className="text-sm font-bold text-luda-gris">{r.titulo}</p>
                    {r.descripcion && (
                      <p className="text-xs text-luda-gris-light">{r.descripcion}</p>
                    )}
                  </a>
                ) : (
                  <div key={i} className="rounded-xl bg-luda-fondo px-4 py-3">
                    <p className="text-sm font-bold text-luda-gris">{r.titulo}</p>
                    {r.descripcion && (
                      <p className="text-xs text-luda-gris-light">{r.descripcion}</p>
                    )}
                  </div>
                ),
              )}
            </LudaCardContent>
          </LudaCard>
        )}

        {/* Documentos */}
        <LudaCard>
          <LudaCardHeader>
            <LudaCardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-luda-lila-dark" /> Documentos
            </LudaCardTitle>
          </LudaCardHeader>
          <LudaCardContent className="space-y-2">
            {documentos.length === 0 ? (
              <p className="text-sm text-luda-gris-light">
                No hay documentos compartidos contigo todavía.
              </p>
            ) : (
              documentos.map((d, i) => (
                <a
                  key={i}
                  href={d.url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl bg-luda-fondo px-4 py-3 text-sm font-semibold text-luda-gris transition-colors hover:bg-luda-lila-light"
                >
                  <FileText className="h-4 w-4 text-luda-lila-dark" />
                  {d.nombre}
                </a>
              ))
            )}
          </LudaCardContent>
        </LudaCard>

        {/* Pagos */}
        <LudaCard>
          <LudaCardHeader>
            <LudaCardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-luda-lila-dark" /> Estado de
              pagos
            </LudaCardTitle>
          </LudaCardHeader>
          <LudaCardContent className="space-y-2">
            {pagos.length === 0 ? (
              <p className="text-sm text-luda-gris-light">
                No hay pagos registrados.
              </p>
            ) : (
              pagos.map((p, i) => {
                const info =
                  p.estatus === "pendiente" ? infoLimitePago(p.creado) : null;
                return (
                  <div
                    key={i}
                    className={`rounded-xl bg-luda-fondo px-4 py-3 ${
                      info?.vencido
                        ? "border-l-4 border-l-red-400"
                        : info?.porVencer
                          ? "border-l-4 border-l-yellow-400"
                          : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-luda-gris">
                          {p.concepto}
                        </p>
                        {p.fecha && (
                          <p className="text-xs text-luda-gris-light">
                            {fechaCorta(p.fecha)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-luda-gris">
                          ${p.monto.toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            ESTATUS_PAGO_CLASES[p.estatus as EstatusPago] ?? ""
                          }`}
                        >
                          {ESTATUS_PAGO_LABEL[p.estatus as EstatusPago] ??
                            p.estatus}
                        </span>
                      </div>
                    </div>
                    {info && (
                      <p
                        className={`mt-2 text-xs font-semibold ${
                          info.vencido
                            ? "text-red-600"
                            : info.porVencer
                              ? "text-yellow-700"
                              : "text-luda-gris-light"
                        }`}
                      >
                        ⏰ {mensajeRecordatorioPago(info)}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </LudaCardContent>
        </LudaCard>

        <p className="pb-4 text-center text-xs text-luda-gris-light">
          Ludimente · Donde aprender es jugar 🐙
        </p>
      </div>
    </main>
  );
}
