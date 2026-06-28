import type { Metadata } from "next";

import { AgendaCliente } from "@/components/agenda/agenda-cliente";

export const metadata: Metadata = { title: "Agenda · Ludimente" };

export default function AgendaPage() {
  return <AgendaCliente />;
}
