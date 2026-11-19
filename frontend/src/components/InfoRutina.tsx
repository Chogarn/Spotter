"use client";

import { Info, X } from "lucide-react";
import { useRef, useState } from "react";

import { Confirmar } from "@/components/Confirmar";
import { readError, type Routine, apiFetch } from "@/lib/api";
import { goalText, shortDate, splitText } from "@/lib/format";

// El ícono ⓘ de una rutina de la lista: abre un panel con todo lo que la tarjeta no muestra (el
// nombre completo, el objetivo, los días, la estructura, las semanas y cuándo se creó). Mismo
// formato que el ⓘ de un ejercicio. Va fuera del enlace de la tarjeta (un botón no va dentro de un enlace).
// Si la rutina no tiene nada registrado (`deletable`), abajo ofrece "Eliminar rutina" (decisión 149).
export function InfoRutina({
  rutina,
  activa,
  className,
  onEliminada,
  onError,
}: {
  rutina: Routine;
  activa: boolean;
  className?: string;
  onEliminada?: (id: number) => void;
  onError?: (mensaje: string) => void;
}) {
  const panel = useRef<HTMLDialogElement>(null);
  const [confirmando, setConfirmando] = useState(false);

  async function eliminar() {
    setConfirmando(false);
    try {
      const res = await apiFetch(`/routines/${rutina.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await readError(res));
      onEliminada?.(rutina.id);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "No se pudo eliminar la rutina");
    }
  }

  const filas: [string, string][] = [
    ["Objetivo", goalText[rutina.goal] ?? rutina.goal],
    ["Nivel", rutina.level],
    ["Días por semana", rutina.days_per_week ? String(rutina.days_per_week) : "—"],
    ["Estructura", rutina.split_type ? splitText[rutina.split_type] : "—"],
    ["Lleva", `${rutina.week_count} ${rutina.week_count === 1 ? "semana" : "semanas"}`],
    ["Creada el", shortDate(rutina.created_at)],
    ["Estado", activa ? (rutina.has_active_week ? "Activa · semana en curso" : "Activa") : "Terminada"],
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
          {rutina.deletable && onEliminada && (
            <button
              type="button"
              onClick={() => {
                // El recuadro de confirmar se abre sobre la pantalla, no sobre este panel.
                panel.current?.close();
                setConfirmando(true);
              }}
              className="mt-5 w-full rounded-full border border-destructive/40 px-4 py-2.5 font-medium text-destructive outline-none hover:bg-destructive/10 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Eliminar rutina
            </button>
          )}
        </div>
      </dialog>
      <Confirmar
        abierto={confirmando}
        titulo="¿Eliminar esta rutina?"
        texto="Se elimina la rutina y sus semanas. No tiene nada registrado. No se puede deshacer."
        accion="Eliminar"
        onConfirmar={eliminar}
        onCancelar={() => setConfirmando(false)}
      />
    </>
  );
}
