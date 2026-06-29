"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { Eye, EyeOff, Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Estrella, LudiMascota } from "@/components/ui/ludi-mascota";
import { ROL_LABEL } from "@/types/app.types";
import type { Rol } from "@/types/database.types";

import { loginAction, type LoginState } from "./actions";

export interface UsuarioLogin {
  usuario: string;
  full_name: string;
  role: Rol;
}

const initialState: LoginState = { error: null };

// Orden estable de los tipos en el selector.
const ORDEN_ROLES: Rol[] = ["admin", "psicologo", "recepcionista"];

const selectClass =
  "w-full appearance-none rounded-xl border border-luda-lila/25 bg-white px-4 py-2.5 text-sm font-semibold text-luda-gris shadow-sm outline-none transition focus:border-luda-lila focus:ring-2 focus:ring-luda-lila/30 disabled:opacity-50";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      className="w-full"
      disabled={pending || disabled}
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin" /> Entrando…
        </>
      ) : (
        "Iniciar sesión"
      )}
    </Button>
  );
}

export function LoginForm({ usuarios }: { usuarios: UsuarioLogin[] }) {
  const [state, formAction] = useFormState(loginAction, initialState);

  // Tipos disponibles según el equipo cargado.
  const tipos = useMemo(
    () => ORDEN_ROLES.filter((r) => usuarios.some((u) => u.role === r)),
    [usuarios],
  );

  const [rol, setRol] = useState<Rol | "">(tipos.length === 1 ? tipos[0] : "");

  const personas = useMemo(
    () => usuarios.filter((u) => u.role === rol),
    [usuarios, rol],
  );

  const [usuario, setUsuario] = useState<string>(
    personas.length === 1 ? personas[0].usuario : "",
  );

  const [verPassword, setVerPassword] = useState(false);

  function onCambiarRol(nuevo: Rol | "") {
    setRol(nuevo);
    const lista = usuarios.filter((u) => u.role === nuevo);
    setUsuario(lista.length === 1 ? lista[0].usuario : "");
  }

  const sinEquipo = usuarios.length === 0;

  return (
    <div className="w-full max-w-sm">
      {/* Logo (visible también en mobile, donde se oculta el panel derecho) */}
      <div className="mb-8 text-center">
        <h1 className="flex items-center justify-center gap-2 font-fredoka text-4xl text-luda-lila-dark">
          <LudiMascota className="h-12 w-12 shrink-0" /> Ludimente
        </h1>
        <p className="mt-1 flex items-center justify-center gap-1 text-sm font-semibold text-luda-gris-light">
          Donde aprender es jugar
          <Estrella className="h-3.5 w-3.5 text-luda-amarillo" />
        </p>
      </div>

      <form action={formAction} className="space-y-5">
        {/* Tipo de usuario */}
        <div className="space-y-2">
          <Label htmlFor="rol">Tipo de usuario</Label>
          <div className="relative">
            <select
              id="rol"
              value={rol}
              onChange={(e) => onCambiarRol(e.target.value as Rol | "")}
              className={selectClass}
              disabled={sinEquipo}
            >
              <option value="" disabled>
                Selecciona…
              </option>
              {tipos.map((r) => (
                <option key={r} value={r}>
                  {ROL_LABEL[r]}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-luda-gris-light">
              ▾
            </span>
          </div>
        </div>

        {/* Persona */}
        <div className="space-y-2">
          <Label htmlFor="usuario">Usuario</Label>
          <div className="relative">
            <select
              id="usuario"
              name="usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className={selectClass}
              disabled={!rol || personas.length === 0}
              required
            >
              <option value="" disabled>
                {rol ? "Selecciona tu nombre…" : "Elige primero el tipo"}
              </option>
              {personas.map((p) => (
                <option key={p.usuario} value={p.usuario}>
                  {p.full_name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-luda-gris-light">
              ▾
            </span>
          </div>
        </div>

        {/* Contraseña */}
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-luda-gris-light" />
            <Input
              id="password"
              name="password"
              type={verPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className="pl-10 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setVerPassword((v) => !v)}
              aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              aria-pressed={verPassword}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-luda-gris-light transition-colors hover:bg-luda-lila-light hover:text-luda-lila-dark"
            >
              {verPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {state.error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600"
          >
            {state.error}
          </p>
        )}

        {sinEquipo && (
          <p className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-2.5 text-sm font-semibold text-yellow-700">
            No hay usuarios configurados todavía.
          </p>
        )}

        <SubmitButton disabled={sinEquipo || !usuario} />
      </form>

      <p className="mt-6 text-center text-xs text-luda-gris-light">
        Acceso exclusivo para el equipo del Consultorio Ludimente.
      </p>
    </div>
  );
}
