"use client";

import { Check, Play } from "lucide-react";
import { useState } from "react";

import { formato, useSegundos } from "@/components/ContadorSesion";
import { Button } from "@/components/ui/button";
import type { DayDetail } from "@/lib/api";
import { borrarCrono, empezarCrono, leerCrono, minutosDelCrono, pausaDelCrono } from "@/lib/cronometro";
import { cn } from "cn";

// La entrada en calor y el cardio en el modo entrenar (decisión 122): antes, el tiempo
// planificado en grande con "▶ Empezar" y "Saltar"; corriendo, un cronómetro que sube desde 0:00
// (no se corta al pasar lo planificado) con "✓ Finalizar", que guarda los minutos medidos.
export function PasoConReloj({
  dia,
  paso,
  planificado,
  etiqueta = "Entrada en calor",
  texto,
  pausado,
  trabajando,
  onFinalizar,
  onSaltar,
  onRetomar,
}: {
  dia: DayDetail;
  paso: string; // "calor" o el ejercicio y la serie: con eso se guarda el cronómetro
  planificado: string | null; // "5 a 10 min", "20 min"
  etiqueta?: string; // el título chico arriba del reloj
  texto?: string | null;
  pausado: boolean;
  trabajando: boolean;
  onFinalizar: (minutos: number) => Promise<boolean>;
  onSaltar: () => void;
  onRetomar: () => void;
}) {
  const [crono, setCrono] = useState(() => leerCrono(dia.week_id, dia.day_index, paso));

  async function finalizar() {
    if (!crono) return;
    if (await onFinalizar(minutosDelCrono(crono, dia))) borrarCrono(dia.week_id, dia.day_index, paso);
  }

  return (
    <>
      <section className="mt-3 flex flex-col items-center text-center">
        {crono ? (
          <AnilloCorriendo
            desde={crono.inicio}
            pausa={pausaDelCrono(crono, dia)}
            detenidoEn={dia.paused_at ?? null}
            pausado={pausado}
            planificado={planificado}
            etiqueta={etiqueta}
          />
        ) : (
          <Anillo progreso={0}>
            <span className="text-sm text-muted-foreground">{etiqueta}</span>
            {planificado ? (
              <>
                <span className="font-heading text-5xl leading-none font-bold">{planificado}</span>
                <span className="text-sm text-muted-foreground">planificado</span>
              </>
            ) : (
              <span className="font-heading text-6xl leading-none font-bold tabular-nums">00:00</span>
            )}
          </Anillo>
        )}
        {texto && <p className="mt-2 mb-0 text-muted-foreground">{texto}</p>}
      </section>

      {pausado ? (
        <Button size="xl" className="mt-4 w-full" type="button" onClick={onRetomar} disabled={trabajando}>
          <Play /> Retomar
        </Button>
      ) : crono ? (
        <Button
          size="xl"
          className="mt-4 w-full bg-disco-verde text-white hover:bg-disco-verde/90"
          type="button"
          onClick={finalizar}
          disabled={trabajando}
        >
          <Check /> {trabajando ? "Guardando..." : "Finalizar"}
        </Button>
      ) : (
        <>
          <Button
            size="xl"
            className="mt-4 w-full"
            type="button"
            onClick={() => setCrono(empezarCrono(dia, paso))}
            disabled={trabajando}
          >
            <Play /> Empezar
          </Button>
          <button
            type="button"
            onClick={onSaltar}
            disabled={trabajando}
            className="mx-auto mt-2.5 block rounded-md px-2 py-1 font-medium text-muted-foreground underline outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Saltar
          </button>
        </>
      )}
    </>
  );
}

// Los minutos a los que apunta el anillo: el último número de lo planificado ("5 a 10 min" → 10,
// "25 min" → 25). Null si no hay número: el anillo no se llena y solo cuenta.
function minutosObjetivo(planificado: string | null): number | null {
  const numeros = planificado?.match(/\d+/g);
  const n = numeros ? Number(numeros[numeros.length - 1]) : NaN;
  return n > 0 ? n : null;
}

// Un aro como los discos (maqueta del 2026-11-12): gris de fondo y, encima, la parte hecha
// (`progreso` de 0 a 1) en el color que se pase. Lo de adentro va en el centro.
const RADIO = 80;
const VUELTA = 2 * Math.PI * RADIO;
function Anillo({
  progreso,
  color = "var(--disco-tinta)",
  children,
}: {
  progreso: number;
  color?: string;
  children: React.ReactNode;
}) {
  const p = Math.min(1, Math.max(0, progreso));
  return (
    <div className="relative my-3 size-56">
      <svg viewBox="0 0 190 190" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="95" cy="95" r={RADIO} className="fill-card stroke-border" strokeWidth="14" />
        {p > 0 && (
          <circle
            cx="95"
            cy="95"
            r={RADIO}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap={p < 1 ? "round" : "butt"}
            strokeDasharray={VUELTA}
            strokeDashoffset={VUELTA * (1 - p)}
            className="transition-[stroke-dashoffset] duration-700 ease-linear motion-reduce:transition-none"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

// Corriendo: el aro en tinta se llena hacia lo planificado; al llegar se pone verde, entero, y el
// tiempo sigue contando con "+N min" de más. Con el día detenido, todo en gris y "detenido".
function AnilloCorriendo({
  desde,
  pausa,
  detenidoEn,
  pausado,
  planificado,
  etiqueta,
}: {
  desde: string;
  pausa: number;
  detenidoEn: string | null;
  pausado: boolean;
  planificado: string | null;
  etiqueta: string;
}) {
  const segundos = useSegundos(desde, pausa, detenidoEn) ?? 0;
  const objetivo = minutosObjetivo(planificado);
  const progreso = objetivo ? segundos / (objetivo * 60) : 0;
  const cumplido = objetivo !== null && progreso >= 1;
  const color = pausado
    ? "var(--muted-foreground)"
    : cumplido
      ? "var(--disco-verde)"
      : "var(--disco-tinta)";
  const deMas = cumplido ? Math.floor((segundos - objetivo * 60) / 60) : 0;
  return (
    <Anillo progreso={progreso} color={color}>
      <span className="text-sm text-muted-foreground">{etiqueta}</span>
      <span
        role="timer"
        aria-label="Cronómetro"
        className={cn(
          "font-heading leading-none font-bold tabular-nums",
          segundos >= 3600 ? "text-5xl" : "text-6xl",
          pausado ? "text-muted-foreground" : cumplido ? "text-disco-verde" : "text-foreground",
        )}
      >
        {formato(segundos)}
      </span>
      <span className="text-sm text-muted-foreground">
        {pausado
          ? "detenido"
          : cumplido
            ? `${planificado}${deMas > 0 ? ` · +${deMas} min` : ""}`
            : planificado
              ? `de ${planificado}`
              : null}
      </span>
    </Anillo>
  );
}

// Ya hecho: "✓ Hecha" (o "Hecho"), los minutos medidos en grande (en azul si no son los
// planificados) y lo planificado debajo. Sin minutos (una entrada en calor dada por hecha porque el
// día ya tenía algo registrado), lo planificado va en grande.
export function PasoHecho({
  etiqueta,
  minutos,
  planificado,
  distinto,
  texto,
}: {
  etiqueta: string;
  minutos: number | null;
  planificado: string | null;
  distinto: boolean;
  texto?: string | null;
}) {
  return (
    <section className="mt-3 rounded-2xl bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-disco-verde text-white">
          <Check className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className={cn("m-0 font-heading text-2xl leading-tight font-bold", distinto && "text-disco-azul")}>
            {minutos !== null ? `${minutos} min` : (planificado ?? etiqueta)}
          </p>
          {minutos !== null && planificado && (
            <p className="m-0 text-sm text-muted-foreground">
              {distinto ? "tocaba" : "planificado"} {planificado}
            </p>
          )}
        </div>
      </div>
      {texto && <p className="mt-3 mb-0 border-t border-border pt-3 text-muted-foreground">{texto}</p>}
    </section>
  );
}
