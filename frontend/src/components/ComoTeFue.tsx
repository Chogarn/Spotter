"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { InlineError } from "@/components/ErrorMessage";
import { readError, type ExerciseItem, type LoadFeel, type PainLevel, apiFetch } from "@/lib/api";
import { cn } from "cn";

export const CARGAS: { valor: LoadFeel; texto: string }[] = [
  { valor: "light", texto: "Liviana" },
  { valor: "good", texto: "Bien" },
  { valor: "heavy", texto: "Pesada" },
  { valor: "very_heavy", texto: "Muy pesada" },
];

export const DOLORES: { valor: PainLevel; texto: string }[] = [
  { valor: "mild", texto: "Leve" },
  { valor: "moderate", texto: "Moderado" },
  { valor: "strong", texto: "Fuerte" },
];

export function textoDeCarga(valor: LoadFeel): string {
  return CARGAS.find((c) => c.valor === valor)?.texto ?? valor;
}

export function textoDeDolor(valor: PainLevel): string {
  return DOLORES.find((d) => d.valor === valor)?.texto ?? valor;
}

export type FeelEdit = {
  weekId: number;
  dayIndex: number;
  onChanged: (updated: ExerciseItem) => void;
};

// "¿Cómo te fue?" (decisión 74): sección plegada y opcional que aparece al terminar un ejercicio.
// Dos filas independientes: cómo se sintió la carga y si hubo dolor (sin opción "No": sin marcar es
// sin dato). Volver a tocar una opción la desmarca. Sin `edit` (semana cerrada o día completado) se
// muestra solo lo que se marcó, o nada si no se marcó nada.
export function ComoTeFue({ exercise, edit }: { exercise: ExerciseItem; edit?: FeelEdit }) {
  const [abierto, setAbierto] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState("");

  const carga = exercise.load_feel ?? null;
  const dolor = exercise.pain ?? null;

  if (!edit || exercise.id === undefined) {
    if (carga === null && dolor === null) return null;
    return (
      <p className="m-0 text-sm text-muted-foreground">
        {[carga && `Carga ${textoDeCarga(carga).toLowerCase()}`, dolor && `Dolor ${textoDeDolor(dolor).toLowerCase()}`]
          .filter(Boolean)
          .join(" · ")}
      </p>
    );
  }

  const cambio = edit;

  async function guardar(cuerpo: { load_feel?: LoadFeel | null; pain?: PainLevel | null }) {
    setTrabajando(true);
    setError("");
    try {
      const res = await apiFetch(
        `/weeks/${cambio.weekId}/days/${cambio.dayIndex}/exercises/${exercise.id}/feel`,
        { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) },
      );
      if (res.ok) cambio.onChanged(await res.json());
      else setError(await readError(res));
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setTrabajando(false);
  }

  const resumen = [carga && textoDeCarga(carga), dolor && `dolor ${textoDeDolor(dolor).toLowerCase()}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="rounded-xl border border-dashed border-border bg-card">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-4 py-2 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span>
          ¿Cómo te fue? <span className="text-sm text-muted-foreground">{resumen || "opcional"}</span>
        </span>
        <ChevronDown aria-hidden className={cn("size-4 shrink-0 transition-transform", abierto && "rotate-180")} />
      </button>

      {abierto && (
        <div className="grid gap-4 px-4 pb-4">
          <Fila titulo="Carga" columnas={2}>
            {CARGAS.map((c) => (
              <Opcion
                key={c.valor}
                activa={carga === c.valor}
                disabled={trabajando}
                onClick={() => guardar({ load_feel: carga === c.valor ? null : c.valor })}
              >
                {c.texto}
              </Opcion>
            ))}
          </Fila>
          <Fila titulo="Dolor" columnas={3}>
            {DOLORES.map((d) => (
              <Opcion
                key={d.valor}
                activa={dolor === d.valor}
                color="amarillo"
                disabled={trabajando}
                onClick={() => guardar({ pain: dolor === d.valor ? null : d.valor })}
              >
                {d.texto}
              </Opcion>
            ))}
          </Fila>
          {dolor === "strong" && (
            <p role="status" className="m-0 rounded-xl border border-disco-amarillo bg-disco-amarillo/20 px-3 py-2 text-sm">
              Con dolor fuerte, pará y consultá a un profesional. Spotter no da diagnósticos.
            </p>
          )}
          {error && <InlineError>{error}</InlineError>}
        </div>
      )}
    </section>
  );
}

function Fila({
  titulo,
  columnas,
  children,
}: {
  titulo: string;
  columnas: 2 | 3;
  children: React.ReactNode;
}) {
  return (
    <div role="group" aria-label={titulo}>
      <p className="mt-0 mb-1.5 text-sm text-muted-foreground">{titulo}</p>
      <div className={cn("grid gap-2", columnas === 2 ? "grid-cols-2" : "grid-cols-3")}>{children}</div>
    </div>
  );
}

function Opcion({
  activa,
  color = "azul",
  disabled,
  onClick,
  children,
}: {
  activa: boolean;
  color?: "azul" | "amarillo";
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={activa}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-full border px-2 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        activa
          ? color === "azul"
            ? "border-disco-azul bg-disco-azul text-white"
            : "border-disco-tinta bg-disco-amarillo text-disco-tinta"
          : "border-border bg-background",
      )}
    >
      {children}
    </button>
  );
}
