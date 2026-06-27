import { redirect } from "next/navigation";

import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function SistemaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("profiles")
    .select("full_name, role, avatar_url")
    .eq("id", user.id)
    .single();

  if (!perfil) redirect("/login");

  // Conteo de recordatorios WhatsApp pendientes (citas de las próximas 24h).
  const ahora = new Date();
  const en24h = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
  const { count: recordatorios } = await supabase
    .from("citas")
    .select("id", { count: "exact", head: true })
    .eq("estatus", "programada")
    .eq("recordatorio_whatsapp_enviado", false)
    .gte("fecha_inicio", ahora.toISOString())
    .lte("fecha_inicio", en24h.toISOString());

  return (
    <div className="flex h-screen overflow-hidden bg-luda-blanco">
      <Sidebar perfil={perfil} recordatoriosPendientes={recordatorios ?? 0} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto px-4 pb-24 pt-6 md:px-8 md:pb-8">
          {children}
        </main>
      </div>
      <BottomNav perfil={perfil} />
    </div>
  );
}
