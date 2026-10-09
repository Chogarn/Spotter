import type { ExerciseItem, SetItem } from "@/lib/api";
import { restText, summarize } from "@/lib/format";

import { SetRow } from "./SetRow";

// Un ejercicio: fila compacta y, desplegando, cada serie. La usan la vista previa de la
// propuesta y la vista del día. Va dentro de una lista (<ol> o <ul>).
// Con `edit`, cada serie tiene un botón Editar (solo en la vista del día de la semana activa).
export function ExerciseRow({
  exercise,
  edit,
}: {
  exercise: ExerciseItem;
  edit?: { weekId: number; dayIndex: number; onSaved: (updated: SetItem) => void };
}) {
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
      <details>
        <summary>
          <small>Ver series</small>
        </summary>
        <ul style={{ listStyle: "none", paddingLeft: "1rem", margin: "0.25rem 0" }}>
          {exercise.sets.map((s, i) => (
            <SetRow key={i} kind={exercise.kind} index={i} set={s} edit={edit} />
          ))}
        </ul>
      </details>
    </li>
  );
}
