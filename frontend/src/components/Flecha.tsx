"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "cn";

// "‹" o "›" grande y sin recuadro, al lado de una fila de barras (ejercicios del modo entrenar,
// días de la propuesta). En los extremos no se muestra, pero guarda su lugar.
export function Flecha({
  direccion,
  visible,
  disabled = false,
  nombre,
  que = "Ejercicio",
  onClick,
}: {
  direccion: "anterior" | "siguiente";
  que?: string;
  visible: boolean;
  disabled?: boolean;
  nombre?: string;
  onClick: () => void;
}) {
  const Icono = direccion === "anterior" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !visible}
      aria-hidden={!visible}
      tabIndex={visible ? undefined : -1}
      aria-label={nombre ? `${que} ${direccion}: ${nombre}` : `${que} ${direccion}`}
      className={cn(
        "-my-2 flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50",
        !visible && "invisible",
      )}
    >
      <Icono className="size-9" strokeWidth={3} />
    </button>
  );
}
