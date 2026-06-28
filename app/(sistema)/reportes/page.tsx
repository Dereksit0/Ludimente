import type { Metadata } from "next";

import { ReportesCliente } from "@/components/reportes/reportes-cliente";

export const metadata: Metadata = { title: "Reportes · Ludimente" };

export default function ReportesPage() {
  return <ReportesCliente />;
}
