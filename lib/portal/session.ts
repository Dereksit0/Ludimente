import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Sesión del Portal de Padres (independiente de Supabase Auth).
 * Se firma con HMAC-SHA256 y se guarda en una cookie httpOnly.
 */

const COOKIE = "portal_sesion";
const DURACION_HORAS = 8;

export interface PortalSesion {
  aid: string; // id del acceso (portal_accesos)
  pid: string; // id del paciente
  pac: string; // nombre del paciente
  tut: string; // nombre del tutor
  exp: number; // expiración (epoch ms)
}

function secret(): string {
  const s = process.env.PORTAL_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("Falta PORTAL_SECRET / SUPABASE_SERVICE_ROLE_KEY");
  return s;
}

function firmar(datos: string): string {
  return createHmac("sha256", secret()).update(datos).digest("base64url");
}

function codificar(sesion: PortalSesion): string {
  const payload = Buffer.from(JSON.stringify(sesion)).toString("base64url");
  return `${payload}.${firmar(payload)}`;
}

function decodificar(token: string): PortalSesion | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const esperado = firmar(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const sesion = JSON.parse(
      Buffer.from(payload, "base64url").toString(),
    ) as PortalSesion;
    if (!sesion.exp || sesion.exp < Date.now()) return null;
    return sesion;
  } catch {
    return null;
  }
}

export function crearSesionPortal(
  datos: Omit<PortalSesion, "exp">,
): void {
  const sesion: PortalSesion = {
    ...datos,
    exp: Date.now() + DURACION_HORAS * 60 * 60 * 1000,
  };
  cookies().set(COOKIE, codificar(sesion), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/portal",
    maxAge: DURACION_HORAS * 60 * 60,
  });
}

export function leerSesionPortal(): PortalSesion | null {
  const token = cookies().get(COOKIE)?.value;
  return token ? decodificar(token) : null;
}

export function cerrarSesionPortal(): void {
  cookies().delete(COOKIE);
}
