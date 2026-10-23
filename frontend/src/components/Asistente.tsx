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
  onCancelar,
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
  // "Cancelar" arriba a la derecha, en todos los pasos: sale del asistente sin guardar nada.
  onCancelar?: () => void;
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
          {onCancelar ? (
            <button
              type="button"
              onClick={onCancelar}
              className="h-10 shrink-0 rounded-full px-3 text-sm font-medium text-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Cancelar
            </button>
          ) : (
            <span className="size-10 shrink-0" aria-hidden="true" />
          )}
        </div>

        <h1 className="mt-8 mb-1 text-4xl leading-tight">{titulo}</h1>
        {ayuda && <p className="m-0 text-muted-foreground">{ayuda}</p>}

        <div className="flex flex-1 flex-col justify-center py-6">{children}</div>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {nota && <p className="mt-0 mb-3 text-center text-sm text-muted-foreground">{nota}</p>}
        <Button
          type="button"
          size="xl"
          className="mt-2 w-full"
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

// Ancho (o alto, en la vertical) de cada marca de la regla, en píxeles.
const MARCA = 14;

function formatear(valor: number, paso: number): string {
  const decimales = paso < 1 ? 1 : 0;
  return valor.toLocaleString("es-AR", { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
}

// Número grande con una regla que se desliza (como la de Hevy). Horizontal por defecto (el peso);
// `vertical` (la altura) la pone a la derecha, con las rayas hacia la izquierda y el número y los
// botones − y + a su izquierda. También se ajusta con − y +, que sirven con mouse y teclado.
export function ReglaNumero({
  valor,
  min,
  max,
  paso,
  unidad,
  etiqueta,
  cadaCuantas,
  vertical = false,
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
  // Regla vertical: se desliza hacia arriba y abajo y el valor crece hacia arriba.
  vertical?: boolean;
  onChange: (v: number) => void;
}) {
  const regla = useRef<HTMLDivElement>(null);
  const marcas = Math.round((max - min) / paso);
  const indice = Math.round((valor - min) / paso);

  // Al abrir, y cuando el valor cambia por los botones, la regla se mueve hasta la marca.
  const yaPuesta = useRef(false);
  // En la vertical el valor crece hacia arriba (como una regla de altura): la marca 0 queda abajo.
  const aMarca = (posicion: number) => {
    const m = Math.round(posicion / MARCA);
    return vertical ? marcas - m : m;
  };
  const aPosicion = (i: number) => (vertical ? marcas - i : i) * MARCA;

  useEffect(() => {
    const el = regla.current;
    if (!el) return;
    if (aMarca(vertical ? el.scrollTop : el.scrollLeft) !== indice) {
      // La primera vez (al abrir el paso) va directo; después, con animación.
      const destino = aPosicion(indice);
      el.scrollTo({
        ...(vertical ? { top: destino } : { left: destino }),
        behavior: yaPuesta.current ? "smooth" : "instant",
      });
    }
    yaPuesta.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, vertical]);

  function alDeslizar() {
    const el = regla.current;
    if (!el) return;
    const i = Math.min(marcas, Math.max(0, aMarca(vertical ? el.scrollTop : el.scrollLeft)));
    if (i !== indice) onChange(Number((min + i * paso).toFixed(2)));
  }

  function mover(delta: number) {
    onChange(Number(Math.min(max, Math.max(min, valor + delta)).toFixed(2)));
  }

  const mostrado = formatear(valor, paso);
  const baja = (
    <Button type="button" size="icon-lg" variant="outline" onClick={() => mover(-paso)}
      disabled={valor <= min} aria-label={`Bajar ${etiqueta}`}>
      <Minus />
    </Button>
  );
  const sube = (
    <Button type="button" size="icon-lg" variant="outline" onClick={() => mover(paso)}
      disabled={valor >= max} aria-label={`Subir ${etiqueta}`}>
      <Plus />
    </Button>
  );
  const numero = (
    <p
      className="m-0 text-center font-heading text-8xl leading-none font-bold tabular-nums"
      role="status"
      aria-label={`${etiqueta}: ${mostrado} ${unidad}`}
    >
      {mostrado}
      <span className="ml-1.5 text-2xl font-medium text-muted-foreground">{unidad}</span>
    </p>
  );

  const marcasLargas = "var(--disco-tinta, #172033) 0 2px, transparent 2px";
  const marcasCortas = "#9aa3ae 0 1px, transparent 1px";
  const reglaTrama = vertical
    ? {
        height: marcas * MARCA + 2,
        width: "100%",
        backgroundImage: `linear-gradient(to bottom, ${marcasLargas}), linear-gradient(to bottom, ${marcasCortas})`,
        backgroundSize: `70% ${MARCA * cadaCuantas}px, 40% ${MARCA}px`,
        backgroundPosition: "right top",
        backgroundRepeat: "repeat-y",
      }
    : {
        width: marcas * MARCA + 2,
        height: "100%",
        backgroundImage: `linear-gradient(to right, ${marcasLargas}), linear-gradient(to right, ${marcasCortas})`,
        backgroundSize: `${MARCA * cadaCuantas}px 70%, ${MARCA}px 40%`,
        backgroundPosition: "left bottom",
        backgroundRepeat: "repeat-x",
      };

  const cinta = (
    <div className="relative">
      <div
        ref={regla}
        onScroll={alDeslizar}
        aria-hidden="true"
        className={cn(
          "flex overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          vertical ? "h-72 w-24 touch-pan-y flex-col" : "h-16 touch-pan-x",
        )}
      >
        <div className={cn("shrink-0", vertical ? "h-1/2" : "w-1/2")} />
        <div className="shrink-0" style={reglaTrama} />
        <div className={cn("shrink-0", vertical ? "h-1/2" : "w-1/2")} />
      </div>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute bg-disco-azul",
          vertical
            ? "top-1/2 -left-6 h-0.5 w-[calc(100%+1.5rem)] -translate-y-1/2"
            : "top-0 left-1/2 h-full w-0.5 -translate-x-1/2",
        )}
      />
    </div>
  );

  if (vertical) {
    return (
      <div className="flex items-center justify-center gap-6">
        {/* Ancho fijo: si el número cambia de ancho (99 a 100), la regla y su línea azul no se mueven. */}
        <div className="flex w-48 shrink-0 flex-col items-center gap-4">
          {sube}
          {numero}
          {baja}
        </div>
        {cinta}
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-center justify-center gap-3">
        {baja}
        {numero}
        {sube}
      </div>
      <div className="mt-10">{cinta}</div>
    </div>
  );
}

// Altura de cada fila de la rueda, en píxeles.
const FILA = 56;

// Rueda de números (como la de Hevy): una lista que se desliza hacia arriba y abajo, con el
// número elegido en el centro, dentro de una banda. Sirve para la fecha de nacimiento (una
// rueda por día, mes y año): `compacta` la hace angosta, y `formato` cambia lo que se escribe
// (por ejemplo, el nombre del mes).
export function RuedaNumero({
  valor,
  min,
  max,
  paso = 1,
  unidad,
  etiqueta,
  formato,
  compacta = false,
  className,
  onChange,
}: {
  valor: number;
  min: number;
  max: number;
  // De cuánto en cuánto va la rueda (los minutos de una sesión, de 20 en 20).
  paso?: number;
  unidad: string;
  etiqueta: string;
  formato?: (n: number) => string;
  compacta?: boolean;
  className?: string;
  onChange: (v: number) => void;
}) {
  const rueda = useRef<HTMLDivElement>(null);
  const yaPuesta = useRef(false);
  const cantidad = Math.floor((max - min) / paso) + 1;
  const numeros = Array.from({ length: cantidad }, (_, i) => min + i * paso);

  // Al abrir, la rueda va directo al valor; si cambia desde afuera (teclado), con animación.
  useEffect(() => {
    const el = rueda.current;
    if (!el) return;
    const lugar = (valor - min) / paso;
    if (Math.round(el.scrollTop / FILA) !== lugar) {
      el.scrollTo({ top: lugar * FILA, behavior: yaPuesta.current ? "smooth" : "instant" });
    }
    yaPuesta.current = true;
  }, [valor, min, paso]);

  function alDeslizar() {
    const el = rueda.current;
    if (!el) return;
    const i = Math.min(cantidad - 1, Math.max(0, Math.round(el.scrollTop / FILA)));
    if (min + i * paso !== valor) onChange(min + i * paso);
  }

  return (
    <div className={cn("relative mx-auto", compacta ? "w-full" : "w-56", className)}>
      {/* La banda del número elegido. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-2xl bg-muted"
        style={{ height: FILA }}
      />
      <div
        ref={rueda}
        onScroll={alDeslizar}
        role="spinbutton"
        tabIndex={0}
        aria-label={etiqueta}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={valor}
        aria-valuetext={`${valor} ${unidad}`}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") {
            e.preventDefault();
            onChange(Math.max(min, valor - paso));
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            onChange(Math.min(max, valor + paso));
          }
        }}
        className="relative snap-y snap-mandatory overflow-y-auto outline-none [scrollbar-width:none] focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-scrollbar]:hidden"
        style={{ height: FILA * 5 }}
      >
        <div style={{ height: FILA * 2 }} aria-hidden="true" />
        {numeros.map((n) => (
          <div
            key={n}
            aria-hidden="true"
            onClick={() => onChange(n)}
            className={cn(
              "flex snap-center items-center justify-center font-heading font-bold",
              n === valor ? (compacta ? "text-3xl" : "text-5xl") : compacta ? "text-xl text-muted-foreground" : "text-3xl text-muted-foreground",
            )}
            style={{ height: FILA }}
          >
            {formato ? formato(n) : n}
            {n === valor && unidad && <span className="ml-2 text-xl font-medium text-muted-foreground">{unidad}</span>}
          </div>
        ))}
        <div style={{ height: FILA * 2 }} aria-hidden="true" />
      </div>
    </div>
  );
}
