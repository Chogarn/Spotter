import { ArrowLeftRight, ChevronDown } from "lucide-react";

import type { ExerciseItem } from "@/lib/api";
import { InfoEjercicio } from "@/components/InfoEjercicio";
import { restText, summarize } from "@/lib/format";
import { cn } from "cn";

import { type CambioEjercicio, EtiquetaCambio } from "./Cambios";
import { SetRow } from "./SetRow";

// Un ejercicio de la propuesta de la IA, en lectura, con el mismo formato que en el día
// (decisión 47): cerrado, el nombre grande y los números ("4 × 8 · 60 kg", los kilos en azul).
// Tocarlo lo despliega (uno por vez, lo maneja quien lo usa) con el descanso, las series, cómo
// hacerlo y por qué. Va dentro de una lista (<ol> o <ul>).
export function ExerciseRow({
  exercise,
  abierta,
  onAlternar,
  cambio,
  onCambiar,
}: {
  exercise: ExerciseItem;
  abierta: boolean;
  onAlternar: () => void;
  // En una semana nueva, qué cambió respecto de la anterior (#49).
  cambio?: CambioEjercicio;
  // Si se pasa, la tarjeta desplegada muestra "Cambiar ejercicio" (decisión 65).
  onCambiar?: () => void;
}) {
  const idDetalle = `propuesta-${exercise.name}`;
  return (
    <li className={cn("rounded-2xl border-2 border-transparent bg-card", cambio?.status === "nuevo" && "border-dashed border-disco-azul")}>
      <button
        type="button"
        onClick={onAlternar}
        aria-expanded={abierta}
        aria-controls={idDetalle}
        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-heading text-[1.35rem] leading-tight font-bold">{exercise.name}</span>
          <Resumen texto={summarize(exercise)} className="font-heading text-lg leading-tight font-semibold" />
          {cambio && <EtiquetaCambio cambio={cambio} kind={exercise.kind} />}
        </span>
        <ChevronDown
          className={cn(
            "size-6 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none",
            abierta && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
      {abierta && (
        <div id={idDetalle} className="px-4 pb-4">
          {exercise.rest_seconds !== null && (
            <p className="mt-0 mb-1 text-sm text-muted-foreground">descanso {restText(exercise.rest_seconds)}</p>
          )}
          <ul className="m-0 list-none p-0">
            {exercise.sets.map((s, i) => (
              <SetRow key={i} kind={exercise.kind} index={i} set={s} />
            ))}
          </ul>
          <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
            <InfoEjercicio nombre={exercise.name} comoHacerlo={exercise.execution_notes} porQue={exercise.reason} />
            {onCambiar && (
              <button
                type="button"
                onClick={onCambiar}
                className="inline-flex items-center gap-2 rounded-full border-2 border-disco-tinta px-4 py-2 font-medium outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <ArrowLeftRight className="size-4" aria-hidden="true" />
                Cambiar ejercicio
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

// "4 × 8 · 60 kg" en Barlow Condensed, con la parte de los kilos en azul. Es un <span> en bloque
// para poder ir dentro de un botón o un enlace (las tarjetas).
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
