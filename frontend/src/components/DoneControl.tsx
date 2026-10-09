"use client";

import { useState } from "react";

import { API, readError, type ExerciseItem } from "@/lib/api";
import { differsFromPlan, estaHecho, seriesRegistradas } from "@/lib/format";

export type DoneEdit = {
  weekId: number;
  dayIndex: number;
  onChanged: (updated: ExerciseItem) => void;
};

// El estado del ejercicio y sus botones: "Marcar como hecho" (lo hice como estaba planificado:
// las series sin registrar copian el plan y las que ya editaste se respetan) y "Deshacer"
// (borra lo registrado de ese ejercicio). Sin `edit` (día completado) solo muestra el estado.
export function DoneControl({ exercise, edit }: { exercise: ExerciseItem; edit?: DoneEdit }) {
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState("");

  const total = exercise.sets.length;
  const registradas = seriesRegistradas(exercise);
  const hecho = estaHecho(exercise);

  async function llamar(method: "POST" | "DELETE") {
    if (!edit || exercise.id === undefined) return;
    setTrabajando(true);
    setError("");
    try {
      const res = await fetch(
        `${API}/weeks/${edit.weekId}/days/${edit.dayIndex}/exercises/${exercise.id}/done`,
        { method },
      );
      if (res.ok) edit.onChanged(await res.json());
      else setError(await readError(res));
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setTrabajando(false);
  }

  function deshacer() {
    // Destildar borra lo registrado: si hay series que editaste a mano, se pide confirmación.
    const editadas = exercise.sets.some((s) => s.real && differsFromPlan(s, s.real));
    if (editadas && !window.confirm("Se van a borrar las series que registraste en este ejercicio. ¿Seguro?")) {
      return;
    }
    llamar("DELETE");
  }

  const estado = hecho
    ? "✓ Hecho"
    : registradas > 0
      ? `${registradas} de ${total} series registradas`
      : "";
  const puedeEditar = edit !== undefined && exercise.id !== undefined;

  return (
    <div>
      {estado && <small>{estado}</small>}
      {puedeEditar && !hecho && (
        <>
          {estado && " "}
          <button type="button" onClick={() => llamar("POST")} disabled={trabajando}>
            Marcar como hecho
          </button>
        </>
      )}
      {puedeEditar && registradas > 0 && (
        <>
          {" "}
          <button type="button" onClick={deshacer} disabled={trabajando}>
            Deshacer
          </button>
        </>
      )}
      {error && (
        <div>
          <small style={{ color: "crimson" }}>{error}</small>
        </div>
      )}
    </div>
  );
}
