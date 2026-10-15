"use client";

import { ChevronLeft, Minus, Plus } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ErrorMessage";
import { cn } from "cn";

// Un paso de un asistente: una pregunta por pantalla, en pantalla completa (tapa la barra de
// abajo, como la pantalla de carga). Flecha para volver, barrita de avance y "Continuar" fijo.
export function PasoAsistente({
  paso,
  total,
  titulo,
  ayuda,
  onAtras,
  etiquetaAtras = "Volver",
  onContinuar,
  continuar = "Continuar",
  deshabilitado = false,
  ocupado = false,
  error,
  nota,
  children,
}: {
  paso: number; // empieza en 1
  total: number;
  titulo: string;
  ayuda?: string;
  onAtras?: () => void;
  etiquetaAtras?: string;
  onContinuar: () => void;
  continuar?: string;
  deshabilitado?: boolean;
  ocupado?: boolean;
  error?: string;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex flex-col overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-4 pb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onAtras}
            disabled={!onAtras}
            aria-label={etiquetaAtras}
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:invisible"
          >
            <ChevronLeft className="size-6" aria-hidden="true" />
          </button>
          <div
            role="progressbar"
            aria-label="Avance"
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuenow={paso}
            className="flex flex-1 gap-1"
          >
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className={cn("h-1.5 flex-1 rounded-full", i < paso ? "bg-disco-rojo" : "bg-border")}
              />
            ))}
          </div>
          <span className="size-10 shrink-0" aria-hidden="true" />
        </div>

        <h1 className="mt-8 mb-1 text-4xl leading-tight">{titulo}</h1>
        {ayuda && <p className="m-0 text-muted-foreground">{ayuda}</p>}

        <div className="flex flex-1 flex-col justify-center py-6">{children}</div>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {nota && <p className="mt-0 mb-3 text-center text-sm text-muted-foreground">{nota}</p>}
        <Button
          type="button"
          size="lg"
          className="mt-2 h-12 w-full rounded-full text-base"
          onClick={onContinuar}
          disabled={deshabilitado || ocupado}
        >
          {continuar}
        </Button>
      </div>
    </div>
  );
}

// Una opción grande, para elegir una entre pocas (objetivo, nivel, sexo...). Va dentro de un
// `role="radiogroup"` (ver `GrupoOpciones`).
export function OpcionAsistente({
  seleccionada,
  onElegir,
  icono,
  titulo,
  detalle,
}: {
  seleccionada: boolean;
  onElegir: () => void;
  icono?: React.ReactNode;
  titulo: string;
  detalle?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={seleccionada}
      onClick={onElegir}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border-2 bg-card px-4 py-3.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        seleccionada ? "border-disco-azul" : "border-transparent",
      )}
    >
      {icono}
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-2xl leading-tight font-bold">{titulo}</span>
        {detalle && <span className="block text-sm text-muted-foreground">{detalle}</span>}
      </span>
    </button>
  );
}

export function GrupoOpciones({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className="grid gap-2.5">
      {children}
    </div>
  );
}

// Ancho de cada marca de la regla, en píxeles.
const MARCA = 14;

// Número grande con una regla horizontal que se desliza (como la de Hevy). También se puede
// ajustar con − y +, que sirven con mouse y teclado.
export function ReglaNumero({
  valor,
  min,
  max,
  paso,
  unidad,
  etiqueta,
  cadaCuantas,
  onChange,
}: {
  valor: number;
  min: number;
  max: number;
  paso: number;
  unidad: string;
  etiqueta: string;
  // Cada cuántas marcas va una marca larga.
  cadaCuantas: number;
  onChange: (v: number) => void;
}) {
  const regla = useRef<HTMLDivElement>(null);
  const marcas = Math.round((max - min) / paso);
  const indice = Math.round((valor - min) / paso);

  // Al abrir, y cuando el valor cambia por los botones, la regla se mueve hasta la marca.
  const yaPuesta = useRef(false);
  useEffect(() => {
    const el = regla.current;
    if (!el) return;
    if (Math.round(el.scrollLeft / MARCA) !== indice) {
      // La primera vez (al abrir el paso) va directo; después, con animación.
      el.scrollTo({ left: indice * MARCA, behavior: yaPuesta.current ? "smooth" : "instant" });
    }
    yaPuesta.current = true;
  }, [indice]);

  function alDeslizar() {
    const el = regla.current;
    if (!el) return;
    const i = Math.min(marcas, Math.max(0, Math.round(el.scrollLeft / MARCA)));
    if (i !== indice) onChange(Number((min + i * paso).toFixed(2)));
  }

  function mover(delta: number) {
    onChange(Number(Math.min(max, Math.max(min, valor + delta)).toFixed(2)));
  }

  const decimales = paso < 1 ? 1 : 0;
  const mostrado = valor.toLocaleString("es-AR", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });

  return (
    <div>
      <div className="flex items-center justify-center gap-3">
        <Button type="button" size="icon-lg" variant="outline" onClick={() => mover(-paso)}
          disabled={valor <= min} aria-label={`Bajar ${etiqueta}`}>
          <Minus />
        </Button>
        <p
          className="m-0 min-w-40 text-center font-heading text-8xl leading-none font-bold"
          role="status"
          aria-label={`${etiqueta}: ${mostrado} ${unidad}`}
        >
          {mostrado}
          <span className="ml-1.5 text-2xl font-medium text-muted-foreground">{unidad}</span>
        </p>
        <Button type="button" size="icon-lg" variant="outline" onClick={() => mover(paso)}
          disabled={valor >= max} aria-label={`Subir ${etiqueta}`}>
          <Plus />
        </Button>
      </div>

      <div className="relative mt-10">
        <div
          ref={regla}
          onScroll={alDeslizar}
          aria-hidden="true"
          className="flex h-16 touch-pan-x overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="w-1/2 shrink-0" />
          <div
            className="h-full shrink-0"
            style={{
              width: marcas * MARCA + 2,
              backgroundImage:
                "linear-gradient(to right, var(--disco-tinta, #172033) 0 2px, transparent 2px), linear-gradient(to right, #9aa3ae 0 1px, transparent 1px)",
              backgroundSize: `${MARCA * cadaCuantas}px 70%, ${MARCA}px 40%`,
              backgroundPosition: "left bottom",
              backgroundRepeat: "repeat-x",
            }}
          />
          <div className="w-1/2 shrink-0" />
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 h-full w-0.5 -translate-x-1/2 bg-disco-azul"
        />
      </div>
    </div>
  );
}
