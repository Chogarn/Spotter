"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ContadorSesion } from "@/components/ContadorSesion";
import { reloj, relojEnPalabras, useDescanso } from "@/components/Descanso";
import { apiFetch, type DayDetail, type Week } from "@/lib/api";
import { estaHecho } from "@/lib/format";

type EnCurso = {
  href: string;
  desde: string; // cuándo se tocó "Empezar día"
  dia: number;
  ejercicio: string;
  numero: number; // del ejercicio que toca, empezando en 1
  total: number;
};

// La píldora "entrenando ahora" sobre la barra de abajo: aparece en las pantallas que no son de
// entrenar mientras haya un día empezado y sin completar, y lleva de vuelta al ejercicio activo.
// Solo "Seguir": no se puede descartar el día desde acá (el plan no se toca, decisiones 35 y 65).
// Mientras corre el reloj de descanso, la misma píldora muestra la cuenta atrás en lugar del
// contador del día (y la franja del descanso no se repite); al terminar vuelve el contador.
// `visible` cambia cada vez que se navega: ahí se vuelve a preguntar, así que al completar el
// día desaparece sola. Si algo falla, no se muestra (es un atajo, no una función).
export function MiniBarraEntreno({ visible }: { visible: boolean }) {
  const [enCurso, setEnCurso] = useState<EnCurso | null>(null);
  const { corriendo, restanteMs, setMiniBarra } = useDescanso();
  const mostrandose = visible && enCurso !== null;

  useEffect(() => {
    setMiniBarra(mostrandose);
    return () => setMiniBarra(false);
  }, [mostrandose, setMiniBarra]);

  useEffect(() => {
    if (!visible) return;
    let vigente = true;
    (async () => {
      try {
        const activa = await apiFetch(`/weeks/active`);
        if (!activa.ok) return vigente && setEnCurso(null);
        const semana: Week = await activa.json();
        if (!semana.in_progress_day) return vigente && setEnCurso(null);
        const res = await apiFetch(`/weeks/${semana.id}/days/${semana.in_progress_day}`);
        if (!res.ok) return vigente && setEnCurso(null);
        const dia: DayDetail = await res.json();
        if (!dia.started_at || dia.finished_at) return vigente && setEnCurso(null);
        const i = dia.exercises.findIndex((e) => !estaHecho(e));
        if (vigente) {
          setEnCurso({
            href: `/semanas/${semana.id}/dia/${dia.day_index}/entrenar`,
            desde: dia.started_at,
            dia: dia.day_index,
            ejercicio: dia.exercises[i === -1 ? dia.exercises.length - 1 : i]?.name ?? "",
            numero: i === -1 ? dia.exercises.length : i + 1,
            total: dia.exercises.length,
          });
        }
      } catch {
        if (vigente) setEnCurso(null);
      }
    })();
    return () => {
      vigente = false;
    };
  }, [visible]);

  if (!mostrandose || !enCurso) return null;

  const detalle = `${enCurso.ejercicio} · ejercicio ${enCurso.numero} de ${enCurso.total}`;

  return (
    <Link
      // Con el descanso corriendo, vuelve al ejercicio que lo arrancó (puede no ser el activo).
      href={corriendo ? corriendo.href : enCurso.href}
      aria-label={
        corriendo
          ? `Descanso: quedan ${relojEnPalabras(restanteMs)}. Seguir entrenando: día ${enCurso.dia}, ${detalle}`
          : `Seguir entrenando: día ${enCurso.dia}, ${detalle}`
      }
      className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-xl items-center gap-3 rounded-full bg-primary py-2 pr-2 pl-4 text-primary-foreground no-underline shadow-md max-sm:mx-3"
    >
      <span className="size-2.5 shrink-0 rounded-full bg-disco-rojo" aria-hidden="true" />
      <span className="min-w-0 flex-1 leading-tight">
        <span className="flex items-baseline gap-2 text-sm font-medium">
          {corriendo ? (
            <>
              Descanso
              <span className="font-heading text-xl leading-none font-bold tabular-nums">{reloj(restanteMs)}</span>
            </>
          ) : (
            <>
              Día {enCurso.dia}
              <ContadorSesion desde={enCurso.desde} className="text-sm font-medium tabular-nums text-primary-foreground" />
            </>
          )}
        </span>
        <span className="block truncate text-xs opacity-75">
          {corriendo ? `Día ${enCurso.dia} · ${detalle}` : detalle}
        </span>
      </span>
      <span className="shrink-0 rounded-full bg-background px-4 py-2 text-sm font-medium text-foreground">Seguir</span>
    </Link>
  );
}
