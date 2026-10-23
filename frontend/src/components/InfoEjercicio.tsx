"use client";

import { Info, X } from "lucide-react";
import { useRef } from "react";

// El ícono de información de un ejercicio (decisión 85): un ⓘ chico que abre un panel con "Cómo
// hacerlo" y "Por qué está en tu rutina". Así la pantalla no lleva esos textos todo el tiempo.
// Se abre en el centro de la pantalla. Usa el <dialog> del navegador: tapa el fondo, se cierra con Escape o tocando afuera y devuelve el
// foco al botón. Sin ninguno de los dos textos no dibuja nada.
export function InfoEjercicio({
  nombre,
  comoHacerlo,
  porQue,
  className,
}: {
  nombre: string;
  comoHacerlo: string | null | undefined;
  porQue: string | null | undefined;
  className?: string;
}) {
  const panel = useRef<HTMLDialogElement>(null);
  if (!comoHacerlo && !porQue) return null;

  return (
    <>
      <button
        type="button"
        aria-label={`Más información de ${nombre}`}
        onClick={() => panel.current?.showModal()}
        className={
          "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 " +
          (className ?? "")
        }
      >
        <Info className="size-5" aria-hidden="true" />
      </button>
      <dialog
        ref={panel}
        aria-label={`Información de ${nombre}`}
        onClick={(e) => {
          if (e.target === panel.current) panel.current?.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border-0 bg-background p-0 text-foreground backdrop:bg-black/40"
      >
        <div className="p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h2 className="my-0 text-2xl">{nombre}</h2>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => panel.current?.close()}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          {comoHacerlo && (
            <section className="mb-4">
              <h3 className="mt-0 mb-1 text-sm font-medium text-muted-foreground">Cómo hacerlo</h3>
              <p className="m-0">{comoHacerlo}</p>
            </section>
          )}
          {porQue && (
            <section>
              <h3 className="mt-0 mb-1 text-sm font-medium text-muted-foreground">Por qué está en tu rutina</h3>
              <p className="m-0">{porQue}</p>
            </section>
          )}
        </div>
      </dialog>
    </>
  );
}
