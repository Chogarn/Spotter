import { Lock } from "lucide-react";

import type { ExerciseItem, SetItem } from "@/lib/api";
import { estaHecho, restText, seriesRegistradas, summarize } from "@/lib/format";
import { cn } from "cn";

import { DoneControl } from "./DoneControl";
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
// el color de la carga) y sus series como discos. La usan la vista previa de la propuesta (series
// plegadas) y la vista del día (`desplegado`). Va dentro de una lista (<ol> o <ul>).
// Con `edit` (vista del día de la semana activa) suma los botones del ejercicio y de cada serie.
export function ExerciseRow({
  exercise,
  edit,
  desplegado = false,
}: {
  exercise: ExerciseItem;
  edit?: ExerciseEdit;
  desplegado?: boolean;
}) {
  const abierto = edit && !edit.locked;
  const hecho = estaHecho(exercise);
  // Un ejercicio hecho bloquea sus series hasta reabrirlo.
  const seriesAbiertas = abierto && !hecho;
  const hechas = seriesRegistradas(exercise);

  const series = (
    <ul className="m-0 mt-2 list-none p-0">
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
  );

  return (
    <li className={cn("list-none rounded-2xl bg-card p-4", edit && hecho && "bg-card/60")}>
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
      {exercise.execution_notes && <p className="mb-0 text-sm">{exercise.execution_notes}</p>}
      {exercise.reason && <p className="mb-0 text-sm text-muted-foreground">Por qué: {exercise.reason}</p>}
      {desplegado ? (
        series
      ) : (
        <details className="mt-1">
          <summary className="cursor-pointer text-sm text-muted-foreground">Ver series</summary>
          {series}
        </details>
      )}
    </li>
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
