"use client";

import { Check, ChevronDown, LockOpen } from "lucide-react";
import { use, useEffect, useState } from "react";

import { BackButton } from "@/components/BackButton";
import { Disco } from "@/components/Disco";
import { DoneControl } from "@/components/DoneControl";
import { Resumen } from "@/components/ExerciseRow";
import { SemanaPasada } from "@/components/SemanaPasada";
import { SetRow } from "@/components/SetRow";
import { readError, type DayDetail, type ExerciseItem, type SetItem, apiFetch } from "@/lib/api";
import { estaHecho, summarize } from "@/lib/format";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ErrorMessage";

export default function DiaView({ params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = use(params);
  const [dia, setDia] = useState<DayDetail | null>(null);
  const [error, setError] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  // La tarjeta desplegada (una por vez), o null si están todas cerradas.
  const [abierta, setAbierta] = useState<number | null>(null);

  useEffect(() => {
    apiFetch(`/weeks/${id}/days/${n}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        setDia(await res.json());
      })
      .catch((e) => setError(e.message));
  }, [id, n]);

  // Al guardar una serie, el backend devuelve esa serie actualizada: se reemplaza en pantalla.
  function serieGuardada(updated: SetItem) {
    setDia((actual) =>
      actual
        ? {
            ...actual,
            exercises: actual.exercises.map((e) => ({
              ...e,
              sets: e.sets.map((s) => (s.id === updated.id ? updated : s)),
            })),
          }
        : actual,
    );
  }

  // Al marcar, reabrir o deshacer un ejercicio, el backend devuelve el ejercicio entero.
  function ejercicioCambiado(updated: ExerciseItem) {
    setDia((actual) =>
      actual
        ? { ...actual, exercises: actual.exercises.map((e) => (e.id === updated.id ? updated : e)) }
        : actual,
    );
  }

  async function cambiarDia(accion: "complete" | "reopen") {
    if (!dia) return;
    setError("");
    setTrabajando(true);
    try {
      const res = await apiFetch(`/weeks/${dia.week_id}/days/${dia.day_index}/${accion}`, {
        method: "POST",
      });
      if (res.ok) {
        const estado = await res.json();
        setDia((actual) => (actual ? { ...actual, finished_at: estado.finished_at } : actual));
      } else {
        setError(await readError(res));
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setTrabajando(false);
  }

  // Solo se registra en la semana activa; las cerradas quedan en lectura.
  const activa = dia?.week_status === "active";
  const completado = dia?.finished_at != null;
  const hechos = dia ? dia.exercises.filter(estaHecho).length : 0;
  // El ejercicio en curso (el primero sin hacer) lleva un borde, solo mientras se puede registrar.
  const enCurso = dia && activa && !completado ? dia.exercises.findIndex((e) => !estaHecho(e)) : -1;

  return (
    <main className="mx-auto max-w-xl px-4 pt-6">
      <BackButton href={`/semanas/${id}`}>
        ← {dia ? `Semana ${dia.week_number}` : "Volver a la semana"}
      </BackButton>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!dia && !error && <p>Cargando...</p>}
      {dia && (
        <>
          <h1 className="mb-0 text-6xl">Día {dia.day_index}</h1>
          <p className="mt-1 text-muted-foreground">
            {dia.title} · ~{dia.minutes} min
          </p>
          {activa && (
            <div className="mb-4">
              <p className="mb-1 text-sm text-muted-foreground">
                {hechos} de {dia.exercises.length} ejercicios hechos
              </p>
              <div
                role="progressbar"
                aria-label="Ejercicios hechos"
                aria-valuemin={0}
                aria-valuemax={dia.exercises.length}
                aria-valuenow={hechos}
                className="h-2 overflow-hidden rounded-full bg-border"
              >
                <div
                  className="h-full rounded-full bg-disco-rojo transition-[width] motion-reduce:transition-none"
                  style={{ width: `${(hechos / Math.max(dia.exercises.length, 1)) * 100}%` }}
                />
              </div>
            </div>
          )}
          {dia.mobility_notes && <p className="text-sm">Movilidad: {dia.mobility_notes}</p>}
          <ol className="m-0 mt-4 grid list-none gap-2.5 p-0">
            {dia.exercises.map((e, i) => (
              <TarjetaEjercicio
                key={i}
                exercise={e}
                dia={dia}
                registra={activa && !completado}
                abierta={abierta === i}
                onAlternar={() => setAbierta((a) => (a === i ? null : i))}
                enCurso={i === enCurso}
                onSerieGuardada={serieGuardada}
                onEjercicioCambiado={ejercicioCambiado}
              />
            ))}
          </ol>
          {activa && (
            <section className="mt-6">
              {completado ? (
                <div className="flex items-center gap-3">
                  <span className="flex-1 font-heading text-2xl font-bold">Día completado</span>
                  <Button
                    size="icon-lg"
                    variant="outline"
                    type="button"
                    onClick={() => cambiarDia("reopen")}
                    disabled={trabajando}
                    aria-label={`Reabrir el día ${dia.day_index}`}
                  >
                    <LockOpen />
                  </Button>
                </div>
              ) : (
                <Button
                  size="lg"
                  className="h-11 w-full text-base"
                  type="button"
                  onClick={() => cambiarDia("complete")}
                  disabled={trabajando}
                >
                  Día completado
                </Button>
              )}
            </section>
          )}
          {/* Con la semana cerrada, el mismo cierre pero sin candado: el día ya no se reabre. */}
          {!activa && (
            <section className="mt-6">
              <span className={cn("font-heading text-2xl font-bold", !completado && "text-muted-foreground")}>
                {completado ? "Día completado" : "Día sin completar"}
              </span>
            </section>
          )}
          <p>
            <small className="text-muted-foreground">Los pesos son orientativos. La app no da consejo médico.</small>
          </p>
        </>
      )}
    </main>
  );
}

// Un ejercicio en la lista del día (decisión 47): cerrada, solo el nombre grande, los números y,
// en el que está en curso, los discos. Tocarla la despliega ahí mismo (una por vez) con lo
// demás: las series (disco para marcar y lápiz para corregir), semana pasada, cómo hacerlo, por
// qué y los botones del ejercicio. El modo entrenar se abre con "Empezar día N" desde Entrenar.
function TarjetaEjercicio({
  exercise,
  dia,
  registra,
  abierta,
  onAlternar,
  enCurso,
  onSerieGuardada,
  onEjercicioCambiado,
}: {
  exercise: ExerciseItem;
  dia: DayDetail;
  registra: boolean;
  abierta: boolean;
  onAlternar: () => void;
  enCurso: boolean;
  onSerieGuardada: (s: SetItem) => void;
  onEjercicioCambiado: (e: ExerciseItem) => void;
}) {
  const hecho = estaHecho(exercise);
  // Las series se registran con el día abierto y el ejercicio sin cerrar.
  const seriesAbiertas = registra && !hecho;
  const idDetalle = `ejercicio-${exercise.id ?? exercise.name}`;

  return (
    <li
      className={cn(
        "rounded-2xl border-2 border-transparent bg-card",
        enCurso && "border-disco-tinta",
        registra && hecho && !abierta && "bg-card/60",
      )}
    >
      <button
        type="button"
        onClick={onAlternar}
        aria-expanded={abierta}
        aria-controls={idDetalle}
        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-heading text-[1.35rem] leading-tight font-bold">{exercise.name}</span>
          <Resumen
            texto={summarize(exercise)}
            className={cn("font-heading text-lg leading-tight font-semibold", !enCurso && !abierta && "text-muted-foreground")}
          />
          {enCurso && !abierta && (
            <span className="mt-1.5 flex gap-1.5" aria-hidden="true">
              {exercise.sets.map((s, i) => (
                <Disco key={i} estado={s.real ? "hecho" : "pendiente"} className="size-6">
                  {i + 1}
                </Disco>
              ))}
            </span>
          )}
        </span>
        {registra && hecho && (
          <Disco estado="hecho" className="size-7">
            <Check className="size-4" aria-label="Hecho" />
          </Disco>
        )}
        <ChevronDown
          className={cn("size-6 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none", abierta && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {abierta && (
        <div id={idDetalle} className="px-4 pb-4">
          <ul className="m-0 list-none p-0">
            {exercise.sets.map((s, i) => (
              <SetRow
                key={i}
                kind={exercise.kind}
                index={i}
                set={s}
                edit={
                  seriesAbiertas
                    ? { weekId: dia.week_id, dayIndex: dia.day_index, onSaved: onSerieGuardada }
                    : undefined
                }
              />
            ))}
          </ul>
          <SemanaPasada ejercicio={exercise} />
          {exercise.execution_notes && (
            <details className="border-t border-border py-1">
              <summary className="cursor-pointer py-1.5 font-medium">Cómo hacerlo</summary>
              <p className="mt-0 mb-2 text-sm">{exercise.execution_notes}</p>
            </details>
          )}
          {exercise.reason && (
            <details className="border-t border-border py-1">
              <summary className="cursor-pointer py-1.5 font-medium">Por qué está en tu rutina</summary>
              <p className="mt-0 mb-2 text-sm">{exercise.reason}</p>
            </details>
          )}
          {registra && (
            <div className="mt-2 flex justify-end">
              <DoneControl
                exercise={exercise}
                edit={{ weekId: dia.week_id, dayIndex: dia.day_index, onChanged: onEjercicioCambiado }}
              />
            </div>
          )}
        </div>
      )}
    </li>
  );
}
