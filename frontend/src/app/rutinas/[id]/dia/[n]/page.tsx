"use client";

import { use, useEffect, useState } from "react";

import { BackButton } from "@/components/BackButton";
import { ExerciseRow } from "@/components/ExerciseRow";
import { API, readError, type DayDetail, type ExerciseItem, type SetItem } from "@/lib/api";
import { estaHecho } from "@/lib/format";

export default function DiaPage({ params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = use(params);
  const [dia, setDia] = useState<DayDetail | null>(null);
  const [error, setError] = useState("");
  const [trabajando, setTrabajando] = useState(false);

  useEffect(() => {
    fetch(`${API}/weeks/${id}/days/${n}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        setDia(await res.json());
      })
      .catch((e) => setError(e.message));
  }, [id, n]);

  // Al guardar una serie, el backend devuelve esa serie actualizada: se reemplaza en pantalla.
  function serieGuardada(updated: SetItem) {
    setDia((actual) =>
      actual
        ? {
            ...actual,
            exercises: actual.exercises.map((e) => ({
              ...e,
              sets: e.sets.map((s) => (s.id === updated.id ? updated : s)),
            })),
          }
        : actual,
    );
  }

  // Al marcar o deshacer un ejercicio, el backend devuelve el ejercicio entero actualizado.
  function ejercicioCambiado(updated: ExerciseItem) {
    setDia((actual) =>
      actual
        ? { ...actual, exercises: actual.exercises.map((e) => (e.id === updated.id ? updated : e)) }
        : actual,
    );
  }

  async function cambiarDia(accion: "complete" | "reopen") {
    if (!dia) return;
    setError("");
    setTrabajando(true);
    try {
      const res = await fetch(`${API}/weeks/${dia.week_id}/days/${dia.day_index}/${accion}`, {
        method: "POST",
      });
      if (res.ok) {
        const estado = await res.json();
        setDia((actual) => (actual ? { ...actual, finished_at: estado.finished_at } : actual));
      } else {
        setError(await readError(res));
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setTrabajando(false);
  }

  // Solo se registra en la semana activa; las cerradas quedan en lectura.
  const activa = dia?.week_status === "active";
  const completado = dia?.finished_at != null;
  const edit =
    dia && activa
      ? {
          weekId: dia.week_id,
          dayIndex: dia.day_index,
          locked: completado,
          onSetSaved: serieGuardada,
          onExerciseChanged: ejercicioCambiado,
        }
      : undefined;
  const hechos = dia ? dia.exercises.filter(estaHecho).length : 0;

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <BackButton href={`/rutinas/${id}`}>
        ← {dia ? `Semana ${dia.week_number}` : "Volver a la semana"}
      </BackButton>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {!dia && !error && <p>Cargando...</p>}
      {dia && (
        <>
          <h1>
            Día {dia.day_index} · {dia.title}{" "}
            <small style={{ fontWeight: "normal" }}>
              ~{dia.minutes} min{completado && " · ✓ completado"}
            </small>
          </h1>
          {dia.mobility_notes && <p>Movilidad: {dia.mobility_notes}</p>}
          <ol>
            {dia.exercises.map((e, i) => (
              <ExerciseRow key={i} exercise={e} edit={edit} />
            ))}
          </ol>
          {activa && (
            <p>
              <small>
                Hechos: {hechos} de {dia.exercises.length} ejercicios
              </small>
              <br />
              {completado ? (
                <>
                  ✓ Día completado{" "}
                  <button type="button" onClick={() => cambiarDia("reopen")} disabled={trabajando}>
                    Reabrir día
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => cambiarDia("complete")} disabled={trabajando}>
                  Día completado
                </button>
              )}
            </p>
          )}
          <p>
            <small>Los pesos son orientativos. La app no da consejo médico.</small>
          </p>
        </>
      )}
    </main>
  );
}
