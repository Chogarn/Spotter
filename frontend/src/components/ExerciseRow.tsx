import type { ExerciseItem } from "@/lib/api";
import { restText, setText, summarize } from "@/lib/format";

// Un ejercicio: fila compacta y, desplegando, cada serie. La usan la vista previa de la
// propuesta y la vista del día. Va dentro de una lista (<ol> o <ul>).
export function ExerciseRow({ exercise }: { exercise: ExerciseItem }) {
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
            <li key={i}>
              <small>
                Serie {i + 1} · {setText(exercise.kind, s)}
              </small>
            </li>
          ))}
        </ul>
      </details>
    </li>
  );
}
