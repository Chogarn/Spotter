"use client";

import { Check, Play } from "lucide-react";
import { useState } from "react";

import { ContadorSesion } from "@/components/ContadorSesion";
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
      <section className={cn("mt-3 rounded-2xl bg-card p-5 text-center", pausado && "opacity-55")}>
        {crono ? (
          <>
            <ContadorSesion
              desde={crono.inicio}
              pausa={pausaDelCrono(crono, dia)}
              detenidoEn={dia.paused_at ?? null}
              etiqueta="Cronómetro"
              className={cn(
                "my-2 block font-heading text-7xl leading-none font-bold tabular-nums",
                pausado ? "text-muted-foreground" : "text-disco-rojo",
              )}
            />
            {planificado && <p className="m-0 text-muted-foreground">Planificado: {planificado}</p>}
          </>
        ) : (
          planificado && (
            <>
              <p className="m-0 text-muted-foreground">Planificado</p>
              <p className="my-2 font-heading text-7xl leading-none font-bold">{planificado}</p>
            </>
          )
        )}
        {texto && <p className={cn("mb-0 text-muted-foreground", planificado ? "mt-2" : "mt-0")}>{texto}</p>}
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
    <section className="mt-3 rounded-2xl bg-card p-5 text-center">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-disco-verde px-3 py-1 text-sm font-semibold text-white">
        <Check className="size-4" aria-hidden="true" /> {etiqueta}
      </span>
      {minutos !== null ? (
        <p className={cn("my-2 font-heading text-7xl leading-none font-bold", distinto && "text-disco-azul")}>{minutos} min</p>
      ) : (
        planificado && <p className="my-2 font-heading text-7xl leading-none font-bold">{planificado}</p>
      )}
      {minutos !== null && planificado && (
        <p className="m-0 text-muted-foreground">
          {distinto ? "tocaba" : "Planificado:"} {planificado}
        </p>
      )}
      {texto && <p className="mt-2 mb-0 text-muted-foreground">{texto}</p>}
    </section>
  );
}
