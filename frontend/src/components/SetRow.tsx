"use client";

import { useState } from "react";

import { API, readError, type ExerciseItem, type SetItem } from "@/lib/api";
import { differsFromPlan, realAsSet, setText } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

// Una serie del desglose. Con `edit`, tiene un botón Editar que deja corregir lo realizado
// (repeticiones y kilos; segundos o minutos según el ejercicio) y lo guarda sin tocar el plan.
export function SetRow({
  kind,
  index,
  set,
  edit,
}: {
  kind: ExerciseItem["kind"];
  index: number;
  set: SetItem;
  edit?: SetEdit;
}) {
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [marcando, setMarcando] = useState(false);
  const [error, setError] = useState("");
  const [medida, setMedida] = useState("");
  const [kilos, setKilos] = useState("");

  const real = set.real ?? null;
  const mostrada = real ? realAsSet(real) : set;
  const cambio = real !== null && differsFromPlan(set, real);

  // Marcar como hecha (lo planificado) y Desmarcar (borra lo registrado de esta serie).
  async function cambiarHecha(method: "POST" | "DELETE") {
    if (!edit || set.id === undefined) return;
    setMarcando(true);
    setError("");
    try {
      const res = await fetch(
        `${API}/weeks/${edit.weekId}/days/${edit.dayIndex}/sets/${set.id}/done`,
        { method },
      );
      if (res.ok) edit.onSaved(await res.json());
      else setError(await readError(res));
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setMarcando(false);
  }

  const marcar = () => cambiarHecha("POST");

  function desmarcar() {
    // Si la serie tiene valores editados, desmarcarla los borra: se pide confirmación.
    if (cambio && !window.confirm("Se va a borrar lo que registraste en esta serie. ¿Seguro?")) {
      return;
    }
    cambiarHecha("DELETE");
  }

  function empezar() {
    const actual =
      kind === "strength"
        ? mostrada.reps
        : kind === "isometric"
          ? mostrada.duration_seconds
          : mostrada.duration_minutes;
    setMedida(actual === null ? "" : String(actual));
    setKilos(mostrada.target_weight_kg === null ? "" : String(mostrada.target_weight_kg));
    setError("");
    setEditando(true);
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
      const res = await fetch(
        `${API}/weeks/${edit.weekId}/days/${edit.dayIndex}/sets/${set.id}`,
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
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setGuardando(false);
  }

  if (editando) {
    return (
      <li>
        <small>
          Serie {index + 1} ·{" "}
          <Input
            aria-label={`Serie ${index + 1}: ${MEASURE[kind].label}`}
            type="number"
            min={1}
            value={medida}
            onChange={(e) => setMedida(e.target.value)}
            className="inline-flex h-7 w-20"
          />{" "}
          {MEASURE[kind].unit}
          {kind === "strength" && (
            <>
              {" · "}
              <Input
                aria-label={`Serie ${index + 1}: kilos`}
                inputMode="decimal"
                value={kilos}
                onChange={(e) => setKilos(e.target.value)}
                className="inline-flex h-7 w-20"
              />{" "}
              kg
            </>
          )}{" "}
          <Button type="button" onClick={guardar} disabled={guardando}>
            Guardar
          </Button>{" "}
          <Button type="button" onClick={() => setEditando(false)} disabled={guardando}>
            Cancelar
          </Button>
        </small>
        {error && (
          <div>
            <small style={{ color: "crimson" }}>{error}</small>
          </div>
        )}
      </li>
    );
  }

  return (
    <li>
      <small>
        Serie {index + 1} · {setText(kind, mostrada)}
        {cambio && <> (tocaba {setText(kind, set)})</>}
        {real && <> · ✓ hecha</>}
        {edit && set.id !== undefined && (
          <>
            {" "}
            {!real && (
              <>
                <Button type="button" onClick={marcar} disabled={marcando}>
                  Marcar como hecha
                </Button>{" "}
              </>
            )}
            <Button type="button" onClick={empezar} disabled={marcando}>
              Editar
            </Button>
            {real && (
              <>
                {" "}
                <Button type="button" onClick={desmarcar} disabled={marcando}>
                  Desmarcar
                </Button>
              </>
            )}
          </>
        )}
      </small>
      {error && (
        <div>
          <small style={{ color: "crimson" }}>{error}</small>
        </div>
      )}
    </li>
  );
}
