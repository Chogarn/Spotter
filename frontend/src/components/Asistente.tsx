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
  sinAvance = false,
  children,
}: {
  paso: number; // empieza en 1
  total: number;
  // Oculta la barrita de avance (al editar un dato ya guardado no hay un "proceso" que avanzar).
  sinAvance?: boolean;
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
          {sinAvance ? (
            <div className="flex-1" aria-hidden="true" />
          ) : (
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
          )}
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
  compacta = false,
  sinBotones = false,
  enfocar = false,
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
  // Más chica (número y regla), para poner dos en la misma ventana.
  compacta?: boolean;
  // Sin los botones − y +: solo se ajusta deslizando la regla.
  sinBotones?: boolean;
  // Enfoca la regla al aparecer, para que las flechas del teclado anden sin tocarla.
  enfocar?: boolean;
  onChange: (v: number) => void;
}) {
  const regla = useRef<HTMLDivElement>(null);
  const marcas = Math.round((max - min) / paso);
  const indice = Math.round((valor - min) / paso);

  // Al abrir, y cuando el valor cambia por los botones, la regla se mueve hasta la marca.
  const yaPuesta = useRef(false);
  // Si hay un botón − o + apretado (ver `empezar`, más abajo).
  const repitiendo = useRef(false);
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
        // Mientras se mantiene apretado − o +, sin animación: el valor cambia más rápido que ella.
        behavior: yaPuesta.current && !repitiendo.current ? "smooth" : "instant",
      });
    }
    yaPuesta.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, vertical]);

  function alDeslizar() {
    // Mientras se mantiene apretado un botón, manda el botón: la regla solo lo sigue.
    if (repitiendo.current) return;
    const el = regla.current;
    if (!el) return;
    const i = Math.min(marcas, Math.max(0, aMarca(vertical ? el.scrollTop : el.scrollLeft)));
    if (i !== indice) onChange(Number((min + i * paso).toFixed(2)));
  }

  // El valor al día, para el botón que se mantiene apretado (su reloj no ve los renders nuevos).
  const valorActual = useRef(valor);
  useEffect(() => {
    valorActual.current = valor;
  }, [valor]);

  function mover(delta: number) {
    const nuevo = Number(Math.min(max, Math.max(min, valorActual.current + delta)).toFixed(2));
    valorActual.current = nuevo;
    onChange(nuevo);
  }

  // Mantener apretado − o +: un paso al apretar y, si se sigue apretando, el valor sigue
  // avanzando cada vez más rápido (después de 0,4 s, cada 120 ms; desde 1,5 s, cada 60 ms;
  // desde 3 s, cada 30 ms). Se corta al soltar en cualquier lado o al llegar al límite.
  const reloj = useRef<number | null>(null);

  function parar() {
    if (reloj.current !== null) window.clearTimeout(reloj.current);
    reloj.current = null;
    repitiendo.current = false;
  }

  function empezar(delta: number) {
    parar();
    repitiendo.current = true;
    window.addEventListener("pointerup", parar, { once: true });
    window.addEventListener("pointercancel", parar, { once: true });
    window.addEventListener("blur", parar, { once: true });
    mover(delta);
    // Cuenta los pasos en vez de mirar el reloj: 400 ms + 9 × 120 ms ≈ 1,5 s y 25 × 60 ms ≈ 1,5 s más.
    const seguir = (n: number, espera: number) => {
      reloj.current = window.setTimeout(() => {
        const v = valorActual.current;
        if ((delta < 0 && v <= min) || (delta > 0 && v >= max)) return parar();
        mover(delta);
        seguir(n + 1, n < 9 ? 120 : n < 34 ? 60 : 30);
      }, espera);
    };
    seguir(0, 400);
  }

  // Si el paso se cierra con el botón apretado, el reloj no queda andando.
  useEffect(() => parar, []);

  // Flechas del teclado, con el foco en la regla o en un botón − o +. Como en la regla: en la
  // horizontal, → y ↑ suben y ← y ↓ bajan; en la vertical, ↑ sube y ↓ baja. Mantener la tecla
  // apretada repite sola (la repetición es del sistema).
  function alTeclear(e: React.KeyboardEvent) {
    const sube = vertical ? e.key === "ArrowUp" : e.key === "ArrowRight" || e.key === "ArrowUp";
    const baja = vertical ? e.key === "ArrowDown" : e.key === "ArrowLeft" || e.key === "ArrowDown";
    if (!sube && !baja) return;
    e.preventDefault();
    // Como con el botón apretado: la regla salta sin animación y no pisa el valor al moverse.
    repitiendo.current = true;
    mover(sube ? paso : -paso);
  }

  function alSoltarTecla() {
    if (reloj.current === null) repitiendo.current = false;
  }

  // `enfocar`: al abrir el paso, la regla ya toma las flechas sin tener que tocarla.
  useEffect(() => {
    if (enfocar) regla.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mostrado = formatear(valor, paso);
  const tamanoBoton = compacta ? "icon" : "icon-lg";
  // touch-none y onContextMenu: en el celular, mantener apretado no desplaza ni abre el menú
  // del sistema. onClick solo atiende el teclado (Enter o espacio, detail 0): un paso por vez.
  // onPointerDown no frena el comportamiento normal, así el botón queda enfocado y toma las flechas.
  const baja = (
    <Button type="button" size={tamanoBoton} variant="outline" className="touch-none select-none"
      onPointerDown={(e) => { if (e.button === 0) empezar(-paso); }}
      onClick={(e) => { if (e.detail === 0) mover(-paso); }}
      onContextMenu={(e) => e.preventDefault()}
      disabled={valor <= min} aria-label={`Bajar ${etiqueta}`}>
      <Minus />
    </Button>
  );
  const sube = (
    <Button type="button" size={tamanoBoton} variant="outline" className="touch-none select-none"
      onPointerDown={(e) => { if (e.button === 0) empezar(paso); }}
      onClick={(e) => { if (e.detail === 0) mover(paso); }}
      onContextMenu={(e) => e.preventDefault()}
      disabled={valor >= max} aria-label={`Subir ${etiqueta}`}>
      <Plus />
    </Button>
  );
  const numero = (
    <p
      className={cn("m-0 text-center font-heading leading-none font-bold tabular-nums", compacta ? "text-5xl" : "text-8xl")}
      role="status"
      aria-label={`${etiqueta}: ${mostrado} ${unidad}`}
    >
      {mostrado}
      <span className={cn("ml-1.5 font-medium text-muted-foreground", compacta ? "text-lg" : "text-2xl")}>{unidad}</span>
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
        tabIndex={0}
        role="slider"
        aria-label={etiqueta}
        aria-orientation={vertical ? "vertical" : "horizontal"}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={valor}
        aria-valuetext={`${mostrado} ${unidad}`}
        className={cn(
          "flex overflow-auto rounded-lg outline-none [scrollbar-width:none] focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-scrollbar]:hidden",
          vertical ? "h-72 w-24 touch-pan-y flex-col" : compacta ? "h-11 touch-pan-x" : "h-16 touch-pan-x",
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
      <div className="flex items-center justify-center gap-6" onKeyDown={alTeclear} onKeyUp={alSoltarTecla}>
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
    <div onKeyDown={alTeclear} onKeyUp={alSoltarTecla}>
      <div className="flex items-center justify-center gap-3">
        {!sinBotones && baja}
        {numero}
        {!sinBotones && sube}
      </div>
      <div className={compacta ? "mt-3" : "mt-10"}>{cinta}</div>
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
