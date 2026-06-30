import type { Metadata } from "next";

import { FormatosCliente } from "@/components/formatos/formatos-cliente";

export const metadata: Metadata = { title: "Formatos · Ludimente" };

export default function FormatosPage() {
  return <FormatosCliente />;
}
