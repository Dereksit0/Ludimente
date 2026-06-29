import type { Metadata } from "next";

import { FinanzasCliente } from "@/components/finanzas/finanzas-cliente";

export const metadata: Metadata = { title: "Finanzas · Ludimente" };

export default function FinanzasPage() {
  return <FinanzasCliente />;
}
