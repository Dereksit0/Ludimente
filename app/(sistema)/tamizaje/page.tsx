import type { Metadata } from "next";

import { TamizajeCliente } from "@/components/tamizaje/tamizaje-cliente";

export const metadata: Metadata = { title: "Tamizaje · Ludimente" };

export default function TamizajePage() {
  return <TamizajeCliente />;
}
