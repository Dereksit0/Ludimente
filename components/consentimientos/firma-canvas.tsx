"use client";

import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";

import { Eraser } from "lucide-react";

export interface FirmaCanvasHandle {
  /** Devuelve la firma como PNG base64, o null si está vacía. */
  obtener: () => string | null;
  limpiar: () => void;
}

/** Lienzo para capturar una firma con mouse o táctil. */
export const FirmaCanvas = forwardRef<FirmaCanvasHandle>(function FirmaCanvas(
  _props,
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dibujando = useRef(false);
  const vacio = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Escala para nitidez en pantallas retina.
    const ratio = window.devicePixelRatio || 1;
    const ancho = canvas.offsetWidth;
    const alto = canvas.offsetHeight;
    canvas.width = ancho * ratio;
    canvas.height = alto * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#3d3d3d";
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function inicio(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    dibujando.current = true;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    canvasRef.current?.setPointerCapture(e.pointerId);
  }

  function mover(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dibujando.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    vacio.current = false;
  }

  function fin() {
    dibujando.current = false;
  }

  function limpiar() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      vacio.current = true;
    }
  }

  useImperativeHandle(ref, () => ({
    obtener: () =>
      vacio.current ? null : (canvasRef.current?.toDataURL("image/png") ?? null),
    limpiar,
  }));

  return (
    <div>
      <canvas
        ref={canvasRef}
        onPointerDown={inicio}
        onPointerMove={mover}
        onPointerUp={fin}
        onPointerLeave={fin}
        className="h-40 w-full touch-none rounded-xl border-2 border-dashed border-luda-lila/40 bg-white"
      />
      <button
        type="button"
        onClick={limpiar}
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-luda-gris-light hover:text-luda-lila-dark"
      >
        <Eraser className="h-3.5 w-3.5" /> Limpiar firma
      </button>
    </div>
  );
});
