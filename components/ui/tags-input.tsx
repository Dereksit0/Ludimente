"use client";

import * as React from "react";

import { X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  /** Sugerencias para autocompletar (datalist). */
  sugerencias?: readonly string[];
  className?: string;
}

/** Entrada de etiquetas múltiples (diagnósticos secundarios, técnicas, etc.). */
export function TagsInput({
  value,
  onChange,
  placeholder = "Escribe y presiona Enter…",
  sugerencias,
  className,
}: TagsInputProps) {
  const [texto, setTexto] = React.useState("");
  const listId = React.useId();

  function agregar(tag: string) {
    const limpio = tag.trim();
    if (!limpio || value.includes(limpio)) return;
    onChange([...value, limpio]);
    setTexto("");
  }

  function quitar(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Input
        value={texto}
        list={sugerencias ? listId : undefined}
        placeholder={placeholder}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            agregar(texto);
          } else if (e.key === "Backspace" && !texto && value.length) {
            quitar(value[value.length - 1]!);
          }
        }}
      />
      {sugerencias && (
        <datalist id={listId}>
          {sugerencias.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-luda-lila-light px-3 py-1 text-xs font-semibold text-luda-lila-dark"
            >
              {tag}
              <button
                type="button"
                onClick={() => quitar(tag)}
                aria-label={`Quitar ${tag}`}
                className="rounded-full p-0.5 hover:bg-luda-lila/30"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
