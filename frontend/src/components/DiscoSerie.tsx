"use client";

import { useState } from "react";

import { readError, type ExerciseItem, type SetItem, apiFetch } from "@/lib/api";
import { differsFromPlan, realAsSet, setText } from "@/lib/format";
import { Confirmar } from "@/components/Confirmar";
import { Disco } from "@/components/Disco";

export type DiscoEdit = {
  weekId: number;
  dayIndex: number;
  onSaved: (updated: SetItem) => void;
};

// El disco de una serie (decisión 43). Muestra si está hecha y, con `edit`, tocarlo la marca como
// hecha (lo planificado) o la desmarca (borra lo registrado; si estaba editada, pide confirmación).
// Lo usan la fila de cada serie y la fila de discos de la tarjeta del ejercicio.
export function DiscoSerie({
  kind,
  index,
  set,
  edit,
  onError,
  className,
}: {
  kind: ExerciseItem["kind"];
  index: number;
  set: SetItem;
  edit?: DiscoEdit;
  onError: (mensaje: string) => void;
  className?: string;
}) {
  const [marcando, setMarcando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const real = set.real ?? null;
  const numero = index + 1;
  const disco = (
    <Disco estado={real ? "hecho" : "pendiente"} className={className}>
      {numero}
    </Disco>
  );
  if (!edit || set.id === undefined) return disco;

  async function cambiarHecha(method: "POST" | "DELETE") {
    if (!edit || set.id === undefined) return;
    setMarcando(true);
    onError("");
    try {
      const res = await apiFetch(`/weeks/${edit.weekId}/days/${edit.dayIndex}/sets/${set.id}/done`,
        { method },
      );
      if (res.ok) edit.onSaved(await res.json());
      else onError(await readError(res));
    } catch {
      onError("No se pudo conectar con el servidor");
    }
    setMarcando(false);
  }

  function tocar() {
    if (!real) return cambiarHecha("POST");
    // Si la serie tiene valores editados, desmarcarla los borra: se pide confirmación.
    if (differsFromPlan(set, real)) return setConfirmando(true);
    cambiarHecha("DELETE");
  }

  return (
    <>
      <button
        type="button"
        onClick={tocar}
        disabled={marcando}
        aria-pressed={real !== null}
        aria-label={`Serie ${numero}: ${real ? "desmarcar" : "marcar como hecha"}`}
        className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
      >
        {disco}
      </button>
      <Confirmar
        abierto={confirmando}
        titulo={`¿Desmarcar la serie ${numero}?`}
        texto={`Se borra lo que registraste (${real ? setText(kind, realAsSet(real)) : ""}) y la serie vuelve a quedar sin hacer.`}
        accion="Desmarcar"
        onCancelar={() => setConfirmando(false)}
        onConfirmar={() => {
          setConfirmando(false);
          cambiarHecha("DELETE");
        }}
      />
    </>
  );
}
