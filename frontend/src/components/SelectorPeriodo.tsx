"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

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

// El botón del período ("Día ▾"): abre un menú con Día, Semana, Mes y Año. Va en la misma fila que las
// flechas de la fecha, para dejarle lugar al gráfico.
export function SelectorPeriodo({ periodo, onElegir }: { periodo: Periodo; onElegir: (p: Periodo) => void }) {
  return <SelectorChip opciones={OPCIONES} valor={periodo} onElegir={onElegir} etiqueta="Período" />;
}

// El mismo botón con menú para cualquier lista corta de opciones (el tramo de un gráfico, por ejemplo).
export function SelectorChip<T extends string>({
  opciones,
  valor,
  onElegir,
  etiqueta,
}: {
  opciones: { id: T; texto: string }[];
  valor: T;
  onElegir: (id: T) => void;
  etiqueta: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  return (
    <div ref={caja} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-label={etiqueta}
        onClick={() => setAbierto((a) => !a)}
        className="flex h-8 items-center gap-1 rounded-full border border-border-strong bg-background px-3 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {opciones.find((o) => o.id === valor)?.texto}
        <ChevronDown className={cn("size-4 transition-transform", abierto && "rotate-180")} aria-hidden="true" />
      </button>
      {abierto && (
        <ul
          role="listbox"
          aria-label={etiqueta}
          className="absolute top-full left-0 z-20 m-0 mt-1 min-w-32 list-none rounded-2xl border border-border bg-popover p-1 shadow-md"
        >
          {opciones.map((o) => (
            <li
              key={o.id}
              role="option"
              aria-selected={valor === o.id}
              onClick={() => {
                onElegir(o.id);
                setAbierto(false);
              }}
              className={cn(
                "cursor-pointer rounded-xl px-3 py-2 text-sm hover:bg-muted",
                valor === o.id && "bg-muted font-medium",
              )}
            >
              {o.texto}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
