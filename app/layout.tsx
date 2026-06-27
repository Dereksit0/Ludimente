import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";

import { Providers } from "@/components/providers";

import "./globals.css";

// Fredoka cubre el rol de "Fredoka One" (display) del brief.
const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-fredoka",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ludimente — Donde aprender es jugar",
  description:
    "Sistema de gestión clínica del Consultorio Ludimente · Psicopedagogía infantil",
};

export const viewport: Viewport = {
  themeColor: "#C9A8E0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-MX" className={`${fredoka.variable} ${nunito.variable}`}>
      <body className="font-nunito">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
