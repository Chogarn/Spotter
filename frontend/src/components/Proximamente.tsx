"use client";

import { useState } from "react";

import { cn } from "cn";

// Botones que ya están en su lugar pero todavía no hacen nada (decisión 75). Al tocarlos avisan
// que no están disponibles, en vez de quedar apagados: un botón gris no explica por qué.
export function EtiquetaProximamente() {
  return (
    <span className="shrink-0 rounded-full bg-disco-amarillo px-2 py-0.5 text-xs font-medium text-disco-tinta">
      Próximamente
    </span>
  );
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="mx-0 mt-1 mb-2 rounded-xl bg-disco-amarillo/20 px-3 py-2 text-sm">
      {children}
    </p>
  );
}

// Una fila de la tarjeta de Cuenta: el nombre de la acción y la etiqueta "Próximamente".
export function FilaProximamente({
  texto,
  mensaje,
  peligro = false,
}: {
  texto: string;
  mensaje: string;
  peligro?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="border-t border-border first:border-t-0">
      <button
        type="button"
        onClick={() => setVisible(true)}
        className={cn(
          "flex min-h-12 w-full items-center justify-between gap-2 rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          peligro && "text-destructive",
        )}
      >
        <span>{texto}</span>
        <EtiquetaProximamente />
      </button>
      {visible && <Aviso>{mensaje}</Aviso>}
    </div>
  );
}

// Un enlace de texto que todavía no lleva a ningún lado (el login): igual avisa al tocarlo.
export function EnlaceProximamente({ texto, mensaje }: { texto: string; mensaje: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="mt-4 text-center">
      <button
        type="button"
        onClick={() => setVisible(true)}
        className="rounded-md font-medium text-foreground underline outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {texto}
      </button>
      {visible && <Aviso>{mensaje}</Aviso>}
    </div>
  );
}
