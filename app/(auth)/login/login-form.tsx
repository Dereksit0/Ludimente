"use client";

import { useFormState, useFormStatus } from "react-dom";

import { Loader2, Lock, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Estrella, LudiMascota } from "@/components/ui/ludi-mascota";

import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
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

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <div className="w-full max-w-sm">
      {/* Logo (visible también en mobile, donde se oculta el panel derecho) */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 w-20 lg:hidden">
          <LudiMascota />
        </div>
        <h1 className="flex items-center justify-center gap-2 font-fredoka text-4xl text-luda-lila-dark">
          <span aria-hidden>🐙</span> Ludimente
        </h1>
        <p className="mt-1 flex items-center justify-center gap-1 text-sm font-semibold text-luda-gris-light">
          Donde aprender es jugar
          <Estrella className="h-3.5 w-3.5 text-luda-amarillo" />
        </p>
      </div>

      <form action={formAction} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="usuario">Usuario / ID</Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-luda-gris-light" />
            <Input
              id="usuario"
              name="usuario"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="tu ID de acceso"
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-luda-gris-light" />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="pl-10"
              required
            />
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

        <SubmitButton />
      </form>

      <p className="mt-6 text-center text-xs text-luda-gris-light">
        Acceso exclusivo para el equipo del Consultorio Ludimente.
      </p>
    </div>
  );
}
