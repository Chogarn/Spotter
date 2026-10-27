"use client";

import { Info, X } from "lucide-react";
import { useRef } from "react";

// El ícono ⓘ del mapa muscular: abre un panel con cómo leer los colores. Mismo formato que el ⓘ de un
// ejercicio, así la pantalla no lleva la leyenda ni el texto todo el tiempo.
export function InfoMapa({ className }: { className?: string }) {
  const panel = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        aria-label="Cómo leer el mapa"
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
        aria-label="Cómo leer el mapa"
        onClick={(e) => {
          if (e.target === panel.current) panel.current?.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border-0 bg-background p-0 text-foreground backdrop:bg-black/40"
      >
        <div className="p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h2 className="my-0 text-2xl">Cómo leer el mapa</h2>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => panel.current?.close()}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span>Menos</span>
            {["#b9d0f0", "#6f9ee0", "#1f5fbf", "#123a7a"].map((c) => (
              <span key={c} className="size-4 rounded-full" style={{ background: c }} aria-hidden="true" />
            ))}
            <span>más series</span>
          </div>
          <p className="m-0 mb-2">Cuanto más oscuro el azul, más series directas hiciste en ese músculo.</p>
          <p className="m-0">Cuenta el músculo principal de cada ejercicio. En blanco, lo que no trabajaste.</p>
        </div>
      </dialog>
    </>
  );
}
