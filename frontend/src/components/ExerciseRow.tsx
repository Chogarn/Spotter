import type { ExerciseItem } from "@/lib/api";
import { restText, summarize } from "@/lib/format";
import { cn } from "cn";

import { SetRow } from "./SetRow";

// Un ejercicio de la propuesta de la IA, en lectura: nombre, el resumen grande ("4 × 8 · 60 kg",
// con los kilos en azul, el color de la carga), descanso, cómo hacerlo, por qué y sus series
// plegadas. Va dentro de una lista (<ol> o <ul>). Lo que se registra en el día vive adentro del
// ejercicio (modo entrenar, decisión 47).
export function ExerciseRow({ exercise }: { exercise: ExerciseItem }) {
  return (
    <li className="list-none rounded-2xl bg-card p-4">
      <p className="m-0 font-heading text-[1.35rem] leading-tight font-bold">{exercise.name}</p>
      <Resumen texto={summarize(exercise)} />
      {exercise.rest_seconds !== null && (
        <p className="m-0 text-sm text-muted-foreground">descanso {restText(exercise.rest_seconds)}</p>
      )}
      {exercise.execution_notes && <p className="mb-0 text-sm">{exercise.execution_notes}</p>}
      {exercise.reason && <p className="mb-0 text-sm text-muted-foreground">Por qué: {exercise.reason}</p>}
      <details className="mt-1">
        <summary className="cursor-pointer py-1 text-sm text-muted-foreground">Ver series</summary>
        <ul className="m-0 mt-1 list-none p-0">
          {exercise.sets.map((s, i) => (
            <SetRow key={i} kind={exercise.kind} index={i} set={s} />
          ))}
        </ul>
      </details>
    </li>
  );
}

// "4 × 8 · 60 kg" en Barlow Condensed, con la parte de los kilos en azul. Es un <span> en bloque
// para poder ir dentro de un enlace (la tarjeta del día).
export function Resumen({ texto, className }: { texto: string; className?: string }) {
  const partes = texto.split(" · ");
  const kilos = partes.at(-1)?.endsWith("kg") ? partes.pop() : undefined;
  return (
    <span className={cn("block", className ?? "font-heading text-xl leading-tight font-bold")}>
      {partes.join(" · ")}
      {kilos && <span className="text-disco-azul"> · {kilos}</span>}
    </span>
  );
}
