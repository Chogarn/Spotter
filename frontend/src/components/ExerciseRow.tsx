"use client";

import { Lock } from "lucide-react";
import { useState } from "react";

import type { ExerciseItem, SetItem } from "@/lib/api";
import { estaHecho, kgText, previousText, restText, seriesRegistradas, summarize, weightChange } from "@/lib/format";
import { cn } from "cn";

import { DiscoSerie } from "./DiscoSerie";
import { DoneControl } from "./DoneControl";
import { InlineError } from "./ErrorMessage";
import { SetRow } from "./SetRow";

export type ExerciseEdit = {
  weekId: number;
  dayIndex: number;
  // Con el día completado se ve el estado pero no se puede cambiar nada (hay que reabrirlo).
  locked: boolean;
  onSetSaved: (updated: SetItem) => void;
  onExerciseChanged: (updated: ExerciseItem) => void;
};

// Un ejercicio como tarjeta: nombre, el resumen grande ("4 × 8 · 60 kg", con los kilos en azul,
// el color de la carga) y sus series como discos, plegadas hasta tocar "Ver series". La usan la
// vista previa de la propuesta y la vista del día. Va dentro de una lista (<ol> o <ul>).
// Con `edit` (vista del día de la semana activa) suma los botones del ejercicio y de cada serie, y
// los discos a la vista para marcar sin abrir. En el día suma "Semana pasada" (#56) si la hay.
// `enCurso`: el primer ejercicio sin hacer del día, que lleva un borde.
export function ExerciseRow({
  exercise,
  edit,
  enCurso = false,
}: {
  exercise: ExerciseItem;
  edit?: ExerciseEdit;
  enCurso?: boolean;
}) {
  const abierto = edit && !edit.locked;
  const hecho = estaHecho(exercise);
  // Un ejercicio hecho bloquea sus series hasta reabrirlo.
  const seriesAbiertas = abierto && !hecho;
  const hechas = seriesRegistradas(exercise);

  return (
    <li
      className={cn(
        "list-none rounded-2xl border-2 border-transparent bg-card p-4",
        edit && hecho && "bg-card/60",
        enCurso && "border-disco-tinta",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="m-0 flex items-center gap-1.5 font-medium">
            {exercise.name}
            {edit && hecho && <Lock className="size-4 text-muted-foreground" aria-label="Hecho y bloqueado" />}
          </p>
          <Resumen texto={summarize(exercise)} />
          <p className="m-0 text-sm text-muted-foreground">
            {exercise.rest_seconds !== null && <>descanso {restText(exercise.rest_seconds)}</>}
            {edit && !hecho && hechas > 0 && (
              <>
                {exercise.rest_seconds !== null && " · "}
                {hechas} de {exercise.sets.length} series hechas
              </>
            )}
          </p>
          <SemanaPasada exercise={exercise} />
        </div>
        {edit && (
          <DoneControl
            exercise={exercise}
            edit={
              abierto
                ? { weekId: edit.weekId, dayIndex: edit.dayIndex, onChanged: edit.onExerciseChanged }
                : undefined
            }
          />
        )}
      </div>
      {edit && (
        <DiscosEjercicio
          exercise={exercise}
          edit={seriesAbiertas ? { weekId: edit.weekId, dayIndex: edit.dayIndex, onSaved: edit.onSetSaved } : undefined}
        />
      )}
      {exercise.execution_notes && <p className="mb-0 text-sm">{exercise.execution_notes}</p>}
      {exercise.reason && <p className="mb-0 text-sm text-muted-foreground">Por qué: {exercise.reason}</p>}
      <details className="mt-1">
        <summary className="cursor-pointer py-1 text-sm text-muted-foreground">Ver series</summary>
        <ul className="m-0 mt-1 list-none p-0">
          {exercise.sets.map((s, i) => (
            <SetRow
              key={i}
              kind={exercise.kind}
              index={i}
              set={s}
              edit={
                seriesAbiertas
                  ? { weekId: edit.weekId, dayIndex: edit.dayIndex, onSaved: edit.onSetSaved }
                  : undefined
              }
            />
          ))}
        </ul>
      </details>
    </li>
  );
}

// "Semana pasada: 4 × 8 a 6 · 57,5 kg  +2,5 kg". La diferencia va en verde si hoy sube.
function SemanaPasada({ exercise }: { exercise: ExerciseItem }) {
  const texto = previousText(exercise);
  if (texto === null) return null;
  const cambio = weightChange(exercise);
  return (
    <p className="mt-2 mb-0 rounded-lg bg-muted/60 px-2.5 py-1.5 text-sm">
      <span className="text-muted-foreground">Semana pasada:</span> {texto}
      {cambio !== null && (
        <span className={cn("ml-1.5 font-semibold", cambio > 0 ? "text-disco-verde-texto" : "text-muted-foreground")}>
          {kgText(cambio)}
        </span>
      )}
    </p>
  );
}

// Los discos de las series a la vista, para marcarlas sin abrir "Ver series".
function DiscosEjercicio({
  exercise,
  edit,
}: {
  exercise: ExerciseItem;
  edit?: { weekId: number; dayIndex: number; onSaved: (updated: SetItem) => void };
}) {
  const [error, setError] = useState("");
  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {exercise.sets.map((s, i) => (
          <DiscoSerie
            key={i}
            kind={exercise.kind}
            index={i}
            set={s}
            edit={edit}
            onError={setError}
            className="size-9"
          />
        ))}
      </div>
      {error && <InlineError>{error}</InlineError>}
    </div>
  );
}

// "4 × 8 · 60 kg" en Barlow Condensed, con la parte de los kilos en azul.
function Resumen({ texto }: { texto: string }) {
  const partes = texto.split(" · ");
  const kilos = partes.at(-1)?.endsWith("kg") ? partes.pop() : undefined;
  return (
    <p className="m-0 font-heading text-3xl leading-tight font-bold">
      {partes.join(" · ")}
      {kilos && <span className="text-disco-azul"> · {kilos}</span>}
    </p>
  );
}
