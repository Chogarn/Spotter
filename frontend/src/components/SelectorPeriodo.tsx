"use client";

import { useSyncExternalStore } from "react";

import { cn } from "cn";

export type Periodo = "day" | "week" | "month" | "year";

const OPCIONES: { id: Periodo; texto: string }[] = [
  { id: "day", texto: "Día" },
  { id: "week", texto: "Semana" },
  { id: "month", texto: "Mes" },
  { id: "year", texto: "Año" },
];

const CLAVE = "spotter.periodo";
const AVISO = "spotter:periodo";

// La elección se recuerda en el navegador y vale para todas las pestañas de Progreso. Se lee con
// useSyncExternalStore: en el servidor y al hidratar es "week" y después pasa a lo guardado.
function suscribir(aviso: () => void) {
  window.addEventListener(AVISO, aviso);
  window.addEventListener("storage", aviso);
  return () => {
    window.removeEventListener(AVISO, aviso);
    window.removeEventListener("storage", aviso);
  };
}

function leer(): Periodo {
  try {
    const guardado = window.localStorage.getItem(CLAVE);
    return OPCIONES.some((o) => o.id === guardado) ? (guardado as Periodo) : "week";
  } catch {
    return "week";
  }
}

export function usePeriodo(): [Periodo, (p: Periodo) => void] {
  const periodo = useSyncExternalStore(suscribir, leer, () => "week" as Periodo);
  function elegir(p: Periodo) {
    try {
      window.localStorage.setItem(CLAVE, p);
    } catch {
      // sin almacenamiento: la elección vale hasta recargar
    }
    window.dispatchEvent(new Event(AVISO));
  }
  return [periodo, elegir];
}

// Día · Semana · Mes · Año, arriba de Progreso.
export function SelectorPeriodo({ periodo, onElegir }: { periodo: Periodo; onElegir: (p: Periodo) => void }) {
  return (
    <div className="mb-3 flex gap-1 rounded-full bg-muted p-1" role="group" aria-label="Período">
      {OPCIONES.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={periodo === o.id}
          onClick={() => onElegir(o.id)}
          className={cn(
            "flex-1 rounded-full px-3 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            periodo === o.id ? "bg-disco-tinta font-medium text-white" : "text-muted-foreground",
          )}
        >
          {o.texto}
        </button>
      ))}
    </div>
  );
}
