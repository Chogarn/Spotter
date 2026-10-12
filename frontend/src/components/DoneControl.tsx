"use client";

import { Check, LockOpen, Trash2 } from "lucide-react";
import { useState } from "react";

import { readError, type ExerciseItem, apiFetch } from "@/lib/api";
import { estaHecho, seriesRegistradas } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Confirmar } from "@/components/Confirmar";
import { InlineError } from "@/components/ErrorMessage";

export type DoneEdit = {
  weekId: number;
  dayIndex: number;
  onChanged: (updated: ExerciseItem) => void;
};

// Los botones del ejercicio, como íconos (decisión 43).
//  - Tilde, marcar como hecho: cierra el ejercicio (lo hice como estaba planificado: las series sin
//    registrar copian el plan y las que ya marcaste o editaste se respetan). Cerrado, sus series
//    no se pueden editar, marcar ni desmarcar.
//  - Candado abierto, reabrir: lo desbloquea para corregirlo, sin borrar nada de lo registrado.
//  - Tacho, deshacer: borra lo registrado de ese ejercicio; siempre pide confirmación.
// Sin `edit` (día completado o semana cerrada) no muestra nada.
export function DoneControl({ exercise, edit }: { exercise: ExerciseItem; edit?: DoneEdit }) {
  const [trabajando, setTrabajando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState("");

  const hechas = seriesRegistradas(exercise);
  const hecho = estaHecho(exercise);

  async function llamar(method: "POST" | "DELETE", accion: "done" | "reopen") {
    if (!edit || exercise.id === undefined) return;
    setTrabajando(true);
    setError("");
    try {
      const res = await apiFetch(`/weeks/${edit.weekId}/days/${edit.dayIndex}/exercises/${exercise.id}/${accion}`,
        { method },
      );
      if (res.ok) edit.onChanged(await res.json());
      else setError(await readError(res));
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setTrabajando(false);
  }

  if (!edit || exercise.id === undefined) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1.5">
        {!hecho && (
          <Button
            size="icon-lg"
            type="button"
            onClick={() => llamar("POST", "done")}
            disabled={trabajando}
            aria-label={`Marcar ${exercise.name} como hecho`}
          >
            <Check />
          </Button>
        )}
        {hecho && (
          <Button
            size="icon-lg"
            variant="outline"
            type="button"
            onClick={() => llamar("POST", "reopen")}
            disabled={trabajando}
            aria-label={`Reabrir ${exercise.name}`}
          >
            <LockOpen />
          </Button>
        )}
        {hechas > 0 && (
          <Button
            size="icon-lg"
            variant="outline"
            type="button"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmando(true)}
            disabled={trabajando}
            aria-label={`Deshacer ${exercise.name}: borra lo registrado`}
          >
            <Trash2 />
          </Button>
        )}
      </div>
      {error && <InlineError>{error}</InlineError>}
      <Confirmar
        abierto={confirmando}
        titulo={`¿Borrar lo registrado en ${exercise.name}?`}
        texto={`${hechas === 1 ? "La serie registrada vuelve" : `Las ${hechas} series registradas vuelven`} a quedar sin hacer${hecho ? " y el ejercicio se reabre" : ""}.`}
        accion="Borrar"
        onCancelar={() => setConfirmando(false)}
        onConfirmar={() => {
          setConfirmando(false);
          llamar("DELETE", "done");
        }}
      />
    </div>
  );
}
