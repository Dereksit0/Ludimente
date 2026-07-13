import Link from "next/link";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertCircle,
  CalendarClock,
  CalendarPlus,
  Cake,
  Clock,
  FileSignature,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

import { LudaAvatar } from "@/components/ui/luda-avatar";
import {
  LudaCard,
  LudaCardContent,
  LudaCardHeader,
  LudaCardTitle,
} from "@/components/ui/luda-card";
import { LudaStat } from "@/components/ui/luda-stat";
import { createClient } from "@/lib/supabase/server";
import { infoLimitePago } from "@/lib/pagos-limite";
import {
  ESTATUS_CITA_LABEL,
  ESTATUS_PACIENTE_LABEL,
  ROL_LABEL,
} from "@/types/app.types";
import type { EstatusPaciente, Rol } from "@/types/database.types";

const mx = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user!.id)
    .single();

  const rol = (perfil?.role ?? "recepcionista") as Rol;
  const esAdmin = rol === "admin";

  const hoy = new Date();
  const hoyInicio = new Date();
  hoyInicio.setHours(0, 0, 0, 0);
  const hoyFin = new Date();
  hoyFin.setHours(23, 59, 59, 999);
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [
    { data: pacientes },
    { data: citasHoy },
    { data: pagosPendientes },
    { data: pagosMes },
    { data: planesActivosData },
    { data: gastosMesData },
    { count: solicitudesPendientes },
    { count: evaluacionesEnProceso },
    { count: consentimientosPendientes },
  ] = await Promise.all([
    supabase
      .from("pacientes")
      .select(
        "id, nombre, apellido_paterno, fecha_nacimiento, estatus, created_at, numero_expediente",
      ),
    supabase
      .from("citas")
      .select("id, paciente_id, fecha_inicio, estatus")
      .gte("fecha_inicio", hoyInicio.toISOString())
      .lte("fecha_inicio", hoyFin.toISOString())
      .order("fecha_inicio", { ascending: true }),
    supabase
      .from("pagos")
      .select("id, paciente_id, concepto, monto_final, created_at")
      .eq("estatus", "pendiente")
      .order("created_at", { ascending: true }),
    supabase
      .from("pagos")
      .select("monto_final, fecha_pago")
      .eq("estatus", "pagado")
      .gte("fecha_pago", inicioMes.toISOString()),
    supabase
      .from("planes_intervencion")
      .select("id")
      .eq("estatus", "activo"),
    esAdmin
      ? supabase
          .from("gastos")
          .select("monto, fecha")
          .gte("fecha", inicioMes.toISOString().slice(0, 10))
      : Promise.resolve({ data: [] as { monto: number; fecha: string }[] }),
    esAdmin
      ? supabase
          .from("solicitudes_cita")
          .select("id", { count: "exact", head: true })
          .eq("estatus", "pendiente")
      : Promise.resolve({ count: 0 }),
    esAdmin
      ? supabase
          .from("evaluaciones")
          .select("id", { count: "exact", head: true })
          .eq("estatus", "en_proceso")
          .is("deleted_at", null)
      : Promise.resolve({ count: 0 }),
    esAdmin
      ? supabase
          .from("consentimientos")
          .select("id", { count: "exact", head: true })
          .eq("firmado", false)
      : Promise.resolve({ count: 0 }),
  ]);

  const lista = pacientes ?? [];

  // ── Métricas derivadas de pacientes ──
  const cuenta = (e: EstatusPaciente) =>
    lista.filter((p) => p.estatus === e).length;
  const activos = cuenta("activo");
  const listaEspera = cuenta("lista_espera");
  const enEvaluacion = cuenta("en_evaluacion");

  // ── Cumpleaños del mes (clínica infantil) ──
  const mesActual = hoy.getMonth();
  const cumpleaniosMes = lista
    .filter((p) => {
      if (!p.fecha_nacimiento) return false;
      return Number(p.fecha_nacimiento.slice(5, 7)) - 1 === mesActual;
    })
    .map((p) => {
      const dia = Number(p.fecha_nacimiento.slice(8, 10));
      const anio = Number(p.fecha_nacimiento.slice(0, 4));
      return {
        id: p.id,
        nombre: `${p.nombre} ${p.apellido_paterno}`,
        dia,
        cumpleHoy: dia === hoy.getDate(),
        edad: hoy.getFullYear() - anio,
      };
    })
    .sort((a, b) => a.dia - b.dia);

  // ── Pacientes recientes ──
  const recientes = [...lista]
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 5);

  // ── Finanzas ──
  const ingresosMes = (pagosMes ?? []).reduce(
    (s, p) => s + Number(p.monto_final ?? 0),
    0,
  );
  const pendientes = pagosPendientes ?? [];
  const porCobrar = pendientes.reduce(
    (s, p) => s + Number(p.monto_final ?? 0),
    0,
  );
  const vencidos = pendientes.filter(
    (p) => infoLimitePago(p.created_at).vencido,
  ).length;

  const planesActivos = (planesActivosData ?? []).length;
  const gastosMes = (gastosMesData ?? []).reduce(
    (s, g) => s + Number(g.monto ?? 0),
    0,
  );
  const utilidadMes = ingresosMes - gastosMes;

  // Nombres de paciente para citas de hoy y pagos pendientes.
  const refMap = new Map(
    lista.map((p) => [p.id, `${p.nombre} ${p.apellido_paterno}`]),
  );

  const nombre = perfil?.full_name?.split(" ")[0] ?? "";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-fredoka text-3xl text-luda-gris">
          ¡Hola, {nombre}! 🐙
        </h1>
        <p className="mt-1 text-sm capitalize text-luda-gris-light">
          {ROL_LABEL[rol]} ·{" "}
          {format(hoy, "EEEE d 'de' MMMM yyyy", { locale: es })}
        </p>
      </div>

      {/* Métricas principales */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <LudaStat label="Pacientes activos" value={activos} icon={Users} acento="lila" />
        <LudaStat label="Citas de hoy" value={(citasHoy ?? []).length} icon={CalendarClock} acento="azul" />
        {esAdmin ? (
          <>
            <LudaStat label="Ingresos del mes" value={mx(ingresosMes)} icon={Wallet} acento="rosa" />
            <LudaStat label="Por cobrar" value={mx(porCobrar)} icon={AlertCircle} acento="amarillo" />
          </>
        ) : (
          <>
            <LudaStat label="En lista de espera" value={listaEspera} icon={Users} acento="rosa" />
            <LudaStat label="En evaluación" value={enEvaluacion} icon={TrendingUp} acento="amarillo" />
          </>
        )}
      </section>

      {/* Accesos rápidos */}
      <section className="flex flex-wrap gap-2">
        <Link
          href="/pacientes/nuevo"
          className="inline-flex items-center gap-1.5 rounded-xl bg-luda-lila px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-luda-lila-dark"
        >
          <UserPlus className="h-4 w-4" /> Nuevo paciente
        </Link>
        <Link
          href="/agenda"
          className="inline-flex items-center gap-1.5 rounded-xl border border-luda-lila/30 px-3.5 py-2 text-sm font-semibold text-luda-lila-dark transition-colors hover:bg-luda-lila-light"
        >
          <CalendarPlus className="h-4 w-4" /> Nueva cita
        </Link>
        {esAdmin && (
          <>
            <Link
              href="/cobranza"
              className="inline-flex items-center gap-1.5 rounded-xl border border-luda-lila/30 px-3.5 py-2 text-sm font-semibold text-luda-lila-dark transition-colors hover:bg-luda-lila-light"
            >
              <Wallet className="h-4 w-4" /> Registrar pago
            </Link>
            <Link
              href="/consentimientos"
              className="inline-flex items-center gap-1.5 rounded-xl border border-luda-lila/30 px-3.5 py-2 text-sm font-semibold text-luda-lila-dark transition-colors hover:bg-luda-lila-light"
            >
              <FileSignature className="h-4 w-4" /> Nuevo consentimiento
            </Link>
          </>
        )}
      </section>

      {/* Alertas rápidas para admin */}
      {esAdmin && (
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <MiniStat label="En lista de espera" valor={listaEspera} />
          <MiniStat label="En evaluación" valor={enEvaluacion} />
          <MiniStat label="Planes activos" valor={planesActivos} />
          <MiniStat label="Pagos pendientes" valor={pendientes.length} />
          <MiniStat
            label="Utilidad del mes"
            valor={mx(utilidadMes)}
            alerta={utilidadMes < 0}
          />
          <MiniStat
            label="Pagos vencidos"
            valor={vencidos}
            alerta={vencidos > 0}
          />
          <MiniStat
            label="Solicitudes del portal"
            valor={solicitudesPendientes ?? 0}
            alerta={(solicitudesPendientes ?? 0) > 0}
          />
          <MiniStat
            label="Evaluaciones en proceso"
            valor={evaluacionesEnProceso ?? 0}
          />
          <MiniStat
            label="Consentimientos por firmar"
            valor={consentimientosPendientes ?? 0}
            alerta={(consentimientosPendientes ?? 0) > 0}
          />
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Agenda de hoy */}
        <LudaCard>
          <LudaCardHeader>
            <LudaCardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-luda-azul" /> Agenda de hoy
            </LudaCardTitle>
          </LudaCardHeader>
          <LudaCardContent className="space-y-2">
            {(citasHoy ?? []).length === 0 ? (
              <p className="text-sm text-luda-gris-light">
                No hay citas programadas para hoy.
              </p>
            ) : (
              (citasHoy ?? []).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-xl border border-luda-lila/10 px-3 py-2"
                >
                  <span className="flex items-center gap-1 text-sm font-bold text-luda-lila-dark">
                    <Clock className="h-3.5 w-3.5" />
                    {format(new Date(c.fecha_inicio), "HH:mm")}
                  </span>
                  <Link
                    href={`/pacientes/${c.paciente_id}`}
                    className="min-w-0 flex-1 truncate text-sm text-luda-gris hover:text-luda-lila-dark"
                  >
                    {refMap.get(c.paciente_id) ?? "Paciente"}
                  </Link>
                  <span className="shrink-0 rounded-full bg-luda-lila-light px-2 py-0.5 text-[11px] font-semibold text-luda-lila-dark">
                    {ESTATUS_CITA_LABEL[c.estatus]}
                  </span>
                </div>
              ))
            )}
            <Link
              href="/agenda"
              className="mt-1 inline-block text-xs font-semibold text-luda-lila-dark hover:underline"
            >
              Ver agenda completa →
            </Link>
          </LudaCardContent>
        </LudaCard>

        {/* Falta por pagar (admin) o resumen (otros) */}
        {esAdmin ? (
          <LudaCard>
            <LudaCardHeader>
              <LudaCardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-luda-rosa" /> Falta por pagar
                </span>
                <span className="text-sm font-bold text-luda-rosa">
                  {mx(porCobrar)}
                </span>
              </LudaCardTitle>
            </LudaCardHeader>
            <LudaCardContent className="space-y-2">
              {pendientes.length === 0 ? (
                <p className="text-sm text-luda-gris-light">
                  ¡Todo al día! No hay pagos pendientes. 🎉
                </p>
              ) : (
                pendientes.slice(0, 6).map((p) => {
                  const info = infoLimitePago(p.created_at);
                  const dias = -info.diasRestantes;
                  const vencido = info.vencido;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                        vencido
                          ? "border-yellow-300 bg-yellow-50/50"
                          : "border-luda-lila/10"
                      }`}
                    >
                      <Link
                        href={`/pacientes/${p.paciente_id}`}
                        className="min-w-0 flex-1"
                      >
                        <p className="truncate text-sm font-semibold text-luda-gris">
                          {refMap.get(p.paciente_id) ?? "Paciente"}
                        </p>
                        <p className="truncate text-xs text-luda-gris-light">
                          {p.concepto}
                          {dias > 0 && (
                            <span className={vencido ? "font-semibold text-yellow-600" : ""}>
                              {" "}· {dias}d
                            </span>
                          )}
                        </p>
                      </Link>
                      <span className="shrink-0 text-sm font-bold text-luda-rosa">
                        {mx(Number(p.monto_final ?? 0))}
                      </span>
                    </div>
                  );
                })
              )}
              <Link
                href="/cobranza"
                className="mt-1 inline-block text-xs font-semibold text-luda-lila-dark hover:underline"
              >
                Ir a cobranza →
              </Link>
            </LudaCardContent>
          </LudaCard>
        ) : (
          <LudaCard>
            <LudaCardHeader>
              <LudaCardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-luda-lila-dark" /> Resumen de
                pacientes
              </LudaCardTitle>
            </LudaCardHeader>
            <LudaCardContent className="grid grid-cols-2 gap-3">
              <MiniStat label="Activos" valor={activos} />
              <MiniStat label="Planes activos" valor={planesActivos} />
              <MiniStat label="En evaluación" valor={enEvaluacion} />
              <MiniStat label="Total pacientes" valor={lista.length} />
            </LudaCardContent>
          </LudaCard>
        )}

        {/* Cumpleaños del mes */}
        <LudaCard>
          <LudaCardHeader>
            <LudaCardTitle className="flex items-center gap-2">
              <Cake className="h-5 w-5 text-luda-rosa" /> Cumpleaños del mes
            </LudaCardTitle>
          </LudaCardHeader>
          <LudaCardContent className="space-y-2">
            {cumpleaniosMes.length === 0 ? (
              <p className="text-sm text-luda-gris-light">
                Ningún cumpleaños este mes.
              </p>
            ) : (
              cumpleaniosMes.map((c) => (
                <Link
                  key={c.id}
                  href={`/pacientes/${c.id}`}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors hover:bg-luda-lila-light/40 ${
                    c.cumpleHoy
                      ? "border-luda-rosa bg-luda-rosa-light/40"
                      : "border-luda-lila/10"
                  }`}
                >
                  <span className="flex h-7 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-luda-rosa-light text-[11px] font-bold leading-none text-luda-rosa">
                    {c.dia}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-luda-gris">
                    {c.nombre}
                  </span>
                  {c.cumpleHoy ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-luda-rosa">
                      <Sparkles className="h-3.5 w-3.5" /> ¡Hoy!
                    </span>
                  ) : (
                    <span className="text-xs text-luda-gris-light">
                      cumple {c.edad}
                    </span>
                  )}
                </Link>
              ))
            )}
          </LudaCardContent>
        </LudaCard>

        {/* Pacientes recientes */}
        <LudaCard>
          <LudaCardHeader>
            <LudaCardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-luda-lila-dark" /> Pacientes
              recientes
            </LudaCardTitle>
          </LudaCardHeader>
          <LudaCardContent className="space-y-2">
            {recientes.length === 0 ? (
              <p className="text-sm text-luda-gris-light">
                Aún no hay pacientes registrados.
              </p>
            ) : (
              recientes.map((p) => (
                <Link
                  key={p.id}
                  href={`/pacientes/${p.id}`}
                  className="flex items-center gap-3 rounded-xl border border-luda-lila/10 px-3 py-2 transition-colors hover:bg-luda-lila-light/40"
                >
                  <LudaAvatar
                    nombre={`${p.nombre} ${p.apellido_paterno}`}
                    foto={null}
                    size={32}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-luda-gris">
                      {p.nombre} {p.apellido_paterno}
                    </p>
                    <p className="truncate text-xs text-luda-gris-light">
                      {p.numero_expediente}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-luda-lila-light px-2 py-0.5 text-[11px] font-semibold text-luda-lila-dark">
                    {ESTATUS_PACIENTE_LABEL[p.estatus]}
                  </span>
                </Link>
              ))
            )}
            <Link
              href="/pacientes"
              className="mt-1 inline-block text-xs font-semibold text-luda-lila-dark hover:underline"
            >
              Ver todos los pacientes →
            </Link>
          </LudaCardContent>
        </LudaCard>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  valor,
  alerta,
}: {
  label: string;
  valor: number | string;
  alerta?: boolean;
}) {
  return (
    <div
      className={`rounded-xl px-3 py-3 ${
        alerta ? "bg-yellow-50" : "bg-luda-lila-light/50"
      }`}
    >
      <p
        className={`text-2xl font-bold ${
          alerta ? "text-yellow-600" : "text-luda-gris"
        }`}
      >
        {valor}
      </p>
      <p className="text-xs font-semibold text-luda-gris-light">{label}</p>
    </div>
  );
}
