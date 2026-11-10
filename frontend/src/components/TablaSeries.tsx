"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import { readError, type ExerciseItem, type SetItem, apiFetch } from "@/lib/api";
import { realAsSet } from "@/lib/format";
import { Disco } from "@/components/Disco";
import { InlineError } from "@/components/ErrorMessage";
import { cn } from "cn";

// Qué número se edita en cada columna, cuánto mueven las flechas y el mínimo.
type Campo = "target_weight_kg" | "reps" | "duration_seconds" | "duration_minutes";
const PASO: Record<Campo, number> = { target_weight_kg: 2.5, reps: 1, duration_seconds: 5, duration_minutes: 1 };
const MINIMO: Record<Campo, number> = { target_weight_kg: 0, reps: 1, duration_seconds: 1, duration_minutes: 1 };
const ETIQUETA: Record<Campo, string> = {
  target_weight_kg: "Kilos",
  reps: "Reps",
  duration_seconds: "Segundos",
  duration_minutes: "Minutos",
};

function columnas(kind: ExerciseItem["kind"]): Campo[] {
  if (kind === "cardio") return ["duration_minutes"];
  if (kind === "isometric") return ["duration_seconds"];
  return ["target_weight_kg", "reps"];
}

function texto(valor: number | null): string {
  return valor === null ? "" : valor.toLocaleString("es-AR");
}

// ¿Los números de la serie son distintos de los planificados?
export function distintoDelPlan(plan: SetItem, valores: SetItem): boolean {
  return (
    plan.reps !== valores.reps ||
    plan.duration_minutes !== valores.duration_minutes ||
    plan.duration_seconds !== valores.duration_seconds ||
    plan.target_weight_kg !== valores.target_weight_kg
  );
}

// Lo que se manda al guardar una serie (`PUT .../sets/{id}`), según el tipo de ejercicio.
export function cuerpoDeSerie(kind: ExerciseItem["kind"], valores: SetItem): Record<string, number | null> {
  if (kind === "cardio") return { duration_minutes: valores.duration_minutes };
  if (kind === "isometric") return { duration_seconds: valores.duration_seconds };
  return { reps: valores.reps, weight_kg: valores.target_weight_kg };
}

// Las series del ejercicio en una tabla que se despliega debajo de los discos (decisión 120): una
// fila por serie, con sus kilos y repeticiones (o minutos, o segundos), que se escriben o se mueven
// con las flechas. La serie que toca va resaltada. Lo que se cambia en una serie sin hacer queda
// como borrador y se guarda con "Serie hecha"; una serie ya hecha se guarda al cambiarla.
export function TablaSeries({
  kind,
  sets,
  actual,
  borrador,
  onBorrador,
  weekId,
  dayIndex,
  onGuardada,
  disabled,
}: {
  kind: ExerciseItem["kind"];
  sets: SetItem[];
  actual: number;
  borrador: Record<number, SetItem>;
  onBorrador: (indice: number, valores: SetItem) => void;
  weekId: number;
  dayIndex: number;
  onGuardada: (serie: SetItem) => void;
  disabled?: boolean;
}) {
  const [error, setError] = useState("");
  const campos = columnas(kind);

  async function guardar(serie: SetItem, valores: SetItem) {
    setError("");
    try {
      const res = await apiFetch(`/weeks/${weekId}/days/${dayIndex}/sets/${serie.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpoDeSerie(kind, valores)),
      });
      if (!res.ok) setError(await readError(res));
      else onGuardada(await res.json());
    } catch {
      setError("No se pudo conectar con el servidor");
    }
  }

  function cambiar(indice: number, campo: Campo, valor: number | null) {
    const serie = sets[indice];
    const base = serie.real ? realAsSet(serie.real) : (borrador[indice] ?? serie);
    if (base[campo] === valor) return;
    const valores = { ...base, [campo]: valor };
    if (serie.real) void guardar(serie, valores);
    else onBorrador(indice, valores);
  }

  return (
    <div className="mt-2">
      <table className="w-full border-separate border-spacing-y-1.5 text-center">
        <thead>
          <tr className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <th className="w-12 font-semibold">Serie</th>
            {campos.map((c) => (
              <th key={c} className="font-semibold">
                {ETIQUETA[c]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sets.map((s, i) => {
            const valores = s.real ? realAsSet(s.real) : (borrador[i] ?? s);
            const resaltada = i === actual;
            return (
              <tr key={i} className={cn(resaltada && "[&>td]:bg-disco-amarillo/25")}>
                <td className={cn("rounded-l-xl px-1", resaltada && "py-1")}>
                  <Disco estado={s.real ? "hecho" : "pendiente"} className="mx-auto size-8">
                    {i + 1}
                  </Disco>
                </td>
                {campos.map((c, j) => (
                  <td key={c} className={cn("px-1 align-top", j === campos.length - 1 && "rounded-r-xl", resaltada && "py-1")}>
                    <Casilla
                      etiqueta={`Serie ${i + 1}: ${ETIQUETA[c].toLowerCase()}`}
                      valor={valores[c]}
                      plan={s[c]}
                      paso={PASO[c]}
                      minimo={MINIMO[c]}
                      decimales={c === "target_weight_kg"}
                      disabled={disabled}
                      onCambiar={(v) => cambiar(i, c, v)}
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {error && <InlineError>{error}</InlineError>}
    </div>
  );
}

// Una casilla: el número (se escribe; vale al salir de la casilla o con Enter) y dos flechas para
// subir y bajar de a un paso. Si quedó distinto de lo planificado, va en azul con "tocaba" debajo.
function Casilla({
  etiqueta,
  valor,
  plan,
  paso,
  minimo,
  decimales,
  disabled,
  onCambiar,
}: {
  etiqueta: string;
  valor: number | null;
  plan: number | null;
  paso: number;
  minimo: number;
  decimales: boolean;
  disabled?: boolean;
  onCambiar: (valor: number | null) => void;
}) {
  // Lo que se está escribiendo; null mientras no se escribe (se muestra el valor).
  const [escrito, setEscrito] = useState<string | null>(null);
  const cambiada = valor !== plan;

  function confirmar() {
    if (escrito === null) return;
    const limpio = escrito.trim().replace(",", ".");
    setEscrito(null);
    // Los kilos pueden quedar vacíos (ejercicio sin peso); lo demás vuelve al valor anterior.
    if (limpio === "") {
      if (decimales) onCambiar(null);
      return;
    }
    const numero = Number(limpio);
    if (!Number.isFinite(numero) || numero < minimo) return;
    onCambiar(decimales ? Math.round(numero * 100) / 100 : Math.round(numero));
  }

  function mover(signo: 1 | -1) {
    const nuevo = Math.max(minimo, Math.round(((valor ?? 0) + signo * paso) * 100) / 100);
    onCambiar(nuevo);
  }

  return (
    <div>
      <div className="flex items-stretch gap-1">
        <input
          aria-label={etiqueta}
          inputMode={decimales ? "decimal" : "numeric"}
          value={escrito ?? texto(valor)}
          disabled={disabled}
          onChange={(e) => setEscrito(e.target.value)}
          onBlur={confirmar}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className={cn(
            "h-12 w-full min-w-0 rounded-lg border-[1.5px] bg-card text-center font-heading text-2xl font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            cambiada ? "border-disco-azul text-disco-azul" : "border-border text-disco-tinta",
          )}
        />
        <div className="flex flex-col gap-1">
          <button
            type="button"
            disabled={disabled}
            onClick={() => mover(1)}
            aria-label={`Subir ${etiqueta}`}
            className="flex w-9 flex-1 items-center justify-center rounded-md border-[1.5px] border-disco-tinta bg-card active:bg-muted disabled:opacity-50"
          >
            <ChevronUp className="size-4" />
          </button>
          <button
            type="button"
            disabled={disabled || valor === null || valor <= minimo}
            onClick={() => mover(-1)}
            aria-label={`Bajar ${etiqueta}`}
            className="flex w-9 flex-1 items-center justify-center rounded-md border-[1.5px] border-disco-tinta bg-card active:bg-muted disabled:opacity-50"
          >
            <ChevronDown className="size-4" />
          </button>
        </div>
      </div>
      <p className="m-0 h-4 text-[11px] leading-4 text-muted-foreground">{cambiada ? `tocaba ${texto(plan) || "—"}` : ""}</p>
    </div>
  );
}
