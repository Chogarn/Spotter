"use client";

import { useState } from "react";

import { API, readError, type ExerciseItem } from "@/lib/api";
import { differsFromPlan, estaHecho, seriesRegistradas } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { InlineError } from "@/components/ErrorMessage";

export type DoneEdit = {
  weekId: number;
  dayIndex: number;
  onChanged: (updated: ExerciseItem) => void;
};

// El estado del ejercicio y sus botones.
//  - Marcar como hecho: cierra el ejercicio (lo hice como estaba planificado: las series sin
//    registrar copian el plan y las que ya marcaste o editaste se respetan). Cerrado, sus series
//    no se pueden editar, marcar ni desmarcar.
//  - Reabrir ejercicio: lo desbloquea para corregirlo, sin borrar nada de lo registrado.
//  - Deshacer: borra lo registrado de ese ejercicio.
// Sin `edit` (día completado) solo muestra el estado.
export function DoneControl({ exercise, edit }: { exercise: ExerciseItem; edit?: DoneEdit }) {
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState("");

  const total = exercise.sets.length;
  const hechas = seriesRegistradas(exercise);
  const hecho = estaHecho(exercise);

  async function llamar(method: "POST" | "DELETE", accion: "done" | "reopen") {
    if (!edit || exercise.id === undefined) return;
    setTrabajando(true);
    setError("");
    try {
      const res = await fetch(
        `${API}/weeks/${edit.weekId}/days/${edit.dayIndex}/exercises/${exercise.id}/${accion}`,
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
    // Deshacer borra lo registrado: si hay series que editaste a mano, se pide confirmación.
    const editadas = exercise.sets.some((s) => s.real && differsFromPlan(s, s.real));
    if (editadas && !window.confirm("Se van a borrar las series que registraste en este ejercicio. ¿Seguro?")) {
      return;
    }
    llamar("DELETE", "done");
  }

  const estado = hecho
    ? "✓ Hecho"
    : hechas > 0
      ? `${hechas} de ${total} series hechas`
      : "";
  const puedeEditar = edit !== undefined && exercise.id !== undefined;

  return (
    <div>
      {estado && <small>{estado}</small>}
      {puedeEditar && !hecho && (
        <>
          {estado && " "}
          <Button type="button" onClick={() => llamar("POST", "done")} disabled={trabajando}>
            Marcar como hecho
          </Button>
        </>
      )}
      {puedeEditar && hecho && (
        <>
          {" "}
          <Button type="button" onClick={() => llamar("POST", "reopen")} disabled={trabajando}>
            Reabrir ejercicio
          </Button>
        </>
      )}
      {puedeEditar && hechas > 0 && (
        <>
          {" "}
          <Button type="button" onClick={deshacer} disabled={trabajando}>
            Deshacer
          </Button>
        </>
      )}
      {error && (
        <div>
          <InlineError>{error}</InlineError>
        </div>
      )}
    </div>
  );
}
