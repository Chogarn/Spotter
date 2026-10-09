import type { ExerciseItem, SetItem } from "@/lib/api";
import { restText, summarize } from "@/lib/format";

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

// Un ejercicio: fila compacta y, desplegando, cada serie. La usan la vista previa de la
// propuesta y la vista del día. Va dentro de una lista (<ol> o <ul>).
// Con `edit` (vista del día de la semana activa) suma el estado "hecho" y los botones.
export function ExerciseRow({ exercise, edit }: { exercise: ExerciseItem; edit?: ExerciseEdit }) {
  const abierto = edit && !edit.locked;
  // Un ejercicio hecho bloquea sus series hasta reabrirlo.
  const seriesAbiertas = abierto && !exercise.completed;
  return (
    <li>
      {exercise.name} · {summarize(exercise)}
      {exercise.rest_seconds !== null && <> · descanso {restText(exercise.rest_seconds)}</>}
      {exercise.execution_notes && (
        <>
          <br />
          <small>{exercise.execution_notes}</small>
        </>
      )}
      {exercise.reason && (
        <>
          <br />
          <small>Por qué: {exercise.reason}</small>
        </>
      )}
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
      <details>
        <summary>
          <small>Ver series</small>
        </summary>
        <ul style={{ listStyle: "none", paddingLeft: "1rem", margin: "0.25rem 0" }}>
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
