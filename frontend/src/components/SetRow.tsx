"use client";

import { Check, Pencil, X } from "lucide-react";
import { useState } from "react";

import { readError, type ExerciseItem, type SetItem, apiFetch } from "@/lib/api";
import { differsFromPlan, realAsSet, setText } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DiscoSerie } from "@/components/DiscoSerie";
import { InlineError } from "@/components/ErrorMessage";

export type SetEdit = {
  weekId: number;
  dayIndex: number;
  onSaved: (updated: SetItem) => void;
};

// Lo que se mide en cada tipo de ejercicio y cómo se llama el campo.
const MEASURE = {
  strength: { label: "repeticiones", unit: "reps" },
  isometric: { label: "segundos", unit: "s" },
  cardio: { label: "minutos", unit: "min" },
} as const;

// Una serie (decisión 43): su disco (que se toca para marcarla o desmarcarla, ver `DiscoSerie`) y,
// con `edit`, el lápiz para corregir lo realizado (repeticiones y kilos; segundos o minutos según
// el ejercicio) sin tocar el plan.
// El modo entrenar la abre ya editando (`editarAlAbrir`) y se entera al guardar o cancelar
// (`onTerminar`).
export function SetRow({
  kind,
  index,
  set,
  edit,
  editarAlAbrir = false,
  onTerminar,
}: {
  kind: ExerciseItem["kind"];
  index: number;
  set: SetItem;
  edit?: SetEdit;
  editarAlAbrir?: boolean;
  onTerminar?: () => void;
}) {
  const real = set.real ?? null;
  const mostrada = real ? realAsSet(real) : set;
  const cambio = real !== null && differsFromPlan(set, real);
  const numero = index + 1;
  const puedeEditar = edit !== undefined && set.id !== undefined;

  // Al empezar a editar, los campos arrancan con lo realizado o, si no hay, con lo planificado.
  const medidaActual =
    kind === "strength"
      ? mostrada.reps
      : kind === "isometric"
        ? mostrada.duration_seconds
        : mostrada.duration_minutes;
  const valorMedida = medidaActual === null ? "" : String(medidaActual);
  const valorKilos = mostrada.target_weight_kg === null ? "" : String(mostrada.target_weight_kg);

  const [editando, setEditando] = useState(editarAlAbrir && puedeEditar);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [medida, setMedida] = useState(valorMedida);
  const [kilos, setKilos] = useState(valorKilos);

  function empezar() {
    setMedida(valorMedida);
    setKilos(valorKilos);
    setError("");
    setEditando(true);
  }

  function cancelar() {
    setEditando(false);
    onTerminar?.();
  }

  async function guardar() {
    if (!edit || set.id === undefined) return;
    const valor = Number(medida);
    if (medida.trim() === "" || !Number.isInteger(valor) || valor < 1) {
      setError(`Escribí ${MEASURE[kind].label} como un número entero mayor que 0`);
      return;
    }
    const body: Record<string, number | null> = {};
    if (kind === "strength") {
      body.reps = valor;
      const texto = kilos.trim().replace(",", ".");
      const peso = texto === "" ? null : Number(texto);
      if (peso !== null && (!Number.isFinite(peso) || peso < 0)) {
        setError("Los kilos tienen que ser un número, o quedar vacíos");
        return;
      }
      body.weight_kg = peso;
    } else if (kind === "isometric") {
      body.duration_seconds = valor;
    } else {
      body.duration_minutes = valor;
    }

    setGuardando(true);
    setError("");
    try {
      const res = await apiFetch(`/weeks/${edit.weekId}/days/${edit.dayIndex}/sets/${set.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        setError(await readError(res));
      } else {
        edit.onSaved(await res.json());
        setEditando(false);
        onTerminar?.();
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setGuardando(false);
  }

  return (
    <li className="border-t border-border py-2 first:border-t-0">
      <div className="flex min-h-9 items-center gap-3">
        <DiscoSerie
          kind={kind}
          index={index}
          set={set}
          edit={puedeEditar && !editando ? edit : undefined}
          onError={setError}
          className="size-8"
        />

        {editando ? (
          <span className="flex flex-1 flex-wrap items-center gap-1.5 text-sm">
            <Input
              aria-label={`Serie ${numero}: ${MEASURE[kind].label}`}
              type="number"
              min={1}
              value={medida}
              onChange={(e) => setMedida(e.target.value)}
              className="h-9 w-16"
            />
            {MEASURE[kind].unit}
            {kind === "strength" && (
              <>
                <Input
                  aria-label={`Serie ${numero}: kilos`}
                  inputMode="decimal"
                  value={kilos}
                  onChange={(e) => setKilos(e.target.value)}
                  className="ml-1 h-9 w-18"
                />
                kg
              </>
            )}
          </span>
        ) : (
          <span className="flex-1">
            {setText(kind, mostrada)}
            {cambio && <span className="ml-2 text-sm text-muted-foreground">tocaba {setText(kind, set)}</span>}
          </span>
        )}

        {puedeEditar && editando && (
          <span className="flex gap-1.5">
            <Button size="icon-lg" type="button" onClick={guardar} disabled={guardando} aria-label={`Guardar serie ${numero}`}>
              <Check />
            </Button>
            <Button
              size="icon-lg"
              variant="outline"
              type="button"
              onClick={cancelar}
              disabled={guardando}
              aria-label={`Cancelar la edición de la serie ${numero}`}
            >
              <X />
            </Button>
          </span>
        )}
        {puedeEditar && !editando && (
          <Button
            size="icon-lg"
            variant="outline"
            type="button"
            onClick={empezar}
            aria-label={`Editar serie ${numero}`}
          >
            <Pencil />
          </Button>
        )}
      </div>
      {error && <InlineError>{error}</InlineError>}
    </li>
  );
}
