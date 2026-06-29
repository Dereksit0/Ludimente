import type { Metadata } from "next";

import { BibliotecaCliente } from "@/components/biblioteca/biblioteca-cliente";

export const metadata: Metadata = { title: "Biblioteca · Ludimente" };

export default function BibliotecaPage() {
  return <BibliotecaCliente />;
}
