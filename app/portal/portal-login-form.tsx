"use client";

"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { Eye, EyeOff, KeyRound, Loader2, Ticket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Estrella, LudiMascota } from "@/components/ui/ludi-mascota";

import { portalLoginAction, type PortalLoginState } from "./actions";

const initialState: PortalLoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" /> Entrando…
        </>
      ) : (
        "Entrar"
      )}
    </Button>
  );
}

export function PortalLoginForm() {
  const [state, formAction] = useFormState(portalLoginAction, initialState);
  const [verPin, setVerPin] = useState(false);

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 w-20 lg:hidden">
          <LudiMascota />
        </div>
        <h1 className="flex items-center justify-center gap-2 font-fredoka text-4xl text-luda-lila-dark">
          <span aria-hidden>🐙</span> Ludimente
        </h1>
        <p className="mt-1 flex items-center justify-center gap-1 text-sm font-semibold text-luda-gris-light">
          Portal de Padres
          <Estrella className="h-3.5 w-3.5 text-luda-amarillo" />
        </p>
      </div>

      <form action={formAction} method="post" className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="codigo">Código de acceso</Label>
          <div className="relative">
            <Ticket className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-luda-gris-light" />
            <Input
              id="codigo"
              name="codigo"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="LUDA-XXXX"
              className="pl-10 uppercase"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pin">PIN</Label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-luda-gris-light" />
            <Input
              id="pin"
              name="pin"
              type={verPin ? "text" : "password"}
              inputMode="numeric"
              autoComplete="off"
              placeholder="••••"
              className="pl-10 pr-10 tracking-widest"
              required
            />
            <button
              type="button"
              onClick={() => setVerPin((v) => !v)}
              aria-label={verPin ? "Ocultar PIN" : "Mostrar PIN"}
              aria-pressed={verPin}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-luda-gris-light transition-colors hover:bg-luda-lila-light hover:text-luda-lila-dark"
            >
              {verPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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

        <SubmitButton />
      </form>

      <p className="mt-6 text-center text-xs text-luda-gris-light">
        ¿No tienes tu código? Pídelo en la recepción de Ludimente.
      </p>
    </div>
  );
}
