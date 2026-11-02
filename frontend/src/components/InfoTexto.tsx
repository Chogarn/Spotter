"use client";

import { Info, X } from "lucide-react";
import { useRef } from "react";

// Un ícono ⓘ que abre un panel con una aclaración, con el mismo formato que el de `InfoMapa`: así
// la pantalla no lleva el texto todo el tiempo.
export function InfoTexto({ titulo, children, className }: { titulo: string; children: React.ReactNode; className?: string }) {
  const panel = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        aria-label={titulo}
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
        aria-label={titulo}
        onClick={(e) => {
          if (e.target === panel.current) panel.current?.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border-0 bg-background p-0 text-foreground backdrop:bg-black/40"
      >
        <div className="p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h2 className="my-0 text-2xl">{titulo}</h2>
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => panel.current?.close()}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          {children}
        </div>
      </dialog>
    </>
  );
}
