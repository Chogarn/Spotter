"use client";

import { Pause, Play } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ContadorSesion } from "@/components/ContadorSesion";
import { reloj as reloj_, relojEnPalabras, useDescanso } from "@/components/Descanso";
import { apiFetch, type DayDetail, type Week } from "@/lib/api";
import { estaHecho } from "@/lib/format";
import { cn } from "cn";

type EnCurso = {
  href: string;
  semana: number;
  desde: string; // cuándo se tocó "Empezar día"
  detenidoEn: string | null; // cuándo se tocó "Detener" (decisión 121)
  pausa: number; // segundos detenidos en total
  dia: number;
  ejercicio: string;
  numero: number; // del ejercicio que toca, empezando en 1
  total: number;
};

// La píldora "entrenando ahora" sobre la barra de abajo: aparece en las pantallas que no son de
// entrenar mientras haya un día empezado y sin completar, y lleva de vuelta al ejercicio activo.
// "Seguir" y "Detener"; detenido, la píldora queda gris con "Retomar" (decisión 121). No se descarta el día desde acá.
// Mientras corre el reloj de descanso, la misma píldora muestra la cuenta atrás en lugar del
// contador del día (y la franja del descanso no se repite); al terminar vuelve el contador.
// Se vuelve a preguntar cada vez que se navega (`ruta`), así que al completar el día desaparece
// sola. Si algo falla, no se muestra (es un atajo, no una función).
export function MiniBarraEntreno({ visible, ruta }: { visible: boolean; ruta: string | null }) {
  const router = useRouter();
  const [enCurso, setEnCurso] = useState<EnCurso | null>(null);
  const [trabajando, setTrabajando] = useState(false);
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
            semana: semana.id,
            desde: dia.started_at,
            detenidoEn: dia.paused_at ?? null,
            pausa: dia.paused_seconds ?? 0,
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
  }, [visible, ruta]);

  if (!mostrandose || !enCurso) return null;
  const actual = enCurso;
  const detenido = actual.detenidoEn !== null;

  const detalle = `${actual.ejercicio} · ejercicio ${actual.numero} de ${actual.total}`;

  // Detener o retomar desde la píldora (decisión 121). Retomar además lleva al ejercicio.
  async function reloj(accion: "pause" | "resume") {
    setTrabajando(true);
    try {
      const res = await apiFetch(`/weeks/${actual.semana}/days/${actual.dia}/${accion}`, { method: "POST" });
      if (!res.ok) return;
      const estado: { paused_at: string | null; paused_seconds: number } = await res.json();
      setEnCurso({ ...actual, detenidoEn: estado.paused_at, pausa: estado.paused_seconds });
      if (accion === "resume") router.push(actual.href);
    } catch {
    } finally {
      setTrabajando(false);
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-xl items-center gap-2 rounded-full py-2 pr-2 pl-4 text-primary-foreground shadow-md max-sm:mx-3",
        // Detenido: gris y con el punto amarillo (decisión 121).
        detenido ? "bg-muted-foreground" : "bg-primary",
      )}
    >
      <Link
        // Con el descanso corriendo, vuelve al ejercicio que lo arrancó (puede no ser el activo).
        href={corriendo && !detenido ? corriendo.href : actual.href}
        aria-label={
          detenido
            ? `Día ${actual.dia} en pausa: ${detalle}`
            : corriendo
              ? `Descanso: quedan ${relojEnPalabras(restanteMs)}. Seguir entrenando: día ${actual.dia}, ${detalle}`
              : `Seguir entrenando: día ${actual.dia}, ${detalle}`
        }
        className="flex min-w-0 flex-1 items-center gap-3 text-primary-foreground no-underline"
      >
        <span className={cn("size-2.5 shrink-0 rounded-full", detenido ? "bg-disco-amarillo" : "bg-disco-rojo")} aria-hidden="true" />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="flex items-baseline gap-2 text-sm font-medium">
            {corriendo && !detenido ? (
              <>
                Descanso
                <span className="font-heading text-xl leading-none font-bold tabular-nums">{reloj_(restanteMs)}</span>
              </>
            ) : (
              <>
                Día {actual.dia}
                {detenido && " · en pausa"}
                <ContadorSesion
                  desde={actual.desde}
                  pausa={actual.pausa}
                  detenidoEn={actual.detenidoEn}
                  className="text-sm font-medium tabular-nums text-primary-foreground"
                />
              </>
            )}
          </span>
          <span className="block truncate text-xs opacity-75">
            {corriendo && !detenido ? `Día ${actual.dia} · ${detalle}` : detalle}
          </span>
        </span>
      </Link>
      {detenido ? (
        <button
          type="button"
          disabled={trabajando}
          onClick={() => reloj("resume")}
          className="flex shrink-0 items-center gap-1 rounded-full bg-background px-3 py-2 text-sm font-medium text-foreground"
        >
          <Play className="size-4" aria-hidden="true" /> Retomar
        </button>
      ) : (
        <>
          <button
            type="button"
            disabled={trabajando}
            onClick={() => reloj("pause")}
            aria-label={`Detener el día ${actual.dia}`}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-primary-foreground"
          >
            <Pause className="size-4" aria-hidden="true" />
          </button>
          <Link
            href={corriendo ? corriendo.href : actual.href}
            className="shrink-0 rounded-full bg-background px-4 py-2 text-sm font-medium text-foreground no-underline"
          >
            Seguir
          </Link>
        </>
      )}
    </div>
  );
}
