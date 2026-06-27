import { Calendar, CheckCircle2, TrendingUp, Users } from "lucide-react";

import { LudaCard, LudaCardContent, LudaCardHeader, LudaCardTitle } from "@/components/ui/luda-card";
import { LudaStat } from "@/components/ui/luda-stat";
import { createClient } from "@/lib/supabase/server";
import { ROL_LABEL } from "@/types/app.types";
import type { Rol } from "@/types/database.types";

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

  // Métricas reales básicas (las gráficas completas llegan en Fase 5).
  const [{ count: activos }, { count: listaEspera }] = await Promise.all([
    supabase
      .from("pacientes")
      .select("id", { count: "exact", head: true })
      .eq("estatus", "activo"),
    supabase
      .from("pacientes")
      .select("id", { count: "exact", head: true })
      .eq("estatus", "lista_espera"),
  ]);

  const hoyInicio = new Date();
  hoyInicio.setHours(0, 0, 0, 0);
  const hoyFin = new Date();
  hoyFin.setHours(23, 59, 59, 999);
  const { count: citasHoy } = await supabase
    .from("citas")
    .select("id", { count: "exact", head: true })
    .gte("fecha_inicio", hoyInicio.toISOString())
    .lte("fecha_inicio", hoyFin.toISOString());

  const nombre = perfil?.full_name?.split(" ")[0] ?? "";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-fredoka text-3xl text-luda-gris">
          ¡Hola, {nombre}! 🐙
        </h1>
        <p className="mt-1 text-sm text-luda-gris-light">
          {ROL_LABEL[(perfil?.role ?? "recepcionista") as Rol]} · Bienvenido/a de
          vuelta a Ludimente
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <LudaStat
          label="Pacientes activos"
          value={activos ?? 0}
          icon={Users}
          acento="lila"
        />
        <LudaStat
          label="En lista de espera"
          value={listaEspera ?? 0}
          icon={Users}
          acento="rosa"
        />
        <LudaStat
          label="Citas de hoy"
          value={citasHoy ?? 0}
          icon={Calendar}
          acento="azul"
        />
        <LudaStat
          label="Notas pendientes"
          value={0}
          icon={CheckCircle2}
          acento="amarillo"
        />
      </section>

      <LudaCard>
        <LudaCardHeader>
          <LudaCardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-luda-lila-dark" /> Tu panel está
            listo
          </LudaCardTitle>
        </LudaCardHeader>
        <LudaCardContent>
          <p className="text-sm text-luda-gris-light">
            Las gráficas en tiempo real (citas por semana, distribución de
            diagnósticos, ingresos y alertas del día) se conectarán en la{" "}
            <span className="font-semibold text-luda-lila-dark">Fase 5</span>.
            Por ahora ya ves las métricas base conectadas a la base de datos.
          </p>
        </LudaCardContent>
      </LudaCard>
    </div>
  );
}
