import type { ExerciseItem } from "@/lib/api";
import { realAsSet, setText } from "@/lib/format";

// "Semana pasada" del ejercicio entero (#56): lo realizado en la semana cerrada anterior de la
// rutina, serie por serie ("—" la que no se registró). No se muestra si no hay semana anterior.
export function SemanaPasada({ ejercicio }: { ejercicio: ExerciseItem }) {
  const anterior = ejercicio.previous;
  if (!anterior) return null;
  return (
    <p className="mt-2 mb-1 text-sm text-muted-foreground">
      Semana pasada:{" "}
      {anterior.every((r) => r === null)
        ? "sin registrar"
        : anterior.map((r) => (r ? setText(ejercicio.kind, realAsSet(r)) : "—")).join(" · ")}
    </p>
  );
}
