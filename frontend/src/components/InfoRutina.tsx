"use client";

import { Info, X } from "lucide-react";
import { useRef } from "react";

import type { Routine } from "@/lib/api";
import { goalText, shortDate, splitText } from "@/lib/format";

// El ícono ⓘ de una rutina de la lista: abre un panel con todo lo que la tarjeta no muestra (el
// nombre completo, el objetivo, los días, la estructura, las semanas y cuándo se creó). Mismo
// formato que el ⓘ de un ejercicio. Va fuera del enlace de la tarjeta (un botón no va dentro de un enlace).
export function InfoRutina({ rutina, className }: { rutina: Routine; className?: string }) {
  const panel = useRef<HTMLDialogElement>(null);
  const filas: [string, string][] = [
    ["Objetivo", goalText[rutina.goal] ?? rutina.goal],
    ["Nivel", rutina.level],
    ["Días por semana", rutina.days_per_week ? String(rutina.days_per_week) : "—"],
    ["Estructura", rutina.split_type ? splitText[rutina.split_type] : "—"],
    ["Lleva", `${rutina.week_count} ${rutina.week_count === 1 ? "semana" : "semanas"}`],
    ["Creada el", shortDate(rutina.created_at)],
    ["Estado", rutina.has_active_week ? "En curso" : "Lista para continuar"],
  ];

  return (
    <>
      <button
        type="button"
        aria-label={`Más información de ${rutina.name}`}
        onClick={() => panel.current?.showModal()}
        className={
          "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-disco-azul/40 bg-card text-disco-azul outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 " +
          (className ?? "")
        }
      >
        <Info className="size-5" aria-hidden="true" />
      </button>
      <dialog
        ref={panel}
        aria-label={`Información de ${rutina.name}`}
        onClick={(e) => {
          if (e.target === panel.current) panel.current?.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border-0 bg-background p-0 text-foreground backdrop:bg-black/40"
      >
        <div className="p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h2 className="my-0 text-2xl">Información</h2>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => panel.current?.close()}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            {filas.map(([titulo, valor]) => (
              <div key={titulo} className="contents">
                <dt className="text-sm font-medium text-muted-foreground">{titulo}</dt>
                <dd className="m-0 text-right">{valor}</dd>
              </div>
            ))}
          </dl>
        </div>
      </dialog>
    </>
  );
}
